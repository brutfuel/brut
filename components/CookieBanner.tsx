'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

const STORAGE_KEY = 'brut-cookies-accepted';

/**
 * Discrete cookie acceptance banner. Shown on first visit only.
 * Stores acceptance in localStorage — no cookie of its own.
 */
export default function CookieBanner() {
  const t = useTranslations('cookie_banner');
  // Hidden by default to avoid SSR flash; flipped on after the first
  // client-side render once we have read localStorage.
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const accepted = window.localStorage.getItem(STORAGE_KEY) === 'true';
    setHidden(accepted);
  }, []);

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Best-effort — Safari private mode etc.
    }
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-brut-line">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-4 flex flex-col md:flex-row items-start md:items-center gap-3 justify-between">
        <p className="text-xs font-normal text-brut-ink leading-relaxed">
          {t.rich('message', {
            privacy: (chunks) => (
              <Link
                href="/legal/privacy"
                className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <button
          type="button"
          onClick={accept}
          className="inline-flex items-center justify-center px-5 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors shrink-0"
        >
          {t('accept')}
        </button>
      </div>
    </div>
  );
}
