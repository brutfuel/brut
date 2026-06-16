import { type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // /auth/callback is hit by Supabase email links and by Google OAuth
  // with a fixed URL — it must never be rewritten by next-intl. We
  // still refresh the Supabase session for it so the code-for-token
  // exchange downstream has a fresh cookie state.
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return await updateSession(request);
  }

  // 1. Let next-intl decide on the locale routing (may redirect/rewrite).
  const intlResponse = handleI18nRouting(request);

  // 2. Refresh Supabase session cookies onto the intl response.
  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except Next.js internals and image files.
     * The session is refreshed on every page and API request.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
