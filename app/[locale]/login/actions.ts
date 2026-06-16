'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
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

type ActionResult = { error: string };
type OkResult = { ok: true } | { ok: false; error: string };

/** Only allow redirecting to in-app paths — never to an external URL. */
function safeNext(next?: string): string {
  return next && next.startsWith('/') && !next.startsWith('//')
    ? next
    : '/dashboard';
}

/**
 * Sign in with email + password. Returns an error on failure;
 * on success redirects to `next` (or the dashboard).
 */
export async function signInWithEmail(
  values: LoginValues,
  next?: string,
): Promise<ActionResult | void> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Enter a valid email and password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: 'Incorrect email or password.' };
  }

  redirect(safeNext(next));
}

/**
 * Start the Google OAuth flow. Supabase returns the provider URL,
 * which we redirect the browser to.
 */
export async function signInWithGoogle(
  next?: string,
): Promise<ActionResult | void> {
  const supabase = await createClient();
  const origin = (await headers()).get('origin') ?? '';
  const callback = `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callback },
  });

  if (error || !data.url) {
    return { error: 'Could not start Google sign-in. Try again.' };
  }

  redirect(data.url);
}

/** Sign the current user out and return them to the login page. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
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
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid email.',
    };
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
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid password.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: 'Your reset link has expired. Request a new one.',
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, error: 'Could not update password. Try again.' };
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
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid email.',
    };
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

