// TODO: legal review — replace placeholder copy with the Terms approved
// by a qualified legal adviser before launch.

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms of Service — BRUT',
  description: 'The terms that govern your use of BRUT.',
};

const sectionTitle =
  'mt-10 text-xl font-thin tracking-brut text-brut-black uppercase';
const para = 'mt-3 text-sm font-normal text-brut-ink leading-relaxed';

export default function TermsPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[720px] px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          Legal
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          Terms of service
        </h1>
        <p className="mt-4 text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
          Last updated: April 2026
        </p>

        <h2 className={sectionTitle}>1. The service</h2>
        <p className={para}>
          BRUT (&ldquo;the Service&rdquo;) is a web app that helps endurance
          athletes plan training and fuelling. The Service is provided by Brut
          (&ldquo;we&rdquo;).
        </p>

        <h2 className={sectionTitle}>2. Account</h2>
        <p className={para}>
          You must be at least 16 years old to create an account. You are
          responsible for keeping your credentials safe and for the activity
          under your account.
        </p>

        <h2 className={sectionTitle}>3. Not medical advice</h2>
        <p className={para}>
          BRUT provides general training and fuelling guidance based on
          published methodologies. It is not medical advice and does not
          replace consultation with a qualified professional. If you have a
          health condition or are unsure whether you can train, consult a
          doctor before using the plans the Service generates.
        </p>

        <h2 className={sectionTitle}>4. Your content</h2>
        <p className={para}>
          You keep all rights to the data you enter (profile, race goals,
          notes). You grant us a limited licence to host and process it solely
          to run the Service for you.
        </p>

        <h2 className={sectionTitle}>5. Acceptable use</h2>
        <p className={para}>
          Don&rsquo;t use the Service to break the law, abuse other users,
          attempt to access other accounts, or interfere with the Service.
        </p>

        <h2 className={sectionTitle}>6. Subscription &amp; payments</h2>
        <p className={para}>
          The free tier covers the current set of features. Paid plans, if
          and when introduced, will be governed by separate terms presented
          at checkout.
        </p>

        <h2 className={sectionTitle}>7. Availability</h2>
        <p className={para}>
          We try our best to keep the Service available but we do not
          guarantee uninterrupted access. We may release new versions, change
          features, or pause the Service for maintenance.
        </p>

        <h2 className={sectionTitle}>8. Termination</h2>
        <p className={para}>
          You can delete your account at any time from your profile. We may
          suspend or terminate accounts that breach these terms.
        </p>

        <h2 className={sectionTitle}>9. Liability</h2>
        <p className={para}>
          To the extent permitted by law, the Service is provided
          &ldquo;as is&rdquo;. We are not liable for indirect damages or for
          decisions you take based on the guidance the Service produces.
        </p>

        <h2 className={sectionTitle}>10. Governing law</h2>
        <p className={para}>
          These terms are governed by Spanish law. Disputes will be brought
          before the courts of Barcelona unless mandatory consumer law states
          otherwise.
        </p>

        <h2 className={sectionTitle}>11. Contact</h2>
        <p className={para}>
          Write to{' '}
          <a
            href="mailto:hello@brutfuel.com"
            className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
          >
            hello@brutfuel.com
          </a>{' '}
          for any question about these terms.
        </p>
      </main>

      <Footer />
    </>
  );
}
