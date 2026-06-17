import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from '@/lib/i18n/routing';

const sectionTitle =
  'mt-10 text-xl font-thin tracking-brut text-brut-black uppercase';
const para = 'mt-3 text-sm font-normal text-brut-ink leading-relaxed';

const mailLink =
  'text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('about_title'),
    description: t('about_description'),
  };
}

export default async function AboutPage() {
  const t = await getTranslations('about');

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[720px] px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          {t('eyebrow')}
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          BRUT
        </h1>
        <p className="mt-6 text-base font-normal text-brut-ink leading-relaxed">
          {t('intro')}
        </p>

        <h2 className={sectionTitle}>{t('what_we_make_title')}</h2>
        <p className={para}>{t('what_we_make_p1')}</p>
        <p className={para}>{t('what_we_make_p2')}</p>

        <h2 className={sectionTitle}>{t('how_we_plan_title')}</h2>
        <p className={para}>{t('how_we_plan_body')}</p>

        <h2 className={sectionTitle}>{t('what_we_are_not_title')}</h2>
        <p className={para}>{t('what_we_are_not_body')}</p>

        <h2 className={sectionTitle}>{t('find_us_title')}</h2>
        <p className={para}>
          {t.rich('find_us_body', {
            mail: (chunks) => (
              <a href="mailto:hello@brutfuel.com" className={mailLink}>
                {chunks}
              </a>
            ),
            shop: (chunks) => (
              <a
                href="https://brutfuel.com"
                target="_blank"
                rel="noopener noreferrer"
                className={mailLink}
              >
                {chunks}
              </a>
            ),
          })}
        </p>

        <p className="mt-12 text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
          {t('references')}
        </p>

        <div className="mt-12 border-t border-brut-line pt-8 flex flex-wrap gap-3">
          <Link
            href="/brut-train"
            className="inline-flex items-center justify-center px-5 py-3 border border-brut-black text-brut-black text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            {t('cta_session')}
          </Link>
          <Link
            href="/brut-race"
            className="inline-flex items-center justify-center px-5 py-3 border border-brut-black text-brut-black text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            {t('cta_race')}
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
