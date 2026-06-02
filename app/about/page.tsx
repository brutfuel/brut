import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'About — BRUT',
  description:
    'BRUT is a science-based fuelling and training companion for endurance athletes.',
};

const sectionTitle =
  'mt-10 text-xl font-thin tracking-brut text-brut-black uppercase';
const para = 'mt-3 text-sm font-normal text-brut-ink leading-relaxed';

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[720px] px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          About
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          BRUT
        </h1>
        <p className="mt-6 text-base font-normal text-brut-ink leading-relaxed">
          BRUT is a science-based fuelling and training companion for
          endurance athletes. We make electrolyte capsules and build the
          digital tools that tell you when and how to take them.
        </p>

        <h2 className={sectionTitle}>What we make</h2>
        <p className={para}>
          BRUT capsules deliver 211 mg of sodium each — calibrated for the
          losses real endurance athletes face, not generic sports-drink
          assumptions.
        </p>
        <p className={para}>
          Around the capsules we build deterministic planning tools:
          single-session fuelling (BRUT TRAIN), full periodised race
          programmes (BRUT RACE) and complete race-day strategies (BRUT RACE
          DAY).
        </p>

        <h2 className={sectionTitle}>How we plan</h2>
        <p className={para}>
          Methodology over magic. Polarised 80/20 training (Seiler), carb
          periodisation through phases, hydration grounded in physiological
          baselines (Baker 2017, Barnes 2019, ACSM). Every recommendation
          comes from a pure function with the assumptions visible.
        </p>

        <h2 className={sectionTitle}>What we are not</h2>
        <p className={para}>
          We are not a coach. We are not medical advice. Our plans are a
          structured starting point you adapt with experience, sensation and
          professional guidance.
        </p>

        <h2 className={sectionTitle}>Find us</h2>
        <p className={para}>
          Email{' '}
          <a
            href="mailto:hello@brutfuel.com"
            className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
          >
            hello@brutfuel.com
          </a>{' '}
          or pick up capsules at{' '}
          <a
            href="https://brutfuel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
          >
            brutfuel.com
          </a>
          .
        </p>

        <p className="mt-12 text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
          References: Baker LB 2017 · Barnes et al. 2019 · Seiler 2010 · ACSM
          2007
        </p>

        <div className="mt-12 border-t border-brut-line pt-8 flex flex-wrap gap-3">
          <Link
            href="/brut-train"
            className="inline-flex items-center justify-center px-5 py-3 border border-brut-black text-brut-black text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            Plan a session &rarr;
          </Link>
          <Link
            href="/brut-race"
            className="inline-flex items-center justify-center px-5 py-3 border border-brut-black text-brut-black text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            Plan a race &rarr;
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
