import { createBrowserClient } from "@supabase/ssr";
import { hasSupabase } from "../env";

export function createClient() {
  if (!hasSupabase()) {
    console.warn("[Mock] Supabase client requested but no Supabase env vars set");
    return null;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
