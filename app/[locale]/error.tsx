'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary. Caught errors in any segment land here.
 * The user gets an editorial fallback with a recoverable action.
 */
export default function RouteError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[BRUT] route error', error);
  }, [error]);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          Error
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          Something broke
        </h1>
        <p className="mt-4 text-base font-normal text-brut-ink leading-relaxed">
          The page failed to load. Try again — if it keeps happening, write to{' '}
          <a
            href="mailto:hello@brutfuel.com"
            className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
          >
            hello@brutfuel.com
          </a>
          .
        </p>
        {error.digest ? (
          <p className="mt-4 text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center px-5 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-3 border border-brut-black text-brut-black text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
