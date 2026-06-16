import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth session on every request and keeps the
 * auth cookies in sync between the request and the response.
 *
 * Pass an `initialResponse` (e.g. one produced by next-intl's
 * middleware) to graft the refreshed Supabase cookies onto it instead
 * of creating a fresh `NextResponse`. This lets us compose with
 * routing-aware middleware without losing locale redirects or rewrites.
 *
 * Called from the root `middleware.ts`. Do not add logic between
 * `createServerClient` and `getUser()` — see Supabase SSR docs.
 */
export async function updateSession(
  request: NextRequest,
  initialResponse?: NextResponse,
) {
  let supabaseResponse = initialResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Only rebuild the response when we own it. When `initialResponse`
          // is provided (typical for the next-intl compose path) we keep
          // its redirect/rewrite intact and only apply the new cookies.
          if (!initialResponse) {
            supabaseResponse = NextResponse.next({ request });
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // IMPORTANT: this call refreshes the session if expired. Keep it here.
  await supabase.auth.getUser();

  return supabaseResponse;
}
