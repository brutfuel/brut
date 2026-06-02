'use client';

import { useState, useTransition } from 'react';
import { resendVerificationEmail } from '@/app/login/actions';

interface Props {
  initialEmail: string;
}

const ghostButton =
  'inline-flex items-center justify-center px-5 py-3 border border-brut-black text-brut-black text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

export default function VerifyEmailClient({ initialEmail }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resend() {
    setError(null);
    if (!email.trim()) {
      setError('Enter your email to resend.');
      return;
    }
    startTransition(async () => {
      const result = await resendVerificationEmail({ email });
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
          Email
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSent(false);
            setError(null);
          }}
          placeholder="you@example.com"
          className="w-full bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black placeholder:text-brut-muted focus:outline-none focus:border-brut-black transition-colors"
        />
      </div>

      <button
        type="button"
        onClick={resend}
        disabled={pending}
        className={ghostButton}
      >
        {pending ? 'Sending…' : 'Resend verification email'}
      </button>

      {sent ? (
        <p className="text-sm font-normal text-brut-ink leading-relaxed border-l-2 border-brut-black pl-3">
          If an account exists for that email, a fresh verification link is on
          its way.
        </p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
          {error}
        </p>
      ) : null}
    </div>
  );
}
