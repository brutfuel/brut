'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import {
  profileSchema,
  prsToDb,
  type ProfileFormValues,
} from '@/lib/validation/profile-schema';
import {
  deleteAccountSchema,
  type DeleteAccountValues,
} from '@/lib/validation/password';

type ActionResult = { ok: true } | { ok: false; error: string };

/** Persist the profile editor form. */
export async function updateProfile(
  values: ProfileFormValues,
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid profile details.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'You must be signed in to edit your profile.' };
  }

  const v = parsed.data;

  // `ftp` lives both inside the PRs JSON and as a top-level column kept
  // from the original schema. Mirror so any consumer reading the column
  // directly stays in sync with the PRs panel.
  const ftpFromPrs = v.prs.ftpWatts;

  const { error } = await supabase
    .from('profiles')
    .update({
      // Identity
      full_name: v.fullName,
      age: v.age,
      gender: v.gender,
      height_cm: v.heightCm,
      weight_kg: v.weightKg,
      // Experience
      primary_sport: v.primarySport,
      level: v.level,
      years_training: v.yearsTraining,
      weekly_volume_hours: v.weeklyVolumeHours,
      longest_recent_session_km: v.longestRecentSessionKm,
      // PRs
      prs: prsToDb(v.prs),
      ftp: ftpFromPrs,
      // Physiology
      fcmax: v.fcmax,
      fcrest: v.fcrest,
      vo2max: v.vo2max,
      // Health
      injuries: v.injuries.trim() ? v.injuries : null,
      dietary_restrictions: v.dietaryRestrictions,
      medically_cleared: v.medicallyCleared,
      // Hydration
      acclimated: v.acclimated,
      sodium_diet: v.sodiumDiet,
      known_sweat_rate_lh: v.knownSweatRateLh,
      // Logistics
      typical_training_time: v.typicalTrainingTime,
      typical_terrain: v.typicalTerrain,
    })
    .eq('id', user.id);

  if (error) {
    return { ok: false, error: 'Could not save your profile. Please try again.' };
  }

  return { ok: true };
}

// ----------------------------------------------------------------
// Delete account (GDPR)
// ----------------------------------------------------------------

/**
 * Permanently delete the signed-in user's account. Uses the Supabase
 * Admin API (service role key, server-only) to remove the auth.users
 * row — `profiles`, `race_plans`, `race_day_plans` and every other
 * child row cascade away via the schema's ON DELETE CASCADE FKs.
 *
 * On success the user's session cookie is cleared and they are
 * redirected to the home page.
 */
export async function deleteAccount(
  values: DeleteAccountValues,
): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Confirm to continue.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: 'You must be signed in to delete your account.',
    };
  }

  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!adminUrl || !serviceKey) {
    return {
      ok: false,
      error: 'Server is not configured to delete accounts.',
    };
  }

  const admin = createAdminClient(adminUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return { ok: false, error: 'Could not delete your account. Try again.' };
  }

  // Clear the current session cookie — best-effort. Client navigates.
  await supabase.auth.signOut();
  return { ok: true };
}
