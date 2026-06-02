'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary — catches errors that escape even the root
 * layout. Renders its own <html>/<body> because the layout itself may
 * have failed.
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[BRUT] global error', error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body className="bg-white text-brut-black font-sans antialiased">
        <main className="mx-auto max-w-3xl px-6 md:px-10 pt-24 pb-24 min-h-screen">
          <span className="text-xs font-semibold tracking-brut-wide uppercase text-[#8a8a8a]">
            Critical error
          </span>
          <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-[0.02em] text-[#0a0a0a]">
            Something broke
          </h1>
          <p className="mt-4 text-base font-normal text-[#3a3a3a] leading-relaxed">
            The app failed unexpectedly. Try again. If it keeps happening,
            write to hello@brutfuel.com.
          </p>
          {error.digest ? (
            <p className="mt-4 text-[10px] font-medium tracking-[0.08em] uppercase text-[#8a8a8a]">
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex items-center justify-center px-5 py-3 bg-[#0a0a0a] text-white text-[10px] font-semibold tracking-[0.08em] uppercase"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
