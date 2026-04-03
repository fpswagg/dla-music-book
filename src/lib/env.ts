export type AppMode = "full" | "db-only" | "mock";

export function getAppMode(): AppMode {
  const hasDb = !!process.env.DATABASE_URL;
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (hasDb && hasSupabase) return "full";
  if (hasDb) return "db-only";
  return "mock";
}

export function isMockMode(): boolean {
  return getAppMode() === "mock";
}

export function hasSupabase(): boolean {
  return getAppMode() === "full";
}

export function hasDatabase(): boolean {
  return getAppMode() !== "mock";
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
