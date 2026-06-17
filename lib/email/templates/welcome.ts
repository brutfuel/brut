// Welcome email — plain text, editorial. Sent once after onboarding completes.

import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/lib/i18n/routing';

export interface WelcomeEmailContent {
  subject: string;
  text: string;
}

export async function welcomeEmail(
  firstName: string,
  locale: AppLocale = 'en',
): Promise<WelcomeEmailContent> {
  const t = await getTranslations({ locale, namespace: 'email.welcome' });
  const safeName = firstName.trim() || t('fallback_name');
  return {
    subject: t('subject'),
    text: [
      t('greeting', { name: safeName }),
      '',
      t('intro'),
      '',
      t('you_in'),
      '',
      t('item_train'),
      t('item_race'),
      t('item_nutrition'),
      '',
      t('questions'),
      '',
      t('signoff'),
      t('signature'),
    ].join('\n'),
  };
}
