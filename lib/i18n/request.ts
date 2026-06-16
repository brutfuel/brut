import { getRequestConfig } from 'next-intl/server';
import { routing, type AppLocale } from '@/lib/i18n/routing';

/**
 * Server-side message loader. Called by next-intl on every request to
 * supply the messages bundle that matches the active locale.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (
    routing.locales as ReadonlyArray<string>
  ).includes(requested ?? '')
    ? (requested as AppLocale)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`@/locales/${locale}.json`)).default,
  };
});
