import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VerifyEmailClient from '@/app/[locale]/auth/verify/VerifyEmailClient';

interface Props {
  searchParams: { email?: string };
}

export default function VerifyEmailPage({ searchParams }: Props) {
  const initialEmail =
    typeof searchParams.email === 'string' ? searchParams.email : '';

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <div className="mx-auto w-full max-w-sm">
          <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
            Account
          </span>
          <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
            Check your email
          </h1>
          <p className="mt-4 text-sm font-normal text-brut-ink leading-relaxed">
            We&rsquo;ve sent a verification link to{' '}
            {initialEmail ? (
              <span className="text-brut-black">{initialEmail}</span>
            ) : (
              'your inbox'
            )}
            . Open it to finish setting up your account.
          </p>
          <p className="mt-3 text-xs font-normal text-brut-muted">
            Didn&rsquo;t arrive? Check your spam folder or resend the email
            below.
          </p>

          <div className="mt-10">
            <VerifyEmailClient initialEmail={initialEmail} />
          </div>

          <p className="mt-10 text-sm font-normal text-brut-muted">
            Already verified?{' '}
            <Link
              href="/login"
              className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
