import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { Montserrat } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import CookieBanner from '@/components/CookieBanner';
import FeedbackButton from '@/components/FeedbackButton';
import { BCP47, routing, type AppLocale } from '@/lib/i18n/routing';
import '../globals.css';

const SITE_URL = 'https://brutfuel.com';

// Single typeface across the app — only the weights we actually use.
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['200', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

/** Pre-generate one layout per supported locale at build time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

/** Localised default <title> + <description> + hreflang map. */
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  if (!(routing.locales as ReadonlyArray<string>).includes(locale)) {
    return {};
  }
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: 'metadata',
  });

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    // Default locale lives at the root path; others under /<l>.
    languages[BCP47[l]] =
      l === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${l}`;
  }
  languages['x-default'] = SITE_URL;

  const canonical =
    locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`;

  return {
    title: t('site_title'),
    description: t('site_description'),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      languages,
    },
  };
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
    <html lang={BCP47[locale as AppLocale]} className={montserrat.variable}>
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
