import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  getAdminEmails,
  getSiteUrl,
  isAuthConfigured,
  isEmailConfigured,
  isGoogleConfigured,
} from "./config";
import { buildAuthMail, localeFromRequest, sendMail } from "./mailer";
import { prisma } from "./prisma";

/**
 * Lets the admin "reset link" action receive the URL instead of emailing it.
 * On globalThis like the auth instance: Next bundles routes separately, so a module-level
 * Map would not be the one the shared auth instance sees.
 */
const globalForCaptures = globalThis as unknown as { resetCaptures?: Map<string, (url: string) => void> };
const resetCaptures = (globalForCaptures.resetCaptures ??= new Map<string, (url: string) => void>());

function trustedOrigins(): string[] {
  const out = new Set<string>([getSiteUrl()]);
  if (process.env.VERCEL_URL) out.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL) out.add(`https://${process.env.VERCEL_BRANCH_URL}`);
  if (process.env.NODE_ENV !== "production") out.add("http://localhost:3000");
  return [...out];
}

function createAuth(db: PrismaClient) {
  const emailOn = isEmailConfigured();
  const adminEmails = getAdminEmails();

  return betterAuth({
    appName: "Myenge ma Bonakristo",
    baseURL: getSiteUrl(),
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: trustedOrigins(),
    database: prismaAdapter(db, { provider: "postgresql" }),
    telemetry: { enabled: false },
    advanced: { database: { generateId: () => crypto.randomUUID() } },
    user: {
      fields: { name: "displayName" },
      additionalFields: {
        role: { type: "string", defaultValue: "USER", input: false },
        banned: { type: "boolean", defaultValue: false, input: false },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // Without an email provider nobody could ever verify, so verification is only required with Resend.
      requireEmailVerification: emailOn,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        const capture = resetCaptures.get(user.id);
        if (capture) return capture(url);
        await sendMail(buildAuthMail("reset", localeFromRequest(request), user.email, url));
      },
    },
    emailVerification: emailOn
      ? {
          sendOnSignUp: true,
          sendOnSignIn: true,
          autoSignInAfterVerification: true,
          sendVerificationEmail: async ({ user, url }, request) => {
            await sendMail(buildAuthMail("verify", localeFromRequest(request), user.email, url));
          },
        }
      : undefined,
    socialProviders: isGoogleConfigured()
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            prompt: "select_account",
          },
        }
      : {},
    account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const email = user.email.toLowerCase();
            return {
              data: {
                ...user,
                email,
                name: user.name?.trim() || email.split("@")[0],
                role: adminEmails.includes(email) ? "ADMIN" : "USER",
              },
            };
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const user = await db.user.findUnique({
              where: { id: session.userId },
              select: { banned: true, role: true, email: true },
            });
            if (user?.banned) throw new APIError("FORBIDDEN", { message: "ACCOUNT_BANNED" });
            if (user && user.role !== "ADMIN" && adminEmails.includes(user.email.toLowerCase())) {
              await db.user.update({ where: { id: session.userId }, data: { role: "ADMIN" } });
            }
            return { data: session };
          },
        },
      },
    },
    plugins: [
      ...(emailOn
        ? [
            magicLink({
              expiresIn: 15 * 60,
              sendMagicLink: async ({ email, url }, ctx) => {
                await sendMail(buildAuthMail("magic", localeFromRequest(ctx?.request), email, url));
              },
            }),
          ]
        : []),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as unknown as { auth?: Auth };

/** The Better Auth instance, or null when sign-in is not configured (demo mode, or no secret in production). */
export function getAuth(): Auth | null {
  if (!prisma || !isAuthConfigured()) return null;
  globalForAuth.auth ??= createAuth(prisma);
  return globalForAuth.auth;
}

/**
 * Creates a password-reset link for a user without emailing it (admin action when email
 * is not configured, or to hand the link over directly). Returns null if it failed.
 */
export async function createPasswordResetLink(user: { id: string; email: string }): Promise<string | null> {
  const auth = getAuth();
  if (!auth) return null;
  let link: string | null = null;
  resetCaptures.set(user.id, (url) => {
    link = url;
  });
  try {
    await auth.api.requestPasswordReset({
      body: { email: user.email, redirectTo: `${getSiteUrl()}/auth/reset-password` },
    });
  } finally {
    resetCaptures.delete(user.id);
  }
  return link;
}
