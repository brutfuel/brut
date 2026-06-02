'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import { updatePassword } from '@/app/login/actions';
import {
  updatePasswordSchema,
  type UpdatePasswordValues,
} from '@/lib/validation/password';

const blackButton =
  'w-full py-4 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const fieldError = 'mt-2 text-xs font-medium text-brut-ink';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  function onSubmit(values: UpdatePasswordValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await updatePassword(values);
      if (result.ok) {
        router.replace('/dashboard');
      } else {
        setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div>
        <Input
          id="password"
          label="New password"
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
          label="Confirm new password"
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

      <button type="submit" disabled={pending} className={blackButton}>
        {pending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
