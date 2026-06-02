'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email/send';
import {
  onboardingSchema,
  registerSchema,
  type OnboardingValues,
  type RegisterValues,
} from '@/lib/validation/auth';

type ActionResult = { error: string };

/**
 * Create a new account with email + password.
 * On success the user is sent to the onboarding flow.
 *
 * Note: this assumes "Confirm email" is disabled in Supabase Auth so a
 * session is available immediately. With confirmation enabled, the user
 * would need to verify via email before onboarding.
 */
export async function signUpWithEmail(
  values: RegisterValues,
): Promise<ActionResult | void> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid details.' };
  }

  const supabase = await createClient();
  const origin = (await headers()).get('origin') ?? '';

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/register/onboarding`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/register/onboarding');
}

/**
 * Save the onboarding answers onto the user's profile row.
 * The profile row already exists (created by the `handle_new_user`
 * trigger on signup), so this is an update.
 */
export async function completeOnboarding(
  values: OnboardingValues,
): Promise<ActionResult | void> {
  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid details.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      age: parsed.data.age,
      gender: parsed.data.gender,
      primary_sport: parsed.data.primarySport,
      weight_kg: parsed.data.weightKg,
    })
    .eq('id', user.id);

  if (error) {
    return { error: 'Could not save your profile. Try again.' };
  }

  // Fire the welcome email once, after the profile is in place. We do
  // not block onboarding completion if the provider is misconfigured.
  if (user.email) {
    const firstName = parsed.data.fullName.trim().split(' ')[0] ?? '';
    try {
      await sendWelcomeEmail({ to: user.email, firstName });
    } catch (err) {
      console.warn('welcome email failed', err);
    }
  }

  redirect('/dashboard');
}
