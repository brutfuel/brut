import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VerifyEmailClient from '@/app/[locale]/auth/verify/VerifyEmailClient';
import { Link } from '@/lib/i18n/routing';

interface Props {
  searchParams: { email?: string };
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const tAuth = await getTranslations('auth');
  const t = await getTranslations('auth.verify_email');
  const tA = await getTranslations('common.auth_actions');

  const initialEmail =
    typeof searchParams.email === 'string' ? searchParams.email : '';

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <div className="mx-auto w-full max-w-sm">
          <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
            {tAuth('eyebrow')}
          </span>
          <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
            {t('title')}
          </h1>
          <p className="mt-4 text-sm font-normal text-brut-ink leading-relaxed">
            {initialEmail
              ? t.rich('intro_with_email', {
                  email: () => (
                    <span className="text-brut-black">{initialEmail}</span>
                  ),
                })
              : t('intro_generic')}
          </p>
          <p className="mt-3 text-xs font-normal text-brut-muted">
            {t('spam_note')}
          </p>

          <div className="mt-10">
            <VerifyEmailClient initialEmail={initialEmail} />
          </div>

          <p className="mt-10 text-sm font-normal text-brut-muted">
            {tA('already_verified')}{' '}
            <Link
              href="/login"
              className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
            >
              {tA('sign_in')}
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
