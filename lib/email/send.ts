// Email send adapter. Lazy-loads `resend` so the app stays functional
// in local development when no API key is configured (the missing
// provider falls through to console logs).

import type { ContactMessageValues, FeedbackMessageValues } from '@/lib/validation/contact';
import { welcomeEmail } from '@/lib/email/templates/welcome';
import { passwordResetEmail } from '@/lib/email/templates/password-reset';

export type SendResult = { ok: true } | { ok: false; error: string };

interface ResendModule {
  Resend: new (apiKey: string) => {
    emails: {
      send: (payload: {
        from: string;
        to: string | string[];
        subject: string;
        text?: string;
        html?: string;
        reply_to?: string;
      }) => Promise<{ data: unknown; error: unknown }>;
    };
  };
}

const SUPPORT_INBOX = 'hello@brutfuel.com';

function fromHeader(): string {
  const name = process.env.EMAIL_FROM_NAME ?? 'Brut';
  const address = process.env.EMAIL_FROM ?? SUPPORT_INBOX;
  return `${name} <${address}>`;
}

/**
 * Lazy-load the `resend` package so the app does not need it as a hard
 * dependency in environments where `RESEND_API_KEY` is not configured
 * (local dev without email). Returns null when the package is missing.
 */
async function loadResend(): Promise<ResendModule | null> {
  if (!process.env.RESEND_API_KEY) return null;
  try {
    return (await import('resend')) as unknown as ResendModule;
  } catch {
    return null;
  }
}

async function rawSend(
  to: string,
  subject: string,
  text: string,
  replyTo?: string,
): Promise<SendResult> {
  const mod = await loadResend();
  const apiKey = process.env.RESEND_API_KEY;
  if (!mod || !apiKey) {
    // Fallback so local development without Resend still surfaces the
    // intent in the server logs and lets the UI complete normally.
    console.log('[email — stub]', { to, subject, text, replyTo });
    return { ok: true };
  }
  const client = new mod.Resend(apiKey);
  const { error } = await client.emails.send({
    from: fromHeader(),
    to,
    subject,
    text,
    reply_to: replyTo,
  });
  if (error) {
    console.warn('Resend send failed', error);
    return { ok: false, error: 'Email provider rejected the message.' };
  }
  return { ok: true };
}

export async function sendContactEmail(
  values: ContactMessageValues,
): Promise<SendResult> {
  const body = [
    `From: ${values.name} <${values.email}>`,
    '',
    values.message,
  ].join('\n');
  return rawSend(SUPPORT_INBOX, `Contact form — ${values.name}`, body, values.email);
}

export async function sendFeedbackEmail(
  values: FeedbackMessageValues,
): Promise<SendResult> {
  const body = [
    `From: ${values.email}`,
    values.url ? `Page: ${values.url}` : null,
    '',
    values.message,
  ]
    .filter(Boolean)
    .join('\n');
  return rawSend(SUPPORT_INBOX, 'Feedback — Brut app', body, values.email);
}

export async function sendWelcomeEmail(args: {
  to: string;
  firstName: string;
}): Promise<SendResult> {
  const { subject, text } = welcomeEmail(args.firstName);
  return rawSend(args.to, subject, text);
}

/**
 * Note: Supabase Auth sends the actual recovery email out of the box.
 * This helper exists so deploys can preview / test the copy locally,
 * and so the welcome flow has a sibling for symmetry.
 */
export async function sendPasswordResetEmail(args: {
  to: string;
  resetUrl: string;
}): Promise<SendResult> {
  const { subject, text } = passwordResetEmail(args.resetUrl);
  return rawSend(args.to, subject, text);
}
