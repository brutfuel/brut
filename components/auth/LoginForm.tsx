'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import { signInWithEmail, signInWithGoogle } from '@/app/[locale]/login/actions';
import { loginSchema, type LoginValues } from '@/lib/validation/auth';

interface Props {
  /** In-app path to return to after a successful sign-in. */
  next?: string;
}

const blackButton =
  'w-full py-4 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const fieldError = 'mt-2 text-xs font-medium text-brut-ink';

export default function LoginForm({ next }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const [googlePending, startGoogle] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const result = await signInWithEmail(values, next);
    // A successful sign-in redirects server-side; only errors return here.
    if (result?.error) {
      setFormError(result.error);
    }
  }

  function onGoogle() {
    setFormError(null);
    startGoogle(async () => {
      const result = await signInWithGoogle(next);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <button
        type="button"
        onClick={onGoogle}
        disabled={googlePending || isSubmitting}
        className={blackButton}
      >
        {googlePending ? 'Redirecting…' : 'Continue with Google'}
      </button>

      {/* Editorial divider */}
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-brut-line" />
        <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
          or
        </span>
        <span className="h-px flex-1 bg-brut-line" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div>
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email ? <p className={fieldError}>{errors.email.message}</p> : null}
        </div>

        <div>
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password ? (
            <p className={fieldError}>{errors.password.message}</p>
          ) : null}
          <Link
            href="/forgot-password"
            className="mt-2 inline-block text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors underline underline-offset-4 decoration-brut-line hover:decoration-brut-black"
          >
            Forgot password?
          </Link>
        </div>

        {formError ? (
          <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
            {formError}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting || googlePending} className={blackButton}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
