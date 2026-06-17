'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, type LoginValues } from '@/lib/validation/auth';
import {
  requestPasswordResetSchema,
  resendVerificationSchema,
  updatePasswordSchema,
  type RequestPasswordResetValues,
  type ResendVerificationValues,
  type UpdatePasswordValues,
} from '@/lib/validation/password';
import {
  localizedPath,
  routing,
  type AppLocale,
} from '@/lib/i18n/routing';
import type { Profile } from '@/lib/types/db';

type ActionResult = { error: string };
type OkResult = { ok: true } | { ok: false; error: string };

/** Only allow redirecting to in-app paths — never to an external URL. */
function safeNext(next?: string): string {
  return next && next.startsWith('/') && !next.startsWith('//')
    ? next
    : '/dashboard';
}

/**
 * Resolve the locale we should land the athlete in after a successful
 * sign-in. Preference order: `profiles.locale` (if set) → current
 * request locale → default locale.
 */
async function resolvePostSignInLocale(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<AppLocale> {
  const { data } = await supabase
    .from('profiles')
    .select('locale')
    .eq('id', userId)
    .maybeSingle();
  const stored = (data as Pick<Profile, 'locale'> | null)?.locale;
  if (stored && (routing.locales as ReadonlyArray<string>).includes(stored)) {
    return stored;
  }
  const current = await getLocale();
  return (
    (routing.locales as ReadonlyArray<string>).includes(current)
      ? current
      : routing.defaultLocale
  ) as AppLocale;
}

/**
 * Sign in with email + password. Returns an error on failure; on
 * success redirects to `next` (or the dashboard), under the athlete's
 * preferred locale.
 */
export async function signInWithEmail(
  values: LoginValues,
  next?: string,
): Promise<ActionResult | void> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message ?? 'email_invalid';
    const tV = await getTranslations('common.validation');
    return { error: tV(code) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    const tL = await getTranslations('auth.login');
    return { error: tL('incorrect') };
  }

  const locale = await resolvePostSignInLocale(supabase, data.user.id);
  redirect(localizedPath(locale, safeNext(next)));
}

/**
 * Start the Google OAuth flow. The callback URL carries both the
 * post-auth destination and the locale the athlete arrived from, so
 * the route handler can land brand-new Google users in their preferred
 * language even before a `profiles.locale` exists.
 */
export async function signInWithGoogle(
  next?: string,
): Promise<ActionResult | void> {
  const supabase = await createClient();
  const origin = (await headers()).get('origin') ?? '';
  const locale = await getLocale();
  const callback = `${origin}/auth/callback?next=${encodeURIComponent(
    safeNext(next),
  )}&locale=${encodeURIComponent(locale)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callback },
  });

  if (error || !data.url) {
    const tL = await getTranslations('auth.login');
    return { error: tL('google_failed') };
  }

  redirect(data.url);
}

/** Sign the current user out and return them to the login page. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = (await getLocale()) as AppLocale;
  redirect(localizedPath(locale, '/login'));
}

// ----------------------------------------------------------------
// Password reset flow
// ----------------------------------------------------------------

/**
 * Email a password reset link. The link sends the user to
 * `/auth/callback?next=/reset-password`, which exchanges the recovery
 * code for a session and forwards them to the new-password page.
 */
export async function requestPasswordReset(
  values: RequestPasswordResetValues,
): Promise<OkResult> {
  const parsed = requestPasswordResetSchema.safeParse(values);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message ?? 'email_invalid';
    const tV = await getTranslations('common.validation');
    return { ok: false, error: tV(code) };
  }

  const supabase = await createClient();
  const origin = (await headers()).get('origin') ?? '';
  const redirectTo = `${origin}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo },
  );
  // Do not leak whether an account exists — always report success.
  if (error) {
    // Server log only; user sees success regardless.
    console.warn('resetPasswordForEmail failed', error.message);
  }
  return { ok: true };
}

/**
 * Set a new password for the currently-authenticated session. Used
 * from `/reset-password` after the recovery link has logged the user in.
 */
export async function updatePassword(
  values: UpdatePasswordValues,
): Promise<OkResult> {
  const parsed = updatePasswordSchema.safeParse(values);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message ?? 'password_too_short';
    const tV = await getTranslations('common.validation');
    return { ok: false, error: tV(code) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tR = await getTranslations('auth.reset_password');
  if (!user) {
    return { ok: false, error: tR('expired_error') };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, error: tR('update_failed') };
  }
  return { ok: true };
}

/**
 * Re-send the signup confirmation email. Used from `/auth/verify`.
 */
export async function resendVerificationEmail(
  values: ResendVerificationValues,
): Promise<OkResult> {
  const parsed = resendVerificationSchema.safeParse(values);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message ?? 'email_invalid';
    const tV = await getTranslations('common.validation');
    return { ok: false, error: tV(code) };
  }

  const supabase = await createClient();
  const origin = (await headers()).get('origin') ?? '';

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/register/onboarding`,
    },
  });
  // Same as password reset — never confirm whether the email exists.
  if (error) {
    console.warn('resend verification failed', error.message);
  }
  return { ok: true };
}

