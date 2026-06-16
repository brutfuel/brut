'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  routing,
  usePathname,
  useRouter,
  type AppLocale,
} from '@/lib/i18n/routing';
import { updateLocale } from '@/app/[locale]/profile/actions';

const LABELS: Record<AppLocale, string> = {
  en: 'EN',
  ca: 'CA',
  es: 'ES',
};

/**
 * Compact monochrome dropdown in the header. Switches the active
 * locale via the next-intl router (which sets the `NEXT_LOCALE` cookie
 * for anonymous visitors) and, in parallel, persists the choice to
 * `profiles.locale` via the `updateLocale` Server Action — a silent
 * no-op when the visitor is not signed in.
 */
export default function LocaleSwitcher() {
  const t = useTranslations('locale_switcher');
  const current = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function pick(locale: AppLocale) {
    setOpen(false);
    if (locale === current) return;
    startTransition(() => {
      // Cookie + URL change happen via the locale-aware router.
      router.replace(pathname, { locale });
      // Persist to DB — fire-and-forget. updateLocale is safe to call
      // anonymously (returns ok with a no-op).
      void updateLocale(locale);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('aria_label')}
        className="text-xs font-medium tracking-brut-wide uppercase text-brut-ink hover:text-brut-black transition-colors disabled:opacity-50"
        disabled={pending}
      >
        {LABELS[current]}
      </button>

      {open ? (
        <>
          {/* Click-away layer */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-40 mt-3 w-32 border border-brut-line bg-white"
          >
            {routing.locales.map((locale) => {
              const active = locale === current;
              return (
                <button
                  key={locale}
                  type="button"
                  role="menuitem"
                  onClick={() => pick(locale)}
                  disabled={pending}
                  aria-current={active ? 'true' : undefined}
                  className={`block w-full text-left px-4 py-3 text-xs font-medium tracking-brut-wide uppercase transition-colors border-t border-brut-line first:border-t-0 disabled:opacity-50 ${
                    active
                      ? 'text-brut-black bg-brut-bg-soft'
                      : 'text-brut-ink hover:bg-brut-bg-soft'
                  }`}
                >
                  {LABELS[locale]}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
