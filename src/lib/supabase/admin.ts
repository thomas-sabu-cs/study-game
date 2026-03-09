import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using service role key.
 * Use for subjects/files where we enforce user_id from Clerk in app code.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }
  return createClient(url, key);
}
