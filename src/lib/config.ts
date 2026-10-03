import "server-only";

/**
 * Central runtime configuration. Every optional integration has an `isXConfigured()` helper;
 * the app must work (degraded) when any of them is missing. Documented in .env.example.
 *
 *   Database  DATABASE_URL                                    → otherwise demo ("mock") mode on JSON data
 *   Auth      BETTER_AUTH_SECRET (+ database)                 → required for sign-in in production
 *   Google    GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET         → "Continue with Google" button
 *   Email     RESEND_API_KEY + RESEND_FROM                    → verification, reset and magic-link emails
 *   Storage   SASTORAGE_URL + SASTORAGE_TOKEN                 → audio previews and backups
 */

export type AppMode = "db" | "mock";

const has = (...names: string[]) => names.every((n) => !!process.env[n]?.trim());

export const isDatabaseConfigured = () => has("DATABASE_URL");
export const isAuthSecretConfigured = () => has("BETTER_AUTH_SECRET");
/** Sign-in needs the database; in production it also needs a real secret. */
export const isAuthConfigured = () =>
  isDatabaseConfigured() && (isAuthSecretConfigured() || process.env.NODE_ENV !== "production");
export const isGoogleConfigured = () => has("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET");
export const isEmailConfigured = () => has("RESEND_API_KEY", "RESEND_FROM");
export const isStorageConfigured = () => has("SASTORAGE_URL", "SASTORAGE_TOKEN");

export function getAppMode(): AppMode {
  return isDatabaseConfigured() ? "db" : "mock";
}

export const isMockMode = () => getAppMode() === "mock";

/** Canonical site origin for links, metadata, sitemap and emails (no trailing slash). */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_ENV === "production") {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Emails that become ADMIN when they sign up or sign in (bootstrap the first admin). */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Flags safe to send to the browser (no secrets). */
export type PublicConfig = {
  mode: AppMode;
  auth: boolean;
  google: boolean;
  email: boolean;
  storage: boolean;
};

export function getPublicConfig(): PublicConfig {
  return {
    mode: getAppMode(),
    auth: isAuthConfigured(),
    google: isAuthConfigured() && isGoogleConfigured(),
    email: isEmailConfigured(),
    storage: isStorageConfigured(),
  };
}

export type IntegrationStatus = {
  key: "database" | "auth" | "google" | "email" | "storage";
  ok: boolean;
  required: boolean;
  env: string[];
};

/** For the admin overview: what is configured and what is not. */
export function getIntegrationsStatus(): IntegrationStatus[] {
  return [
    { key: "database", ok: isDatabaseConfigured(), required: true, env: ["DATABASE_URL"] },
    { key: "auth", ok: isAuthSecretConfigured(), required: true, env: ["BETTER_AUTH_SECRET"] },
    { key: "email", ok: isEmailConfigured(), required: false, env: ["RESEND_API_KEY", "RESEND_FROM"] },
    { key: "google", ok: isGoogleConfigured(), required: false, env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
    { key: "storage", ok: isStorageConfigured(), required: false, env: ["SASTORAGE_URL", "SASTORAGE_TOKEN"] },
  ];
}
