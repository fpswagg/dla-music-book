import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";
import { getMockCurrentUser } from "@/lib/mock/provider";

export type AppUser = {
  id: string;
  supabaseUserId: string;
  displayName: string;
  role: "USER" | "ADMIN";
  email?: string;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  if (isMockMode()) {
    const mock = getMockCurrentUser();
    return {
      id: mock.id,
      supabaseUserId: mock.supabaseUserId,
      displayName: mock.displayName,
      role: mock.role as "USER" | "ADMIN",
    };
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (!prisma) return null;

  let profile = await prisma.userProfile.findUnique({
    where: { supabaseUserId: user.id },
  });

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: {
        supabaseUserId: user.id,
        displayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
        role: "USER",
      },
    });
  }

  return {
    id: profile.id,
    supabaseUserId: profile.supabaseUserId,
    displayName: profile.displayName,
    role: profile.role,
    email: user.email ?? undefined,
  };
}

export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
