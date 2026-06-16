'use client';

import { useState, useTransition } from 'react';
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
      // Always report success regardless of whether the account exists.
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-normal text-brut-ink leading-relaxed border-l-2 border-brut-black pl-3">
          If an account exists for that email, a reset link is on its way.
          Check your inbox and your spam folder.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors self-start underline underline-offset-4 decoration-brut-line hover:decoration-brut-black"
        >
          Send another link
        </button>
      </div>
    );
  }

  return (
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
      <button type="submit" disabled={pending} className={blackButton}>
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
