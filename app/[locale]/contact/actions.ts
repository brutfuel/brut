'use server';

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
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input.',
    };
  }

  const result = await sendContactEmail(parsed.data);
  if (!result.ok) {
    return {
      ok: false,
      error:
        'Could not send your message. Try again or write directly to hello@brutfuel.com.',
    };
  }
  return { ok: true };
}
