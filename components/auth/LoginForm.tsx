'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import { Link } from '@/lib/i18n/routing';
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
  const tAuth = useTranslations('common.auth_actions');
  const tCommon = useTranslations('common.actions');
  const tLogin = useTranslations('auth.login');
  const tV = useTranslations('common.validation');
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
        {googlePending ? tCommon('redirecting') : tAuth('continue_with_google')}
      </button>

      {/* Editorial divider */}
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-brut-line" />
        <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
          {tAuth('or')}
        </span>
        <span className="h-px flex-1 bg-brut-line" />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        <div>
          <Input
            id="email"
            label={tLogin('email_label')}
            type="email"
            autoComplete="email"
            placeholder={tLogin('email_placeholder')}
            {...register('email')}
          />
          {errors.email?.message ? (
            <p className={fieldError}>{tV(errors.email.message)}</p>
          ) : null}
        </div>

        <div>
          <Input
            id="password"
            label={tLogin('password_label')}
            type="password"
            autoComplete="current-password"
            placeholder={tLogin('password_placeholder')}
            {...register('password')}
          />
          {errors.password?.message ? (
            <p className={fieldError}>{tV(errors.password.message)}</p>
          ) : null}
          <Link
            href="/forgot-password"
            className="mt-2 inline-block text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors underline underline-offset-4 decoration-brut-line hover:decoration-brut-black"
          >
            {tAuth('forgot_password')}
          </Link>
        </div>

        {formError ? (
          <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || googlePending}
          className={blackButton}
        >
          {isSubmitting ? tAuth('signing_in') : tAuth('sign_in')}
        </button>
      </form>
    </div>
  );
}
