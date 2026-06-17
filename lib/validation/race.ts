import { z } from 'zod';
import type {
  CyclingSurface,
  RunningSurface,
  TimeOfDay,
} from '@/lib/calculations/types';

/** Sports supported by the race plan builder. */
export const RACE_SPORTS = ['running', 'cycling', 'triathlon'] as const;
export type RaceSport = (typeof RACE_SPORTS)[number];

/** Programme length is clamped to this range (in weeks). */
export const MIN_WEEKS = 8;
export const MAX_WEEKS = 24;

/** Experience levels — mirror the `profiles.level` column. */
export const EXPERIENCE_LEVELS = ['beginner', 'amateur', 'pro'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

/** Time-of-day options — reuse the calculations `TimeOfDay` vocabulary. */
export const PREFERRED_TIME_VALUES: ReadonlyArray<TimeOfDay> = [
  'early-morning',
  'morning',
  'afternoon',
  'evening',
  'night',
];

/** Weekdays — 1 = Monday … 7 = Sunday (matches `sessions.day_of_week`). */
export const WEEKDAY_VALUES: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6, 7];

/** Terrain options per sport (triathlon has none). */
export const SURFACES_BY_SPORT: Record<
  RaceSport,
  ReadonlyArray<RunningSurface | CyclingSurface>
> = {
  running: ['track-road', 'trail'],
  cycling: ['road', 'gravel', 'mtb'],
  triathlon: [],
};

const RUNNING_SURFACES = ['track-road', 'trail'];
const CYCLING_SURFACES = ['road', 'gravel', 'mtb'];

/** Distance presets (km) offered per sport. */
export const DISTANCE_PRESETS: Record<
  RaceSport,
  ReadonlyArray<{ label: string; km: number }>
> = {
  running: [
    { label: '5K', km: 5 },
    { label: '10K', km: 10 },
    { label: '21K', km: 21.1 },
    { label: '42K', km: 42.2 },
    { label: '50K', km: 50 },
    { label: '100K', km: 100 },
    { label: '160K', km: 160 },
  ],
  cycling: [
    { label: '40K', km: 40 },
    { label: '80K', km: 80 },
    { label: '120K', km: 120 },
    { label: '160K', km: 160 },
    { label: '200K', km: 200 },
  ],
  triathlon: [
    { label: 'Sprint', km: 25.75 },
    { label: 'Olympic', km: 51.5 },
    { label: '70.3', km: 113 },
    { label: 'Ironman', km: 226 },
  ],
};

export const raceFormSchema = z
  .object({
    sport: z.enum(RACE_SPORTS),
    distanceKm: z
      .number({ error: 'distance_required' })
      .positive('distance_required')
      .max(1000, 'distance_too_large'),
    surface: z
      .enum(['track-road', 'trail', 'road', 'gravel', 'mtb'])
      .nullable(),
    elevationGainM: z
      .number()
      .int()
      .min(0)
      .max(15000, 'elevation_too_high')
      .nullable(),
    objectiveHours: z
      .number()
      .int()
      .min(0)
      .max(99, 'hours_invalid')
      .nullable(),
    objectiveMinutes: z
      .number()
      .int()
      .min(0)
      .max(59, 'minutes_invalid')
      .nullable(),
    raceDate: z.string().min(1, 'race_date_required'),
    trainingDays: z
      .array(z.number().int().min(1).max(7))
      .min(3, 'training_days_min')
      .max(7),
    preferredTime: z.enum([
      'early-morning',
      'morning',
      'afternoon',
      'evening',
      'night',
    ]),
    experienceLevel: z.enum(EXPERIENCE_LEVELS),
    currentWeeklyVolumeHours: z
      .number({ error: 'current_volume_required' })
      .positive('current_volume_required')
      .max(40, 'volume_too_high'),
    hoursPerWeek: z
      .number({ error: 'weekly_hours_required' })
      .positive('weekly_hours_required')
      .max(40, 'volume_too_high'),
    longestRecentSessionHours: z
      .number({ error: 'longest_session_required' })
      .positive('longest_session_required')
      .max(12, 'longest_session_too_long'),
    hrMax: z
      .number()
      .int()
      .min(120, 'hr_max_too_low')
      .max(230, 'hr_max_too_high')
      .nullable(),
    ftp: z
      .number()
      .int()
      .min(50, 'ftp_too_low')
      .max(600, 'ftp_too_high')
      .nullable(),
  })
  .refine(
    (d) => {
      if (!d.raceDate) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const race = new Date(`${d.raceDate}T00:00:00`);
      return !Number.isNaN(race.getTime()) && race >= today;
    },
    { message: 'race_date_future', path: ['raceDate'] },
  )
  .refine(
    (d) => {
      if (d.sport === 'running') {
        return d.surface !== null && RUNNING_SURFACES.includes(d.surface);
      }
      if (d.sport === 'cycling') {
        return d.surface !== null && CYCLING_SURFACES.includes(d.surface);
      }
      return true; // triathlon — no surface
    },
    { message: 'surface_required', path: ['surface'] },
  );

export type RaceFormValues = z.infer<typeof raceFormSchema>;

/** Weeks between today and the race date, clamped to the supported range. */
export function weeksUntilRace(raceDate: string): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const race = new Date(`${raceDate}T00:00:00`);
  const raw = Math.ceil((race.getTime() - today.getTime()) / msPerWeek);
  return Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, raw));
}
