'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
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
  const tAuth = useTranslations('common.auth_actions');
  const tCommon = useTranslations('common.actions');
  const tLogin = useTranslations('auth.login');
  const tReg = useTranslations('auth.register');
  const tV = useTranslations('common.validation');
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
        {googlePending ? tCommon('redirecting') : tAuth('continue_with_google')}
      </button>

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
            autoComplete="new-password"
            placeholder={tReg('password_hint_placeholder')}
            {...register('password')}
          />
          {errors.password?.message ? (
            <p className={fieldError}>{tV(errors.password.message)}</p>
          ) : null}
        </div>

        <div>
          <Input
            id="confirmPassword"
            label={tReg('confirm_password_label')}
            type="password"
            autoComplete="new-password"
            placeholder={tReg('confirm_password_placeholder')}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword?.message ? (
            <p className={fieldError}>{tV(errors.confirmPassword.message)}</p>
          ) : null}
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
          {isSubmitting ? tAuth('creating_account') : tAuth('sign_up')}
        </button>
      </form>
    </div>
  );
}
