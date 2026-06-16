import type { PrimarySport } from '@/lib/validation/auth';
import type { ExperienceLevel } from '@/lib/validation/race';
import type { AppLocale } from '@/lib/i18n/routing';
import type { PhaseName } from '@/lib/calculations/race-plan-generator';
import type {
  CourseProfile,
  DuringRacePlan,
  ExpectedWeather,
  PacingStrategy,
  PostRacePlan,
  PreRaceDay,
  RaceMorningPlan,
} from '@/lib/calculations/race-day-generator';
import type {
  Gender,
  ProfilePrsDbShape,
  SodiumDietValue,
  TrainingTime,
} from '@/lib/validation/profile-schema';
import type {
  PostSessionPlan,
  PreSessionPlan,
  ScheduleRow,
  SessionStructure,
  SessionType,
} from '@/lib/calculations/types';

/**
 * Lightweight row types for the tables the app reads directly.
 * The Supabase client is untyped for now (no generated `Database`
 * type), so query results are cast to these at the call site.
 */

/** Shape of the `profiles.prs` JSONB column (snake_case keys). */
export type ProfilePrsDb = ProfilePrsDbShape;

export interface Profile {
  id: string;
  // Identity
  full_name: string | null;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  // Experience
  primary_sport: PrimarySport | null;
  level: ExperienceLevel | null;
  years_training: number | null;
  weekly_volume_hours: number | null;
  longest_recent_session_km: number | null;
  // Personal records
  prs: ProfilePrsDb | null;
  // Physiology
  fcmax: number | null;
  fcrest: number | null;
  vo2max: number | null;
  ftp: number | null;
  // Health
  injuries: string | null;
  dietary_restrictions: string[] | null;
  medically_cleared: boolean | null;
  // Hydration profile
  acclimated: boolean | null;
  sodium_diet: SodiumDietValue | null;
  known_sweat_rate_lh: number | null;
  // Logistics
  typical_training_time: TrainingTime | null;
  typical_terrain: string[] | null;
  // Added by migration-profile-locale.sql
  locale: AppLocale | null;
}

export type RacePlanStatus = 'active' | 'completed' | 'archived' | 'paused';

export interface RacePlan {
  id: string;
  user_id: string;
  sport: PrimarySport;
  distance_km: number;
  target_time_minutes: number | null;
  race_date: string;
  race_name: string | null;
  weeks_total: number;
  days_per_week: number;
  hours_per_week: number | null;
  status: RacePlanStatus;
  current_week: number;
  created_at: string;
  // Added by migration-race-plan-generation.sql
  surface: string | null;
  elevation_gain_m: number | null;
  experience_level: ExperienceLevel | null;
  current_weekly_volume_hours: number | null;
  longest_recent_session_hours: number | null;
  hr_max: number | null;
  ftp: number | null;
  preferred_time: string | null;
  training_days: number[] | null;
}

export interface Phase {
  id: string;
  race_plan_id: string;
  name: PhaseName;
  order_index: number;
  week_start: number;
  week_end: number;
  focus_description: string | null;
}

/** Shape of the `sessions.during_nutrition` jsonb payload. */
export interface SessionDuringNutrition {
  carbsPerHour: number;
  capsulesPerHour: number;
  schedule: ScheduleRow[];
  totals: { capsules: number; waterMl: number; carbsG: number };
}

export type SessionStatus = 'planned' | 'completed' | 'skipped' | 'modified';
export type SessionFelt = 'easy' | 'right' | 'hard';

export interface Session {
  id: string;
  race_plan_id: string;
  phase_id: string | null;
  week_number: number;
  day_of_week: number;
  scheduled_date: string | null;
  session_type: SessionType;
  duration_minutes: number;
  distance_km: number | null;
  target_zone: string | null;
  structure: SessionStructure | null;
  structure_text: string | null;
  pre_session_nutrition: PreSessionPlan | null;
  during_nutrition: SessionDuringNutrition | null;
  post_session_nutrition: PostSessionPlan | null;
  status: SessionStatus;
  completed_at: string | null;
  user_notes: string | null;
  // Added by migration-session-tracking.sql
  felt: SessionFelt | null;
  capsules_taken: number | null;
}

export interface NutritionPhase {
  id: string;
  phase_id: string;
  carbs_g_per_kg_min: number | null;
  carbs_g_per_kg_max: number | null;
  protein_g_per_kg_min: number | null;
  protein_g_per_kg_max: number | null;
  hydration_ml_per_kg: number | null;
  carb_periodisation_note: string | null;
  timing_guidelines: string | null;
  food_focus: string | null;
  things_to_avoid: string | null;
}

export type RaceDayStatus = 'draft' | 'finalized' | 'archived';

export interface RaceDayPlan {
  id: string;
  race_plan_id: string;
  user_id: string;
  course_profile: CourseProfile | null;
  expected_temperature_c: number | null;
  expected_humidity_pct: number | null;
  expected_weather: ExpectedWeather | null;
  start_time: string | null;
  pacing_strategy: PacingStrategy | null;
  caffeine_ok: boolean | null;
  preferred_gels: string | null;
  pre_race_week: PreRaceDay[] | null;
  race_morning: RaceMorningPlan | null;
  during_race: DuringRacePlan | null;
  post_race: PostRacePlan | null;
  status: RaceDayStatus;
  created_at: string;
  updated_at: string;
}

/** Human-readable labels for every session type. */
export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  'easy-run': 'Easy run',
  'long-run': 'Long run',
  tempo: 'Tempo',
  intervals: 'Intervals',
  'hill-repeats': 'Hill repeats',
  recovery: 'Recovery',
  'race-simulation': 'Race simulation',
  endurance: 'Endurance ride',
  'long-ride': 'Long ride',
  'sweet-spot': 'Sweet spot',
  threshold: 'Threshold',
  'hill-repeats-bike': 'Hill repeats',
  'recovery-bike': 'Recovery ride',
  'race-simulation-bike': 'Race simulation',
  swim: 'Swim',
  brick: 'Brick',
  'long-combined': 'Long combined',
  'recovery-tri': 'Recovery',
};
