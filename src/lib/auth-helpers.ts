import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { isMockMode } from "@/lib/config";
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

  const auth = getAuth();
  if (!auth) return null;

  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session || session.user.banned) return null;

  const u = session.user;
  return {
    id: u.id,
    displayName: u.name,
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
