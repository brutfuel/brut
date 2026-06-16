'use server';

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
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid feedback.',
    };
  }

  // Optional gate — only signed-in users can submit. Keeps the button
  // a low-volume signal rather than a public form.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Sign in to send feedback.' };
  }

  const result = await sendFeedbackEmail(parsed.data);
  if (!result.ok) {
    return {
      ok: false,
      error: 'Could not send feedback. Try again in a minute.',
    };
  }
  return { ok: true };
}
