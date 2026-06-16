import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ForgotPasswordForm from '@/app/[locale]/forgot-password/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <div className="mx-auto w-full max-w-sm">
          <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
            Account
          </span>
          <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
            Forgot password
          </h1>
          <p className="mt-4 text-sm font-normal text-brut-ink leading-relaxed">
            Enter the email you signed up with. We&rsquo;ll send a link to
            reset your password.
          </p>

          <div className="mt-10">
            <ForgotPasswordForm />
          </div>

          <p className="mt-10 text-sm font-normal text-brut-muted">
            Remembered it?{' '}
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
