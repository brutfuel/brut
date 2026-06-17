// TODO: legal review — replace placeholder copy with the policy
// approved by a qualified data-protection adviser before launch.

import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from '@/lib/i18n/routing';

export async function generateMetadata() {
  const t = await getTranslations('legal.privacy');
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

export default async function PrivacyPage() {
  const t = await getTranslations('legal.privacy');
  const tLegal = await getTranslations('legal');

  const mailChunk = (chunks: React.ReactNode) => (
    <a href="mailto:hello@brutfuel.com" className={linkClass}>
      {chunks}
    </a>
  );
  const profileChunk = (chunks: React.ReactNode) => (
    <Link href="/profile" className={linkClass}>
      {chunks}
    </Link>
  );
  const cookiesChunk = (chunks: React.ReactNode) => (
    <Link href="/legal/cookies" className={linkClass}>
      {chunks}
    </Link>
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
        <p className={para}>{t.rich('s1_body', { mail: mailChunk })}</p>

        <h2 className={sectionTitle}>{t('s2_title')}</h2>
        <p className={para}>{t('s2_p1')}</p>
        <p className={para}>{t('s2_p2')}</p>
        <p className={para}>{t('s2_p3')}</p>
        <p className={para}>{t('s2_p4')}</p>

        <h2 className={sectionTitle}>{t('s3_title')}</h2>
        <p className={para}>{t('s3_body')}</p>

        <h2 className={sectionTitle}>{t('s4_title')}</h2>
        <p className={para}>{t('s4_body')}</p>

        <h2 className={sectionTitle}>{t('s5_title')}</h2>
        <p className={para}>{t('s5_body')}</p>

        <h2 className={sectionTitle}>{t('s6_title')}</h2>
        <p className={para}>{t('s6_body')}</p>

        <h2 className={sectionTitle}>{t('s7_title')}</h2>
        <p className={para}>
          {t.rich('s7_body', { profile: profileChunk })}
        </p>

        <h2 className={sectionTitle}>{t('s8_title')}</h2>
        <p className={para}>{t.rich('s8_body', { mail: mailChunk })}</p>

        <h2 className={sectionTitle}>{t('s9_title')}</h2>
        <p className={para}>
          {t.rich('s9_body', { cookies: cookiesChunk })}
        </p>

        <h2 className={sectionTitle}>{t('s10_title')}</h2>
        <p className={para}>{t('s10_body')}</p>

        <h2 className={sectionTitle}>{t('s11_title')}</h2>
        <p className={para}>{t('s11_body')}</p>

        <h2 className={sectionTitle}>{t('s12_title')}</h2>
        <p className={para}>{t('s12_body')}</p>
      </main>

      <Footer />
    </>
  );
}
