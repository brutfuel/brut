import { z } from 'zod';
import {
  GENDERS,
  PRIMARY_SPORTS,
  type Gender,
  type PrimarySport,
} from '@/lib/validation/auth';
import { EXPERIENCE_LEVELS, type ExperienceLevel } from '@/lib/validation/race';

/**
 * Zod schema for the editable user profile. Shared by the client form
 * (React Hook Form resolver) and the server action (boundary check).
 *
 * Error messages are stable codes — UI maps them via `common.validation`.
 */

export { GENDERS };
export type { Gender };

export const SODIUM_DIETS = ['low', 'normal', 'high'] as const;
export type SodiumDietValue = (typeof SODIUM_DIETS)[number];

export const TRAINING_TIMES = [
  'early_morning',
  'morning',
  'afternoon',
  'evening',
  'night',
] as const;
export type TrainingTime = (typeof TRAINING_TIMES)[number];

export const DIETARY_RESTRICTION_OPTIONS = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'lactose_free',
  'gluten_free',
  'halal',
  'kosher',
  'none',
] as const;
export type DietaryRestriction = (typeof DIETARY_RESTRICTION_OPTIONS)[number];

export const TERRAIN_OPTIONS = [
  'road',
  'trail',
  'track',
  'gravel',
  'mtb',
] as const;
export type Terrain = (typeof TERRAIN_OPTIONS)[number];

export const prsSchema = z.object({
  fiveKMinutes: z.number().positive().max(120).nullable(),
  tenKMinutes: z.number().positive().max(180).nullable(),
  halfMinutes: z.number().positive().max(360).nullable(),
  marathonMinutes: z.number().positive().max(720).nullable(),
  ftpWatts: z.number().int().min(50).max(600).nullable(),
  twentyMinWatts: z.number().int().min(50).max(700).nullable(),
  olympicSwimMinutes: z.number().positive().max(90).nullable(),
  sprintBikeMinutes: z.number().positive().max(120).nullable(),
});
export type ProfilePrs = z.infer<typeof prsSchema>;

export const EMPTY_PRS: ProfilePrs = {
  fiveKMinutes: null,
  tenKMinutes: null,
  halfMinutes: null,
  marathonMinutes: null,
  ftpWatts: null,
  twentyMinWatts: null,
  olympicSwimMinutes: null,
  sprintBikeMinutes: null,
};

export const profileSchema = z.object({
  // Identity
  fullName: z.string().trim().min(1, 'name_required').max(80, 'name_too_long'),
  age: z
    .number()
    .int()
    .min(14, 'age_too_low')
    .max(90, 'age_too_high')
    .nullable(),
  gender: z.enum(GENDERS).nullable(),
  heightCm: z
    .number()
    .min(100, 'height_too_low')
    .max(230, 'height_too_high')
    .nullable(),
  weightKg: z
    .number()
    .min(30, 'weight_too_low')
    .max(200, 'weight_too_high'),

  // Experience
  level: z.enum(EXPERIENCE_LEVELS),
  yearsTraining: z.number().int().min(0).max(80).nullable(),
  primarySport: z.enum(PRIMARY_SPORTS),
  weeklyVolumeHours: z.number().min(0).max(40).nullable(),
  longestRecentSessionKm: z.number().min(0).max(300).nullable(),

  // Personal records
  prs: prsSchema,

  // Physiology
  fcmax: z.number().int().min(120).max(230).nullable(),
  fcrest: z.number().int().min(30).max(110).nullable(),
  vo2max: z.number().min(20).max(95).nullable(),

  // Health
  injuries: z.string().max(2000),
  dietaryRestrictions: z.array(z.enum(DIETARY_RESTRICTION_OPTIONS)),
  medicallyCleared: z.boolean(),

  // Hydration profile
  acclimated: z.boolean(),
  sodiumDiet: z.enum(SODIUM_DIETS),
  knownSweatRateLh: z
    .number()
    .min(0.2, 'sweat_rate_too_low')
    .max(4, 'sweat_rate_too_high')
    .nullable(),

  // Logistics
  typicalTrainingTime: z.enum(TRAINING_TIMES).nullable(),
  typicalTerrain: z.array(z.enum(TERRAIN_OPTIONS)),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

/** Re-export so the form can build the segmented control options. */
export { EXPERIENCE_LEVELS, PRIMARY_SPORTS };
export type { ExperienceLevel, PrimarySport };

// ----------------------------------------------------------------
// PRs (de)serialisation between the form (camelCase) and the JSONB
// column shape stored in Supabase (snake_case keys).
// ----------------------------------------------------------------

/** Shape stored in `profiles.prs`. */
export interface ProfilePrsDbShape {
  '5k_minutes'?: number | null;
  '10k_minutes'?: number | null;
  half_minutes?: number | null;
  marathon_minutes?: number | null;
  ftp_watts?: number | null;
  twenty_min_watts?: number | null;
  olympic_swim_minutes?: number | null;
  sprint_bike_minutes?: number | null;
}

export function prsToDb(form: ProfilePrs): ProfilePrsDbShape {
  return {
    '5k_minutes': form.fiveKMinutes,
    '10k_minutes': form.tenKMinutes,
    half_minutes: form.halfMinutes,
    marathon_minutes: form.marathonMinutes,
    ftp_watts: form.ftpWatts,
    twenty_min_watts: form.twentyMinWatts,
    olympic_swim_minutes: form.olympicSwimMinutes,
    sprint_bike_minutes: form.sprintBikeMinutes,
  };
}

export function prsFromDb(db: ProfilePrsDbShape | null | undefined): ProfilePrs {
  if (!db) return { ...EMPTY_PRS };
  return {
    fiveKMinutes: db['5k_minutes'] ?? null,
    tenKMinutes: db['10k_minutes'] ?? null,
    halfMinutes: db.half_minutes ?? null,
    marathonMinutes: db.marathon_minutes ?? null,
    ftpWatts: db.ftp_watts ?? null,
    twentyMinWatts: db.twenty_min_watts ?? null,
    olympicSwimMinutes: db.olympic_swim_minutes ?? null,
    sprintBikeMinutes: db.sprint_bike_minutes ?? null,
  };
}
