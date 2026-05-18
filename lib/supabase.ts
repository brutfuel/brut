import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Public Supabase client. Safe to use in the browser — uses the anon key.
// Not in use yet: kept here so wiring auth/persistence later is a one-import job.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cached) return cached;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
    );
  }

  cached = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  return cached;
}
