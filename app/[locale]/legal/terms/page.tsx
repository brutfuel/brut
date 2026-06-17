// TODO: legal review — replace placeholder copy with the Terms approved
// by a qualified legal adviser before launch.

import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export async function generateMetadata() {
  const t = await getTranslations('legal.terms');
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const sectionTitle =
  'mt-10 text-xl font-thin tracking-brut text-brut-black uppercase';
const para = 'mt-3 text-sm font-normal text-brut-ink leading-relaxed';

const linkClass =
  'text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity';

export default async function TermsPage() {
  const t = await getTranslations('legal.terms');
  const tLegal = await getTranslations('legal');

  const mailChunk = (chunks: React.ReactNode) => (
    <a href="mailto:hello@brutfuel.com" className={linkClass}>
      {chunks}
    </a>
  );

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[720px] px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          {tLegal('eyebrow')}
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          {t('title')}
        </h1>
        <p className="mt-4 text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
          {tLegal('last_updated')}
        </p>

        <h2 className={sectionTitle}>{t('s1_title')}</h2>
        <p className={para}>{t('s1_body')}</p>

        <h2 className={sectionTitle}>{t('s2_title')}</h2>
        <p className={para}>{t('s2_body')}</p>

        <h2 className={sectionTitle}>{t('s3_title')}</h2>
        <p className={para}>{t('s3_body')}</p>

        <h2 className={sectionTitle}>{t('s4_title')}</h2>
        <p className={para}>{t('s4_body')}</p>

        <h2 className={sectionTitle}>{t('s5_title')}</h2>
        <p className={para}>{t('s5_body')}</p>

        <h2 className={sectionTitle}>{t('s6_title')}</h2>
        <p className={para}>{t('s6_body')}</p>

        <h2 className={sectionTitle}>{t('s7_title')}</h2>
        <p className={para}>{t('s7_body')}</p>

        <h2 className={sectionTitle}>{t('s8_title')}</h2>
        <p className={para}>{t('s8_body')}</p>

        <h2 className={sectionTitle}>{t('s9_title')}</h2>
        <p className={para}>{t('s9_body')}</p>

        <h2 className={sectionTitle}>{t('s10_title')}</h2>
        <p className={para}>{t('s10_body')}</p>

        <h2 className={sectionTitle}>{t('s11_title')}</h2>
        <p className={para}>{t.rich('s11_body', { mail: mailChunk })}</p>
      </main>

      <Footer />
    </>
  );
}
