import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for use in Server Components, Route Handlers and
 * Server Actions. Reads/writes auth cookies via the Next.js cookie store.
 *
 * Session refresh is handled by the root middleware, so a failed
 * `setAll` from inside a Server Component (where cookies are read-only)
 * can be safely ignored.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — ignore. The middleware
            // refreshes the session, so cookies stay up to date.
          }
        },
      },
    },
  );
}
