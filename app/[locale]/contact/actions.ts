'use server';

import { getTranslations } from 'next-intl/server';
import { sendContactEmail } from '@/lib/email/send';
import {
  contactMessageSchema,
  type ContactMessageValues,
} from '@/lib/validation/contact';

type ActionResult = { ok: true } | { ok: false; error: string };

export async function sendContactMessage(
  values: ContactMessageValues,
): Promise<ActionResult> {
  const parsed = contactMessageSchema.safeParse(values);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message ?? 'email_invalid';
    const tV = await getTranslations('common.validation');
    return { ok: false, error: tV(code) };
  }

  const result = await sendContactEmail(parsed.data);
  if (!result.ok) {
    const tC = await getTranslations('contact');
    return { ok: false, error: tC('send_failed') };
  }
  return { ok: true };
}
