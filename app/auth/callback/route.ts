import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  localizedPath,
  routing,
  type AppLocale,
} from '@/lib/i18n/routing';
import type { Profile } from '@/lib/types/db';

function isKnownLocale(value: string | null): value is AppLocale {
  return (
    !!value && (routing.locales as ReadonlyArray<string>).includes(value)
  );
}

/**
 * OAuth / email-confirmation callback. Supabase redirects here with a
 * `code` which we exchange for a session, then forward the athlete on
 * — under their preferred locale (`profiles.locale` if known, else the
 * `?locale=` hint set by the caller, else default).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/dashboard';
  const localeHint = searchParams.get('locale');
  const next =
    nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let locale: AppLocale = isKnownLocale(localeHint)
        ? localeHint
        : routing.defaultLocale;

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('locale')
          .eq('id', user.id)
          .maybeSingle();
        const stored = (data as Pick<Profile, 'locale'> | null)?.locale;
        if (stored && isKnownLocale(stored)) {
          locale = stored;
        }
      }

      return NextResponse.redirect(`${origin}${localizedPath(locale, next)}`);
    }
  }

  const fallbackLocale: AppLocale = isKnownLocale(localeHint)
    ? localeHint
    : routing.defaultLocale;
  return NextResponse.redirect(
    `${origin}${localizedPath(fallbackLocale, '/login')}?error=auth`,
  );
}
