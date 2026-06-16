import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginForm from '@/components/auth/LoginForm';
import { createClient } from '@/lib/supabase/server';

interface Props {
  searchParams: { redirect?: string; error?: string };
}

export default async function LoginPage({ searchParams }: Props) {
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
    redirect(next ?? '/dashboard');
  }

  const registerHref = next
    ? `/register?redirect=${encodeURIComponent(next)}`
    : '/register';

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <div className="mx-auto w-full max-w-sm">
          <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
            Account
          </span>
          <h1 className="mt-6 text-[44px] md:text-[64px] leading-[0.95] font-thin tracking-brut text-brut-black">
            Sign in
          </h1>

          {next ? (
            <p className="mt-6 text-sm font-normal text-brut-ink leading-relaxed border-l-2 border-brut-black pl-3">
              Sign in to save your plan.
            </p>
          ) : null}
          {searchParams.error ? (
            <p className="mt-6 text-sm font-normal text-brut-ink leading-relaxed border-l-2 border-brut-black pl-3">
              Sign-in could not be completed. Please try again.
            </p>
          ) : null}

          <div className="mt-10">
            <LoginForm next={next} />
          </div>

          <p className="mt-10 text-sm font-normal text-brut-muted">
            Don&rsquo;t have an account?{' '}
            <Link
              href={registerHref}
              className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
