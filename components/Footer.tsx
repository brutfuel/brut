import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/routing';

const colTitle =
  'text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted';
const colLink =
  'text-xs font-medium tracking-brut-wide uppercase text-brut-ink hover:text-brut-black transition-colors';

/**
 * Editorial footer — three columns of section links above a row of
 * secondary links and the copyright. Pages that require auth still
 * gate access themselves, so every link is rendered unconditionally.
 */
export default async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="w-full border-t border-brut-line mt-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-12 md:py-16 flex flex-col gap-10">
        <p className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
          {t('tagline')}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-10">
          <div className="flex flex-col gap-3">
            <span className={colTitle}>{t('col_tools')}</span>
            <Link href="/brut-train" className={colLink}>
              {t('tools_brut_train')}
            </Link>
            <Link href="/brut-race" className={colLink}>
              {t('tools_brut_race')}
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className={colTitle}>{t('col_account')}</span>
            <Link href="/login" className={colLink}>
              {t('account_sign_in')}
            </Link>
            <Link href="/profile" className={colLink}>
              {t('account_profile')}
            </Link>
            <Link href="/dashboard" className={colLink}>
              {t('account_dashboard')}
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className={colTitle}>{t('col_legal')}</span>
            <Link href="/legal/privacy" className={colLink}>
              {t('legal_privacy')}
            </Link>
            <Link href="/legal/terms" className={colLink}>
              {t('legal_terms')}
            </Link>
            <Link href="/legal/cookies" className={colLink}>
              {t('legal_cookies')}
            </Link>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-3 border-t border-brut-line pt-8">
          <Link href="/about" className={colLink}>
            {t('link_about')}
          </Link>
          <Link href="/contact" className={colLink}>
            {t('link_contact')}
          </Link>
          <a
            href="https://brutfuel.com"
            target="_blank"
            rel="noopener noreferrer"
            className={colLink}
          >
            {t('link_shop')}
          </a>
        </nav>

        <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
          {t('copyright')}
        </p>
      </div>
    </footer>
  );
}
