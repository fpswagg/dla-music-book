/**
 * Client-safe environment helpers.
 * Only reads NEXT_PUBLIC_* vars (inlined at build time by Next.js).
 */

export function isAuthAvailable(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isClientMockMode(): boolean {
  return !isAuthAvailable();
}
