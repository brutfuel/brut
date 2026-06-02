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
export const PREFERRED_TIMES: ReadonlyArray<{
  value: TimeOfDay;
  label: string;
}> = [
  { value: 'early-morning', label: 'Early morning' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];

/** Weekdays — 1 = Monday … 7 = Sunday (matches `sessions.day_of_week`). */
export const WEEKDAYS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

/** Terrain options per sport (triathlon has none). */
export const SURFACES_BY_SPORT: Record<
  RaceSport,
  ReadonlyArray<{ value: RunningSurface | CyclingSurface; label: string }>
> = {
  running: [
    { value: 'track-road', label: 'Road / Track' },
    { value: 'trail', label: 'Trail' },
  ],
  cycling: [
    { value: 'road', label: 'Road' },
    { value: 'gravel', label: 'Gravel' },
    { value: 'mtb', label: 'MTB' },
  ],
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
      .number({ error: 'Enter a race distance' })
      .positive('Enter a race distance')
      .max(1000, 'Distance is too large'),
    surface: z
      .enum(['track-road', 'trail', 'road', 'gravel', 'mtb'])
      .nullable(),
    elevationGainM: z
      .number()
      .int()
      .min(0)
      .max(15000, 'Elevation looks too high')
      .nullable(),
    objectiveHours: z
      .number()
      .int()
      .min(0)
      .max(99, 'Check the hours value')
      .nullable(),
    objectiveMinutes: z
      .number()
      .int()
      .min(0)
      .max(59, 'Minutes must be 0–59')
      .nullable(),
    raceDate: z.string().min(1, 'Choose your race date'),
    trainingDays: z
      .array(z.number().int().min(1).max(7))
      .min(3, 'Pick at least 3 training days')
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
      .number({ error: 'Enter your current weekly volume' })
      .positive('Enter your current weekly volume')
      .max(40, 'That seems too high'),
    hoursPerWeek: z
      .number({ error: 'Enter your weekly availability' })
      .positive('Enter your weekly availability')
      .max(40, 'That seems too high'),
    longestRecentSessionHours: z
      .number({ error: 'Enter your longest recent session' })
      .positive('Enter your longest recent session')
      .max(12, 'That seems too long'),
    hrMax: z
      .number()
      .int()
      .min(120, 'HR max looks too low')
      .max(230, 'HR max looks too high')
      .nullable(),
    ftp: z
      .number()
      .int()
      .min(50, 'FTP looks too low')
      .max(600, 'FTP looks too high')
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
    { message: 'Race date must be in the future', path: ['raceDate'] },
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
    { message: 'Choose a terrain', path: ['surface'] },
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
