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
