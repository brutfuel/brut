import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from '@/lib/i18n/routing';

// Public landing page. Server component, no state.
export default async function HomePage() {
  const t = await getTranslations('landing');

  return (
    <>
      <Header />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 md:px-10 pt-20 md:pt-32 pb-20 md:pb-32">
          <h1 className="font-thin tracking-brut text-brut-black text-[64px] sm:text-[80px] md:text-[100px] leading-[0.95]">
            {t('hero_line_1')}
            <br />
            {t('hero_line_2')}
          </h1>

          <p className="mt-8 md:mt-10 max-w-2xl text-lg md:text-xl font-normal text-brut-muted leading-relaxed">
            {t('tagline')}
          </p>
        </section>

        {/* Two-product split. Stacks on mobile, 50/50 on desktop. */}
        <section className="border-t border-brut-line">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-brut-line">
            <Link
              href="/brut-train"
              className="group block px-6 md:px-10 py-16 md:py-28 bg-white hover:bg-brut-bg-soft transition-colors"
            >
              <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
                {t('section_session_eyebrow')}
              </span>
              <h2 className="mt-6 text-4xl md:text-5xl font-thin tracking-brut text-brut-black">
                BRUT TRAIN
              </h2>
              <p className="mt-6 text-xl md:text-2xl font-normal text-brut-ink">
                {t('session_card_title')}
              </p>
              <p className="mt-4 max-w-md text-base font-normal text-brut-muted leading-relaxed">
                {t('session_card_body')}
              </p>
              <span className="mt-10 inline-block text-xs font-semibold tracking-brut-wide uppercase text-brut-black border-b border-brut-black pb-1 group-hover:opacity-70 transition-opacity">
                {t('session_card_cta')}
              </span>
            </Link>

            <Link
              href="/brut-race"
              className="group block px-6 md:px-10 py-16 md:py-28 bg-brut-bg-soft hover:bg-brut-panel transition-colors"
            >
              <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
                {t('section_race_eyebrow')}
              </span>
              <h2 className="mt-6 text-4xl md:text-5xl font-thin tracking-brut text-brut-black">
                BRUT RACE
              </h2>
              <p className="mt-6 text-xl md:text-2xl font-normal text-brut-ink">
                {t('race_card_title')}
              </p>
              <p className="mt-4 max-w-md text-base font-normal text-brut-muted leading-relaxed">
                {t('race_card_body')}
              </p>
              <span className="mt-10 inline-block text-xs font-semibold tracking-brut-wide uppercase text-brut-black border-b border-brut-black pb-1 group-hover:opacity-70 transition-opacity">
                {t('race_card_cta')}
              </span>
            </Link>
          </div>
        </section>

        {/* Evidence strap */}
        <section className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-28 border-t border-brut-line">
          <p className="max-w-3xl text-base md:text-lg font-normal text-brut-ink leading-relaxed">
            {t('evidence_body')}
          </p>
          <p className="mt-6 text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
            {t('evidence_references')}
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
