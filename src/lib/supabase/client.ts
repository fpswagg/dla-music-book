import { createBrowserClient } from "@supabase/ssr";
import { isAuthAvailable } from "@/lib/env.client";

export function createClient() {
  if (!isAuthAvailable()) {
    console.warn("[Mock] Supabase client requested but no Supabase env vars set");
    return null;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
