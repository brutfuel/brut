// Pure functions used to compute the dashboard's per-block data.
// No DB access, no React — the page calls these with already-loaded rows.

import { dayOfWeekFromIso } from '@/lib/utils/dates';
import type {
  NutritionPhase,
  Phase,
  RacePlan,
  Session,
} from '@/lib/types/db';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Monday (00:00 local) of the week containing the given ISO date. */
function mondayOfIso(iso: string): Date {
  const d = new Date(`${iso}T00:00:00`);
  const dow = dayOfWeekFromIso(iso); // 1..7
  d.setDate(d.getDate() - (dow - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Which week of the programme `today` falls into. The final week
 * (= `weeks_total`) contains the race date; earlier weeks count back.
 * Clamped to [1, weeks_total].
 */
export function getCurrentWeekNumber(
  plan: Pick<RacePlan, 'race_date' | 'weeks_total'>,
  today: string,
): number {
  const raceMonday = mondayOfIso(plan.race_date);
  const week1Monday = new Date(raceMonday);
  week1Monday.setDate(raceMonday.getDate() - (plan.weeks_total - 1) * 7);
  const todayDate = new Date(`${today}T00:00:00`);
  const days = Math.floor(
    (todayDate.getTime() - week1Monday.getTime()) / MS_PER_DAY,
  );
  const week = Math.floor(days / 7) + 1;
  return Math.max(1, Math.min(plan.weeks_total, week));
}

/** Find a session scheduled exactly for `today`. */
export function getTodaysSession(
  sessions: Session[],
  today: string,
): Session | null {
  return sessions.find((s) => s.scheduled_date === today) ?? null;
}

export interface WeekProgress {
  completed: number;
  skipped: number;
  total: number;
  pct: number;
}

/** Counts of completed / skipped / total for the given week's sessions. */
export function getWeekProgress(sessionsThisWeek: Session[]): WeekProgress {
  const completed = sessionsThisWeek.filter(
    (s) => s.status === 'completed',
  ).length;
  const skipped = sessionsThisWeek.filter(
    (s) => s.status === 'skipped',
  ).length;
  const total = sessionsThisWeek.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, skipped, total, pct };
}

/** Sum of distances (km) for COMPLETED sessions this week. */
export function getKmCompletedThisWeek(sessionsThisWeek: Session[]): number {
  return sessionsThisWeek
    .filter((s) => s.status === 'completed' && s.distance_km != null)
    .reduce((sum, s) => sum + (s.distance_km ?? 0), 0);
}

/** Sum of distances (km) PLANNED this week, regardless of status. */
export function getKmPlannedThisWeek(sessionsThisWeek: Session[]): number {
  return sessionsThisWeek
    .filter((s) => s.distance_km != null && s.status !== 'skipped')
    .reduce((sum, s) => sum + (s.distance_km ?? 0), 0);
}

/**
 * Next `n` non-completed, non-skipped sessions on or after `today`,
 * sorted by `scheduled_date` ascending.
 */
export function getNextNSessions(
  sessions: Session[],
  n: number,
  today: string,
): Session[] {
  return sessions
    .filter((s) => s.status !== 'completed' && s.status !== 'skipped')
    .filter((s) => s.scheduled_date != null && s.scheduled_date >= today)
    .sort((a, b) => {
      const ad = a.scheduled_date ?? '';
      const bd = b.scheduled_date ?? '';
      return ad < bd ? -1 : ad > bd ? 1 : 0;
    })
    .slice(0, n);
}

/**
 * Total BRUT capsules planned across this week's sessions (skipping
 * sessions the athlete already marked as skipped).
 */
export function getCapsulesNeededThisWeek(sessionsThisWeek: Session[]): number {
  return sessionsThisWeek
    .filter((s) => s.status !== 'skipped' && s.during_nutrition)
    .reduce(
      (sum, s) => sum + (s.during_nutrition?.totals.capsules ?? 0),
      0,
    );
}

export function getPhaseForWeek(
  phases: Phase[],
  weekNumber: number,
): Phase | null {
  return (
    phases.find(
      (p) => weekNumber >= p.week_start && weekNumber <= p.week_end,
    ) ?? null
  );
}

export interface WeeklyNutritionTargets {
  carbsMinGPerDay: number;
  carbsMaxGPerDay: number;
  proteinMinGPerDay: number;
  proteinMaxGPerDay: number;
  hydrationMlPerDay: number;
  hydrationLPerDay: number;
}

/**
 * Translate per-phase g/kg/day guidelines into absolute grams using the
 * athlete's body weight. Returns null when no phase data is provided.
 */
export function getWeeklyNutritionTargets(
  weightKg: number,
  nutritionPhase: NutritionPhase | null,
): WeeklyNutritionTargets | null {
  if (!nutritionPhase) return null;
  const carbsMin = Math.round(weightKg * (nutritionPhase.carbs_g_per_kg_min ?? 0));
  const carbsMax = Math.round(weightKg * (nutritionPhase.carbs_g_per_kg_max ?? 0));
  const proteinMin = Math.round(
    weightKg * (nutritionPhase.protein_g_per_kg_min ?? 0),
  );
  const proteinMax = Math.round(
    weightKg * (nutritionPhase.protein_g_per_kg_max ?? 0),
  );
  const hydrationMl = Math.round(
    weightKg * (nutritionPhase.hydration_ml_per_kg ?? 0),
  );
  return {
    carbsMinGPerDay: carbsMin,
    carbsMaxGPerDay: carbsMax,
    proteinMinGPerDay: proteinMin,
    proteinMaxGPerDay: proteinMax,
    hydrationMlPerDay: hydrationMl,
    hydrationLPerDay: Math.round(hydrationMl / 100) / 10,
  };
}
