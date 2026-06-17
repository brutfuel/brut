'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from '@/lib/i18n/routing';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteError({ error, reset }: Props) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error('[BRUT] route error', error);
  }, [error]);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          {t('eyebrow_error')}
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          {t('title_broke')}
        </h1>
        <p className="mt-4 text-base font-normal text-brut-ink leading-relaxed">
          {t('body_route_error_prefix')}
          <a
            href="mailto:hello@brutfuel.com"
            className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
          >
            hello@brutfuel.com
          </a>
          {t('body_route_error_suffix')}
        </p>
        {error.digest ? (
          <p className="mt-4 text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
            {t('reference_prefix')}
            {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center px-5 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors"
          >
            {t('try_again')}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-3 border border-brut-black text-brut-black text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            {t('back_to_dashboard')}
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
