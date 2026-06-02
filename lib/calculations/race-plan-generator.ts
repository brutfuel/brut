// Deterministic race plan generator.
//
// Pure functions only — no DB, no React. Given a race goal and the
// athlete's availability it produces a periodised programme: four
// phases (Base/Build/Peak/Taper), a week-by-week volume curve and an
// individual session for every training day, following the polarized
// 80/20 methodology from CLAUDE.md.

import type {
  SessionInput,
  SessionStructure,
  SessionType,
  Sport,
  Surface,
  TimeOfDay,
} from './types';
import { buildSessionStructure } from './session-structure';
import type { ExperienceLevel } from '@/lib/validation/race';

export type PhaseName = 'base' | 'build' | 'peak' | 'taper';
export type SessionIntensity = 'easy' | 'long' | 'hard';

export interface RacePlanInput {
  sport: Sport;
  surface: Surface;
  distanceKm: number;
  elevationGainM: number | null;
  weeksTotal: number;
  trainingDays: number[]; // 1 = Mon … 7 = Sun
  preferredTime: TimeOfDay;
  experienceLevel: ExperienceLevel;
  currentWeeklyVolumeHours: number;
  hoursPerWeek: number; // availability ceiling
  longestRecentSessionHours: number;
  targetTimeMinutes: number | null;
  weightKg: number;
  hrMax: number | null;
  ftp: number | null;
}

export interface GeneratedPhase {
  name: PhaseName;
  orderIndex: number;
  weekStart: number;
  weekEnd: number;
  focusDescription: string;
}

export interface GeneratedSession {
  weekNumber: number;
  dayOfWeek: number; // 1-7
  sessionType: SessionType;
  intensity: SessionIntensity;
  durationMinutes: number;
  distanceKm: number | null;
  targetZone: string;
  structure: SessionStructure;
}

export interface GeneratedWeek {
  weekNumber: number;
  phaseName: PhaseName;
  plannedHours: number;
  isRecoveryWeek: boolean;
  sessions: GeneratedSession[];
}

export interface GeneratedPlan {
  phases: GeneratedPhase[];
  weeks: GeneratedWeek[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round hours to the nearest quarter, with a sane floor. */
function roundHours(h: number): number {
  return Math.max(1.5, Math.round(h * 4) / 4);
}

/** Round a minute count to the nearest 5, with a 20 min floor. */
function roundMinutes(h: number): number {
  return Math.max(20, Math.round((h * 60) / 5) * 5);
}

const PHASE_FOCUS: Record<PhaseName, string> = {
  base: 'Aerobic foundation — build easy volume, almost all Z1–Z2.',
  build: 'Threshold and tempo work — introduce structured intensity.',
  peak: 'Race-specific intensity — sharpen at goal effort.',
  taper: 'Cut volume, hold sharpness — arrive fresh on race day.',
};

const PEAK_MULTIPLIER: Record<ExperienceLevel, number> = {
  beginner: 1.3,
  amateur: 1.5,
  pro: 1.7,
};

// ----------------------------------------------------------------
// Phase periodisation
// ----------------------------------------------------------------

/** Split N weeks into Base/Build/Peak/Taper week counts. */
function splitPhases(weeksTotal: number): Record<PhaseName, number> {
  const taper = clamp(Math.round(weeksTotal * 0.1875), 1, 3);
  let base = Math.max(2, Math.round(weeksTotal * 0.25));
  let peak = Math.max(2, Math.round(weeksTotal * 0.25));
  let build = weeksTotal - base - peak - taper;
  while (build < 2 && base > 2) {
    base -= 1;
    build += 1;
  }
  while (build < 2 && peak > 2) {
    peak -= 1;
    build += 1;
  }
  return { base, build, peak, taper };
}

function buildPhases(weeksTotal: number): GeneratedPhase[] {
  const counts = splitPhases(weeksTotal);
  const order: PhaseName[] = ['base', 'build', 'peak', 'taper'];
  const phases: GeneratedPhase[] = [];
  let cursor = 1;
  order.forEach((name, index) => {
    const span = counts[name];
    phases.push({
      name,
      orderIndex: index,
      weekStart: cursor,
      weekEnd: cursor + span - 1,
      focusDescription: PHASE_FOCUS[name],
    });
    cursor += span;
  });
  return phases;
}

function phaseForWeek(phases: GeneratedPhase[], week: number): GeneratedPhase {
  return (
    phases.find((p) => week >= p.weekStart && week <= p.weekEnd) ??
    phases[phases.length - 1]!
  );
}

// ----------------------------------------------------------------
// Weekly volume curve
// ----------------------------------------------------------------

function isRecoveryWeek(
  week: number,
  peakWeek: number,
  inTaper: boolean,
): boolean {
  return week > 1 && week % 4 === 0 && week !== peakWeek && !inTaper;
}

/** Hours/week for every week of the programme. */
function buildVolumeCurve(
  input: RacePlanInput,
  phases: GeneratedPhase[],
): { hours: number[]; recovery: boolean[] } {
  const { weeksTotal } = input;
  const taperPhase = phases[phases.length - 1]!;
  const peakWeek = taperPhase.weekStart - 1; // last week of Peak
  const start = input.currentWeeklyVolumeHours;
  const peak = Math.min(
    input.hoursPerWeek,
    input.currentWeeklyVolumeHours * PEAK_MULTIPLIER[input.experienceLevel],
  );

  const hours: number[] = [];
  const recovery: boolean[] = [];
  let progression = start; // the underlying "build line"

  for (let week = 1; week <= weeksTotal; week += 1) {
    const inTaper = week > peakWeek;
    const isRecovery = isRecoveryWeek(week, peakWeek, inTaper);
    recovery.push(isRecovery);

    if (inTaper) {
      const taperWeeks = weeksTotal - peakWeek;
      const mult =
        taperWeeks <= 1
          ? [0.55]
          : taperWeeks === 2
            ? [0.7, 0.5]
            : [0.8, 0.6, 0.45];
      const idx = Math.min(week - peakWeek - 1, mult.length - 1);
      hours.push(roundHours(progression * mult[idx]!));
      continue;
    }

    if (week === 1) {
      hours.push(roundHours(start));
      continue;
    }

    if (isRecovery) {
      hours.push(roundHours(progression * 0.75));
      continue;
    }

    const denom = Math.max(1, peakWeek - 1);
    const linearTarget = start + (peak - start) * ((week - 1) / denom);
    // Cap week-on-week growth at +10%.
    progression = Math.min(linearTarget, progression * 1.1);
    hours.push(roundHours(progression));
  }

  return { hours, recovery };
}

// ----------------------------------------------------------------
// Session type selection
// ----------------------------------------------------------------

const EASY_TYPE: Record<Sport, SessionType> = {
  running: 'easy-run',
  cycling: 'endurance',
  triathlon: 'swim',
};
const RECOVERY_TYPE: Record<Sport, SessionType> = {
  running: 'recovery',
  cycling: 'recovery-bike',
  triathlon: 'recovery-tri',
};
const LONG_TYPE: Record<Sport, SessionType> = {
  running: 'long-run',
  cycling: 'long-ride',
  triathlon: 'long-combined',
};

const HARD_TYPES: Record<Sport, Record<PhaseName, SessionType[]>> = {
  running: {
    base: ['tempo', 'hill-repeats'],
    build: ['tempo', 'intervals'],
    peak: ['intervals', 'race-simulation'],
    taper: ['tempo'],
  },
  cycling: {
    base: ['sweet-spot'],
    build: ['sweet-spot', 'threshold'],
    peak: ['threshold', 'race-simulation-bike'],
    taper: ['sweet-spot'],
  },
  triathlon: {
    base: ['swim'],
    build: ['brick'],
    peak: ['brick'],
    taper: ['brick'],
  },
};

// ----------------------------------------------------------------
// Intensity zones / target descriptions
// ----------------------------------------------------------------

const ZONE_LABEL: Record<SessionType, string> = {
  'easy-run': 'Z2',
  'long-run': 'Z2',
  tempo: 'Z3–Z4',
  intervals: 'Z4–Z5',
  'hill-repeats': 'Z4–Z5',
  recovery: 'Z1',
  'race-simulation': 'Race pace',
  endurance: 'Z2',
  'long-ride': 'Z2',
  'sweet-spot': 'Z3–Z4',
  threshold: 'Z4',
  'hill-repeats-bike': 'Z4–Z5',
  'recovery-bike': 'Z1',
  'race-simulation-bike': 'Race power',
  swim: 'Z2–Z3',
  brick: 'Z3 race effort',
  'long-combined': 'Z2',
  'recovery-tri': 'Z1',
};

const HR_BAND: Record<SessionType, [number, number]> = {
  'easy-run': [0.68, 0.78],
  'long-run': [0.7, 0.78],
  tempo: [0.82, 0.88],
  intervals: [0.9, 0.97],
  'hill-repeats': [0.88, 0.95],
  recovery: [0.6, 0.68],
  'race-simulation': [0.85, 0.92],
  endurance: [0.68, 0.78],
  'long-ride': [0.68, 0.76],
  'sweet-spot': [0.83, 0.9],
  threshold: [0.88, 0.93],
  'hill-repeats-bike': [0.88, 0.95],
  'recovery-bike': [0.6, 0.68],
  'race-simulation-bike': [0.83, 0.9],
  swim: [0.75, 0.85],
  brick: [0.8, 0.88],
  'long-combined': [0.7, 0.78],
  'recovery-tri': [0.6, 0.68],
};

const FTP_BAND: Partial<Record<SessionType, [number, number]>> = {
  'sweet-spot': [0.88, 0.94],
  threshold: [0.95, 1.05],
  'race-simulation-bike': [0.9, 1.0],
};

function describeZone(
  sessionType: SessionType,
  hrMax: number | null,
  ftp: number | null,
): string {
  let label = ZONE_LABEL[sessionType];
  if (hrMax) {
    const [lo, hi] = HR_BAND[sessionType];
    label += ` · HR ${Math.round(hrMax * lo)}–${Math.round(hrMax * hi)}`;
  }
  const ftpBand = FTP_BAND[sessionType];
  if (ftp && ftpBand) {
    label += ` · ${Math.round(ftp * ftpBand[0])}–${Math.round(ftp * ftpBand[1])} W`;
  }
  return label;
}

// ----------------------------------------------------------------
// Day assignment
// ----------------------------------------------------------------

/** Pick k evenly spaced items from a sorted array. */
function pickSpread<T>(arr: T[], k: number): T[] {
  if (k <= 0) return [];
  if (k >= arr.length) return [...arr];
  if (k === 1) return [arr[Math.floor((arr.length - 1) / 2)]!];
  const out: T[] = [];
  for (let i = 0; i < k; i += 1) {
    out.push(arr[Math.round((i * (arr.length - 1)) / (k - 1))]!);
  }
  return Array.from(new Set(out));
}

interface DayPlan {
  longDay: number;
  hardDays: number[];
  easyDays: number[];
}

function assignDays(trainingDays: number[], hardCount: number): DayPlan {
  const days = [...trainingDays].sort((a, b) => a - b);
  // Long session: latest weekend day available, else the last day.
  const weekendDays = days.filter((d) => d >= 6);
  const longDay = weekendDays.length
    ? weekendDays[weekendDays.length - 1]!
    : days[days.length - 1]!;

  const remaining = days.filter((d) => d !== longDay);
  // Avoid stacking a hard day immediately before the long session.
  const dayBeforeLong = longDay - 1;
  let candidates = remaining.filter((d) => d !== dayBeforeLong);
  if (candidates.length < hardCount) candidates = remaining;

  const hardDays = pickSpread(candidates, hardCount);
  const easyDays = remaining.filter((d) => !hardDays.includes(d));
  return { longDay, hardDays, easyDays };
}

// ----------------------------------------------------------------
// Per-week duration sizing
// ----------------------------------------------------------------

const LONG_SHARE: Record<PhaseName, number> = {
  base: 0.3,
  build: 0.32,
  peak: 0.35,
  taper: 0.3,
};

interface WeekDurations {
  longHours: number;
  hardHours: number; // per hard session
  easyHours: number; // per easy session
}

function sizeWeek(
  plannedHours: number,
  daysPerWeek: number,
  hardCount: number,
  phaseName: PhaseName,
  weekProgress: number,
  longestRecentSessionHours: number,
): WeekDurations {
  const longCap = longestRecentSessionHours * (1 + 0.5 * weekProgress);
  let longHours = clamp(
    Math.min(plannedHours * LONG_SHARE[phaseName], longCap),
    0.75,
    plannedHours * 0.6,
  );

  const eachHard =
    hardCount > 0
      ? clamp((plannedHours * 0.2) / hardCount, 0.75, 1.5)
      : 0;
  const hardTotal = eachHard * hardCount;

  const easyCount = daysPerWeek - 1 - hardCount;
  const easyRemain = plannedHours - longHours - hardTotal;
  const eachEasy =
    easyCount > 0 ? clamp(easyRemain / easyCount, 0.5, 1.5) : 0;

  // Absorb any rounding residual into the long session.
  const sum = longHours + hardTotal + eachEasy * easyCount;
  longHours = Math.max(0.75, longHours + (plannedHours - sum));

  return { longHours, hardHours: eachHard, easyHours: eachEasy };
}

// ----------------------------------------------------------------
// Main entry point
// ----------------------------------------------------------------

function buildStructure(
  input: RacePlanInput,
  sessionType: SessionType,
  durationHours: number,
  distanceKm: number | null,
): SessionStructure {
  const sessionInput: SessionInput = {
    sport: input.sport,
    surface: input.surface,
    sessionType,
    duration: durationHours,
    distance: distanceKm,
    elevation: 0,
    temperature: 22,
    timeOfDay: input.preferredTime,
    lastMeal: '2-4h',
    weight: input.weightKg,
    humidity: 50,
    heatAcclimated: false,
    sodiumDiet: 'normal',
    knownSweatRate: null,
  };
  return buildSessionStructure(sessionInput);
}

export function generateRacePlan(input: RacePlanInput): GeneratedPlan {
  const phases = buildPhases(input.weeksTotal);
  const { hours, recovery } = buildVolumeCurve(input, phases);
  const daysPerWeek = input.trainingDays.length;

  // Running pace (min/km) from the goal time, used to estimate distance.
  const paceMinPerKm =
    input.sport === 'running' &&
    input.targetTimeMinutes &&
    input.distanceKm > 0
      ? input.targetTimeMinutes / input.distanceKm
      : null;

  const weeks: GeneratedWeek[] = [];

  for (let week = 1; week <= input.weeksTotal; week += 1) {
    const phase = phaseForWeek(phases, week);
    const isRecovery = recovery[week - 1]!;
    const plannedHours = hours[week - 1]!;

    // Hard sessions for the week.
    const phaseHardBase: Record<PhaseName, number> = {
      base: 1,
      build: 2,
      peak: 2,
      taper: 1,
    };
    let hardCount = phaseHardBase[phase.name];
    if (week <= 2) hardCount = 0; // ease into the programme
    if (isRecovery) hardCount = Math.max(0, hardCount - 1);
    hardCount = clamp(hardCount, 0, daysPerWeek - 2);

    const { longDay, hardDays, easyDays } = assignDays(
      input.trainingDays,
      hardCount,
    );

    const weekProgress = (week - 1) / Math.max(1, input.weeksTotal - 1);
    const sizes = sizeWeek(
      plannedHours,
      daysPerWeek,
      hardCount,
      phase.name,
      weekProgress,
      input.longestRecentSessionHours,
    );

    const hardPool = HARD_TYPES[input.sport][phase.name];
    const sessions: GeneratedSession[] = [];

    const addSession = (
      dayOfWeek: number,
      sessionType: SessionType,
      intensity: SessionIntensity,
      durationHours: number,
    ) => {
      const durationMinutes = roundMinutes(durationHours);
      const distanceKm =
        paceMinPerKm !== null
          ? Math.round((durationMinutes / paceMinPerKm) * 10) / 10
          : null;
      sessions.push({
        weekNumber: week,
        dayOfWeek,
        sessionType,
        intensity,
        durationMinutes,
        distanceKm,
        targetZone: describeZone(sessionType, input.hrMax, input.ftp),
        structure: buildStructure(
          input,
          sessionType,
          durationMinutes / 60,
          distanceKm,
        ),
      });
    };

    // Long session.
    addSession(longDay, LONG_TYPE[input.sport], 'long', sizes.longHours);

    // Hard sessions — rotate through the phase pool deterministically.
    hardDays.forEach((day, index) => {
      const type = hardPool[(week + index) % hardPool.length]!;
      addSession(day, type, 'hard', sizes.hardHours);
    });

    // Easy sessions — use the recovery variant on recovery weeks.
    const easyType = isRecovery
      ? RECOVERY_TYPE[input.sport]
      : EASY_TYPE[input.sport];
    easyDays.forEach((day) => {
      addSession(day, easyType, 'easy', sizes.easyHours);
    });

    sessions.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    weeks.push({
      weekNumber: week,
      phaseName: phase.name,
      plannedHours,
      isRecoveryWeek: isRecovery,
      sessions,
    });
  }

  return { phases, weeks };
}
