import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RegisterForm from '@/components/auth/RegisterForm';
import { Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';

interface Props {
  searchParams: { redirect?: string };
}

export default async function RegisterPage({ searchParams }: Props) {
  const tAuth = await getTranslations('auth');
  const tReg = await getTranslations('auth.register');
  const tAuthActions = await getTranslations('common.auth_actions');

  const next =
    typeof searchParams.redirect === 'string' &&
    searchParams.redirect.startsWith('/') &&
    !searchParams.redirect.startsWith('//')
      ? searchParams.redirect
      : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  const loginHref = next
    ? `/login?redirect=${encodeURIComponent(next)}`
    : '/login';

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <div className="mx-auto w-full max-w-sm">
          <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
            {tAuth('eyebrow')}
          </span>
          <h1 className="mt-6 text-[36px] md:text-[52px] leading-[1.0] font-thin tracking-brut text-brut-black">
            {tReg('title')}
          </h1>

          <div className="mt-10">
            <RegisterForm />
          </div>

          <p className="mt-10 text-sm font-normal text-brut-muted">
            {tAuthActions('already_have_account')}{' '}
            <Link
              href={loginHref}
              className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
            >
              {tAuthActions('sign_in')}
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
