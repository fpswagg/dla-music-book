import "server-only";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getAdminEmails, isAuthConfigured, isEmailConfigured, isGoogleConfigured } from "./config";
import { consumeToken, createToken, siteLink } from "./auth-tokens";
import { buildAuthMail, sendMail, type MailLocale } from "./mailer";
import { verifyPassword } from "./passwords";
import { prisma } from "./prisma";

class NotVerified extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED";
}
class Banned extends CredentialsSignin {
  code = "ACCOUNT_BANNED";
}

const isAdminEmail = (email: string) => getAdminEmails().includes(email.toLowerCase());

/** Sends (or re-sends) the email verification link. */
export async function sendVerificationMail(email: string, locale: MailLocale = "fr") {
  const token = await createToken("verify", email, 24 * 3600);
  await sendMail(buildAuthMail("verify", locale, email, siteLink("/api/account/verify", { token })));
}

/** Promotes bootstrap admin emails; returns the fresh user row. */
async function loadUser(where: { id: string } | { email: string }) {
  if (!prisma) return null;
  const user = await prisma.user.findUnique({ where });
  if (user && user.role !== "ADMIN" && isAdminEmail(user.email)) {
    return prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  }
  return user;
}

const toAuthUser = (u: { id: string; email: string; displayName: string; image: string | null }) => ({
  id: u.id,
  email: u.email,
  name: u.displayName,
  image: u.image,
});

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  secret: process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 3600 },
  pages: { signIn: "/auth/login", error: "/auth/login" },
  providers: [
    ...(isGoogleConfigured()
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
    Credentials({
      id: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        if (!prisma || !isAuthConfigured()) return null;
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!email || !password) return null;
        const user = await loadUser({ email });
        const account = user
          ? await prisma.account.findFirst({ where: { userId: user.id, providerId: "credential" } })
          : null;
        if (!user || !verifyPassword(password, account?.password)) return null;
        if (user.banned) throw new Banned();
        if (isEmailConfigured() && !user.emailVerified) {
          await sendVerificationMail(user.email).catch(() => {});
          throw new NotVerified();
        }
        return toAuthUser(user);
      },
    }),
    // Passwordless sign-in: the emailed link carries a one-time token (see /api/account/magic).
    Credentials({
      id: "magic",
      credentials: { token: {} },
      async authorize(raw) {
        if (!prisma) return null;
        const email = await consumeToken("magic", String(raw?.token ?? ""));
        if (!email) return null;
        let user = await loadUser({ email });
        if (!user) {
          user = await prisma.user.create({
            data: { email, displayName: email.split("@")[0], emailVerified: true, role: isAdminEmail(email) ? "ADMIN" : "USER" },
          });
        } else if (!user.emailVerified) {
          user = await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
        }
        if (user.banned) throw new Banned();
        return toAuthUser(user);
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      if (!prisma || !profile?.email || profile.email_verified === false) return false;
      const email = profile.email.toLowerCase();
      let dbUser = await loadUser({ email });
      if (dbUser?.banned) return "/auth/login?error=ACCOUNT_BANNED";
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email,
            displayName: profile.name?.trim() || email.split("@")[0],
            image: typeof profile.picture === "string" ? profile.picture : null,
            emailVerified: true,
            role: isAdminEmail(email) ? "ADMIN" : "USER",
          },
        });
      } else if (!dbUser.emailVerified) {
        await prisma.user.update({ where: { id: dbUser.id }, data: { emailVerified: true } });
      }
      const accountId = account.providerAccountId;
      const existing = await prisma.account.findFirst({ where: { userId: dbUser.id, providerId: "google", accountId } });
      if (!existing) await prisma.account.create({ data: { userId: dbUser.id, providerId: "google", accountId } });
      user.id = dbUser.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.sub) (session.user as { id?: string }).id = token.sub;
      return session;
    },
  },
}));
