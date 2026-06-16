import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * Locale routing for BRUT.
 *
 *  - English is the default and lives at the root (`/`, `/dashboard`, …).
 *  - Catalan lives under `/ca/*`.
 *  - Spanish lives under `/es/*`.
 *
 * `localePrefix: 'as-needed'` keeps the default locale without a prefix
 * and prepends the prefix only for the non-default locales.
 */
export const routing = defineRouting({
  locales: ['en', 'ca', 'es'] as const,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export type AppLocale = (typeof routing.locales)[number];

/**
 * Locale-aware navigation helpers. Use these `Link`, `redirect`,
 * `usePathname`, `useRouter` everywhere inside the `[locale]` segment
 * instead of the ones from `next/link` / `next/navigation`.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * Build the URL for `path` rendered in `locale`. Strips any existing
 * locale prefix from `path` first so callers can pass either a raw
 * `/dashboard` or an already-prefixed `/ca/dashboard` without doubling
 * up. The default locale gets no prefix (matches `localePrefix:
 * 'as-needed'`).
 *
 * Used by server actions that want to redirect into the athlete's
 * preferred locale after sign-in / onboarding.
 */
export function localizedPath(locale: AppLocale, path: string): string {
  let normalised = path.startsWith('/') ? path : `/${path}`;
  const segments = normalised.split('/');
  if (
    segments[1] &&
    (routing.locales as ReadonlyArray<string>).includes(segments[1])
  ) {
    segments.splice(1, 1);
    normalised = segments.join('/') || '/';
  }
  if (locale === routing.defaultLocale) return normalised;
  return normalised === '/' ? `/${locale}` : `/${locale}${normalised}`;
}
