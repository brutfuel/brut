import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { Montserrat } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import CookieBanner from '@/components/CookieBanner';
import FeedbackButton from '@/components/FeedbackButton';
import { routing, type AppLocale } from '@/lib/i18n/routing';
import '../globals.css';

// Single typeface across the app — only the weights we actually use.
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['200', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BRUT — Electrolyte performance',
  description:
    'Science-based nutrition tools for endurance athletes. Plan your session, build your race.',
  metadataBase: new URL('https://brutfuel.com'),
};

/** Pre-generate one layout per supported locale at build time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;

  if (!(routing.locales as ReadonlyArray<string>).includes(locale)) {
    notFound();
  }

  // Required by next-intl to opt in to static rendering of the layout
  // and the pages inside it.
  setRequestLocale(locale as AppLocale);

  const messages = await getMessages();
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <html lang={locale} className={montserrat.variable}>
      <body className="bg-white text-brut-black font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <FeedbackButton />
          <CookieBanner />
        </NextIntlClientProvider>
        {plausibleDomain ? (
          <Script
            src="https://plausible.io/js/script.js"
            data-domain={plausibleDomain}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
