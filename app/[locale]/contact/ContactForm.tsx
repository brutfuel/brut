'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input';
import { sendContactMessage } from '@/app/[locale]/contact/actions';
import {
  contactMessageSchema,
  type ContactMessageValues,
} from '@/lib/validation/contact';

const blackButton =
  'w-full py-4 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const fieldError = 'mt-2 text-xs font-medium text-brut-ink';
const subLabel =
  'text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted';

interface Props {
  initialEmail?: string;
  initialName?: string;
}

export default function ContactForm({
  initialEmail = '',
  initialName = '',
}: Props) {
  const t = useTranslations('contact');
  const tV = useTranslations('common.validation');
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactMessageValues>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      name: initialName,
      email: initialEmail,
      message: '',
    },
  });

  function onSubmit(values: ContactMessageValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await sendContactMessage(values);
      if (result.ok) {
        setSent(true);
        reset({ name: values.name, email: values.email, message: '' });
      } else {
        setFormError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      <div>
        <Input
          id="name"
          label={t('name_label')}
          type="text"
          autoComplete="name"
          placeholder={t('name_placeholder')}
          {...register('name')}
        />
        {errors.name?.message ? (
          <p className={fieldError}>{tV(errors.name.message)}</p>
        ) : null}
      </div>
      <div>
        <Input
          id="email"
          label={t('email_label')}
          type="email"
          autoComplete="email"
          placeholder={t('email_placeholder')}
          {...register('email')}
        />
        {errors.email?.message ? (
          <p className={fieldError}>{tV(errors.email.message)}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="message" className={subLabel}>
          {t('message_label')}
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder={t('message_placeholder')}
          className="w-full bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black placeholder:text-brut-muted focus:outline-none focus:border-brut-black transition-colors resize-none"
          {...register('message')}
        />
        {errors.message?.message ? (
          <p className={fieldError}>{tV(errors.message.message)}</p>
        ) : null}
      </div>

      {sent ? (
        <p className="text-sm font-normal text-brut-ink leading-relaxed border-l-2 border-brut-black pl-3">
          {t('success')}
        </p>
      ) : null}
      {formError ? (
        <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
          {formError}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={blackButton}>
        {pending ? t('submit_pending') : t('submit')}
      </button>
    </form>
  );
}
