import "server-only";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAuthConfigured, isMockMode } from "@/lib/config";
import { getMockCurrentUser } from "@/lib/mock/provider";

export type AppUser = {
  id: string;
  displayName: string;
  role: "USER" | "ADMIN";
  email?: string;
  emailVerified?: boolean;
  image?: string | null;
};

/** Signed-in user for this request (deduplicated per request), or null. */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  if (isMockMode()) {
    const mock = getMockCurrentUser();
    return { id: mock.id, displayName: mock.displayName, role: mock.role as AppUser["role"] };
  }

  if (!prisma || !isAuthConfigured()) return null;

  const session = await auth().catch(() => null);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u || u.banned) return null;

  return {
    id: u.id,
    displayName: u.displayName,
    role: u.role === "ADMIN" ? "ADMIN" : "USER",
    email: u.email,
    emailVerified: u.emailVerified,
    image: u.image ?? null,
  };
});

export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
