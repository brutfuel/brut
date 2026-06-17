'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import { requestPasswordReset } from '@/app/[locale]/login/actions';
import {
  requestPasswordResetSchema,
  type RequestPasswordResetValues,
} from '@/lib/validation/password';

const blackButton =
  'w-full py-4 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const fieldError = 'mt-2 text-xs font-medium text-brut-ink';

export default function ForgotPasswordForm() {
  const t = useTranslations('auth.forgot_password');
  const tLogin = useTranslations('auth.login');
  const tCommon = useTranslations('common.actions');
  const tV = useTranslations('common.validation');
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetValues>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: RequestPasswordResetValues) {
    startTransition(async () => {
      await requestPasswordReset(values);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-normal text-brut-ink leading-relaxed border-l-2 border-brut-black pl-3">
          {t('success')}
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors self-start underline underline-offset-4 decoration-brut-line hover:decoration-brut-black"
        >
          {t('resend')}
        </button>
      </div>
    );
  }

  return (
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
      <button type="submit" disabled={pending} className={blackButton}>
        {pending ? tCommon('sending') : t('submit')}
      </button>
    </form>
  );
}
