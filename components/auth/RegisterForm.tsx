'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import { signUpWithEmail } from '@/app/[locale]/register/actions';
import { signInWithGoogle } from '@/app/[locale]/login/actions';
import { registerSchema, type RegisterValues } from '@/lib/validation/auth';

const blackButton =
  'w-full py-4 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const fieldError = 'mt-2 text-xs font-medium text-brut-ink';

export default function RegisterForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [googlePending, startGoogle] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    const result = await signUpWithEmail(values);
    // On success the action redirects to onboarding; only errors return.
    if (result?.error) {
      setFormError(result.error);
    }
  }

  function onGoogle() {
    setFormError(null);
    startGoogle(async () => {
      const result = await signInWithGoogle('/register/onboarding');
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register('password')}
          />
          {errors.password ? (
            <p className={fieldError}>{errors.password.message}</p>
          ) : null}
        </div>

        <div>
          <Input
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className={fieldError}>{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        {formError ? (
          <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
            {formError}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting || googlePending} className={blackButton}>
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </div>
  );
}
