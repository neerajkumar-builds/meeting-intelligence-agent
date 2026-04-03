import { createClient } from "@supabase/supabase-js";

// Server client for API routes — uses raw supabase-js (no cookie management needed)
// API routes don't need auth session, they use the anon key for data queries
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
