'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getTranslations } from 'next-intl/server';
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
import { routing, type AppLocale } from '@/lib/i18n/routing';

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Persist the athlete's preferred locale onto `profiles.locale`. Used
 * by the LocaleSwitcher in the header. Silently no-ops for visitors
 * who are not signed in — their preference lives only in the
 * `NEXT_LOCALE` cookie set by next-intl's router.
 */
export async function updateLocale(locale: string): Promise<ActionResult> {
  const tE = await getTranslations('profile.actions');
  if (!(routing.locales as ReadonlyArray<string>).includes(locale)) {
    return { ok: false, error: tE('unsupported_locale') };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: true };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ locale: locale as AppLocale })
    .eq('id', user.id);

  if (error) {
    return { ok: false, error: tE('could_not_save_locale') };
  }
  return { ok: true };
}

/** Persist the profile editor form. */
export async function updateProfile(
  values: ProfileFormValues,
): Promise<ActionResult> {
  const tE = await getTranslations('profile.actions');
  const tV = await getTranslations('common.validation');
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message;
    return { ok: false, error: code ? tV(code) : tE('invalid_details') };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: tE('sign_in_required') };
  }

  const v = parsed.data;

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
    return { ok: false, error: tE('could_not_save') };
  }

  return { ok: true };
}

// ----------------------------------------------------------------
// Delete account (GDPR)
// ----------------------------------------------------------------

export async function deleteAccount(
  values: DeleteAccountValues,
): Promise<ActionResult> {
  const tE = await getTranslations('profile.actions');
  const tV = await getTranslations('common.validation');
  const parsed = deleteAccountSchema.safeParse(values);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message;
    return { ok: false, error: code ? tV(code) : tE('confirm_to_continue') };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: tE('sign_in_required_delete') };
  }

  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!adminUrl || !serviceKey) {
    return { ok: false, error: tE('not_configured') };
  }

  const admin = createAdminClient(adminUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return { ok: false, error: tE('could_not_delete') };
  }

  await supabase.auth.signOut();
  return { ok: true };
}
