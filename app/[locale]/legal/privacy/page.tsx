// TODO: legal review — replace placeholder copy with the policy
// approved by a qualified data-protection adviser before launch.

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy — BRUT',
  description: 'How BRUT handles your personal data.',
};

const sectionTitle =
  'mt-10 text-xl font-thin tracking-brut text-brut-black uppercase';
const para =
  'mt-3 text-sm font-normal text-brut-ink leading-relaxed';

export default function PrivacyPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[720px] px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          Legal
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          Privacy policy
        </h1>
        <p className="mt-4 text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
          Last updated: April 2026
        </p>

        <h2 className={sectionTitle}>1. Who we are</h2>
        <p className={para}>
          BRUT is operated by Brut (&ldquo;Brut&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;). For any privacy question, write to{' '}
          <a
            href="mailto:hello@brutfuel.com"
            className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
          >
            hello@brutfuel.com
          </a>
          .
        </p>

        <h2 className={sectionTitle}>2. What we collect</h2>
        <p className={para}>
          Account: email address and an encrypted password (or your Google
          identity if you sign in with Google).
        </p>
        <p className={para}>
          Profile: name, age, gender, sport, body weight and other training
          inputs you choose to provide.
        </p>
        <p className={para}>
          Activity: the race plans, sessions and race-day plans you generate
          inside BRUT.
        </p>
        <p className={para}>
          Technical: minimal cookies needed to keep you signed in and basic
          server logs (IP, user agent, request path) for security purposes.
        </p>

        <h2 className={sectionTitle}>3. Why we use it</h2>
        <p className={para}>
          To run the service: authenticate you, save your plans, personalise
          your fuelling guidelines. We do not sell your data and we do not use
          it for advertising.
        </p>

        <h2 className={sectionTitle}>4. Legal basis (GDPR)</h2>
        <p className={para}>
          Contract performance for account and service data. Legitimate
          interest for minimal server logs. Consent for any optional analytics
          or marketing communications, which you can withdraw at any time.
        </p>

        <h2 className={sectionTitle}>5. Who can see your data</h2>
        <p className={para}>
          Only Brut and our infrastructure providers (Supabase for the
          database, Vercel for hosting, Resend for transactional email). Each
          processes data under their own privacy terms. We never sell or share
          your data with advertisers.
        </p>

        <h2 className={sectionTitle}>6. International transfers</h2>
        <p className={para}>
          Some processors may store data outside the EU. We rely on Standard
          Contractual Clauses or equivalent safeguards.
        </p>

        <h2 className={sectionTitle}>7. Retention</h2>
        <p className={para}>
          We keep your account data for as long as your account exists. Delete
          your account from{' '}
          <Link
            href="/profile"
            className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
          >
            your profile
          </Link>{' '}
          to remove it permanently. Server logs are retained for up to 30 days.
        </p>

        <h2 className={sectionTitle}>8. Your rights</h2>
        <p className={para}>
          Access, rectification, erasure, restriction, portability and
          objection — write to{' '}
          <a
            href="mailto:hello@brutfuel.com"
            className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
          >
            hello@brutfuel.com
          </a>{' '}
          and we will respond within 30 days.
        </p>

        <h2 className={sectionTitle}>9. Cookies</h2>
        <p className={para}>
          We use only the cookies strictly required to keep you signed in. See{' '}
          <Link
            href="/legal/cookies"
            className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
          >
            our Cookie Policy
          </Link>{' '}
          for the full list.
        </p>

        <h2 className={sectionTitle}>10. Security</h2>
        <p className={para}>
          Passwords are hashed. Data in transit is encrypted with TLS. We
          apply row-level security at the database so each athlete only sees
          their own data.
        </p>

        <h2 className={sectionTitle}>11. Children</h2>
        <p className={para}>
          BRUT is not directed at users under 16. We do not knowingly collect
          data from minors.
        </p>

        <h2 className={sectionTitle}>12. Changes</h2>
        <p className={para}>
          If we update this policy materially, we will let you know in the app
          or by email before the changes take effect.
        </p>
      </main>

      <Footer />
    </>
  );
}
