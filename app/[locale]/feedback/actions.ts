'use server';

import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { sendFeedbackEmail } from '@/lib/email/send';
import {
  feedbackMessageSchema,
  type FeedbackMessageValues,
} from '@/lib/validation/contact';

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Receive a feedback message from a signed-in athlete and forward it
 * to hello@brutfuel.com via the email adapter.
 */
export async function sendFeedback(
  values: FeedbackMessageValues,
): Promise<ActionResult> {
  const parsed = feedbackMessageSchema.safeParse(values);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message ?? 'feedback_min';
    const tV = await getTranslations('common.validation');
    return { ok: false, error: tV(code) };
  }

  // Optional gate — only signed-in users can submit. Keeps the button
  // a low-volume signal rather than a public form.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tFb = await getTranslations('feedback_button');
  if (!user) {
    return { ok: false, error: tFb('sign_in_required') };
  }

  const result = await sendFeedbackEmail(parsed.data);
  if (!result.ok) {
    return { ok: false, error: tFb('send_failed') };
  }
  return { ok: true };
}
