import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ResetPasswordForm from '@/app/[locale]/reset-password/ResetPasswordForm';
import { Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';

export default async function ResetPasswordPage() {
  const tAuth = await getTranslations('auth');
  const t = await getTranslations('auth.reset_password');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

          {user ? (
            <>
              <p className="mt-4 text-sm font-normal text-brut-ink leading-relaxed">
                {t('intro_signed_in')}
              </p>
              <div className="mt-10">
                <ResetPasswordForm />
              </div>
            </>
          ) : (
            <>
              <p className="mt-6 text-sm font-normal text-brut-ink leading-relaxed border-l-2 border-brut-black pl-3">
                {t('intro_expired')}
              </p>
              <Link
                href="/forgot-password"
                className="mt-8 inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-brut-black pb-1 hover:opacity-60 transition-opacity"
              >
                {t('request_new_link')}
              </Link>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
