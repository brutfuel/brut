// TODO: legal review — confirm the cookie inventory with a qualified
// data-protection adviser before launch.

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Cookie Policy — BRUT',
  description: 'The cookies BRUT uses and why.',
};

const sectionTitle =
  'mt-10 text-xl font-thin tracking-brut text-brut-black uppercase';
const para = 'mt-3 text-sm font-normal text-brut-ink leading-relaxed';

export default function CookiesPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[720px] px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          Legal
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          Cookie policy
        </h1>
        <p className="mt-4 text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
          Last updated: April 2026
        </p>

        <h2 className={sectionTitle}>1. What we use</h2>
        <p className={para}>
          BRUT uses only cookies that are strictly necessary for the Service
          to work. We do not use cookies for advertising or third-party
          tracking.
        </p>

        <h2 className={sectionTitle}>2. Inventory</h2>
        <p className={para}>
          Supabase auth cookies (httpOnly): keep you signed in across pages.
          Removed when you sign out.
        </p>
        <p className={para}>
          <span className="font-mono text-xs">brut-cookies-accepted</span>{' '}
          (localStorage flag): remembers that you have seen the cookie banner.
          Does not contain personal data.
        </p>

        <h2 className={sectionTitle}>3. Analytics</h2>
        <p className={para}>
          When enabled, we use Plausible Analytics, a privacy-friendly,
          cookieless analytics tool. It does not store any cookie in your
          browser and does not track individuals.
        </p>

        <h2 className={sectionTitle}>4. Managing cookies</h2>
        <p className={para}>
          You can clear the auth cookies by signing out, or by clearing your
          browser data. Disabling the auth cookies will prevent you from
          using the Service while signed in.
        </p>

        <h2 className={sectionTitle}>5. See also</h2>
        <p className={para}>
          For the full picture, read our{' '}
          <Link
            href="/legal/privacy"
            className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </main>

      <Footer />
    </>
  );
}
