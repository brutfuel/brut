import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ForgotPasswordForm from '@/app/[locale]/forgot-password/ForgotPasswordForm';
import { Link } from '@/lib/i18n/routing';

export default async function ForgotPasswordPage() {
  const tAuth = await getTranslations('auth');
  const t = await getTranslations('auth.forgot_password');
  const tA = await getTranslations('common.auth_actions');

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
            {t('intro')}
          </p>

          <div className="mt-10">
            <ForgotPasswordForm />
          </div>

          <p className="mt-10 text-sm font-normal text-brut-muted">
            {tA('remembered_it')}{' '}
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
