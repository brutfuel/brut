// Deterministic Race Day plan generator.
//
// Produces four self-contained blocks (pre-race week, race morning,
// during-race segments, post-race recovery) from the race plan and
// the user's race-day setup. Pure — no DB, no React.

import type { Sport } from './types';

export type CourseProfile = 'flat' | 'rolling' | 'hilly' | 'mountainous';
export type ExpectedWeather = 'sunny' | 'cloudy' | 'rainy' | 'cold' | 'hot';
export type PacingStrategy =
  | 'even'
  | 'negative_split'
  | 'cautious_start'
  | 'aggressive_start';

export const COURSE_PROFILES: ReadonlyArray<CourseProfile> = [
  'flat',
  'rolling',
  'hilly',
  'mountainous',
];

export const EXPECTED_WEATHERS: ReadonlyArray<ExpectedWeather> = [
  'sunny',
  'cloudy',
  'rainy',
  'cold',
  'hot',
];

export const PACING_STRATEGIES: ReadonlyArray<PacingStrategy> = [
  'even',
  'negative_split',
  'cautious_start',
  'aggressive_start',
];

export interface RaceDayInput {
  sport: Sport;
  distanceKm: number;
  raceDate: string;
  /** Race goal time in minutes; null → estimate from a generic baseline. */
  targetTimeMinutes: number | null;
  weightKg: number;
  courseProfile: CourseProfile;
  expectedTemperatureC: number;
  expectedHumidityPct: number;
  expectedWeather: ExpectedWeather;
  /** Race start time in HH:MM (24h). */
  startTime: string;
  pacingStrategy: PacingStrategy;
  caffeineOk: boolean;
  preferredGels: string | null;
}

// ----------------------------------------------------------------
// Output shapes
// ----------------------------------------------------------------

export type DayMinusKey =
  | 'day_minus_7'
  | 'day_minus_6'
  | 'day_minus_5'
  | 'day_minus_4'
  | 'day_minus_3'
  | 'day_minus_2'
  | 'day_minus_1';

export interface PreRaceDay {
  day: DayMinusKey;
  focus: 'maintain' | 'taper' | 'rest' | 'race_prep';
  training: 'short_easy' | 'short_with_strides' | 'short_quality' | 'rest';
  nutrition_focus: 'normal' | 'carb_load' | 'low_fiber' | 'hydration_priority';
  notes: string;
}

export interface RaceMorningPlan {
  wake_up_offset_hours: number;
  meal_offset_hours: number;
  meal_carbs_g: number;
  meal_examples: string[];
  hydration_pre_race_ml: number;
  hydration_with_pinch_salt: boolean;
  last_brut_capsule_offset_min: number;
  warm_up_protocol: string;
}

export interface RaceSegmentFueling {
  gels: number;
  gel_at_km: number | null;
  water_ml: number;
  water_at_km: number;
  brut_capsules: number;
  brut_at_km: number | null;
}

export interface RaceSegment {
  km_start: number;
  km_end: number;
  pace_target: string;
  effort: string;
  fueling: RaceSegmentFueling;
  cues: string;
}

export interface DuringRacePlan {
  segments: RaceSegment[];
  notes: string;
}

export interface PostRacePlan {
  immediate_60_min: {
    protein_g: number;
    carbs_g: number;
    water_ml: number;
    brut_capsules: number;
    examples: string[];
  };
  day_of: string;
  day_after: string;
  day_2_after: string;
  return_to_training: string;
}

export interface GeneratedRaceDayPlan {
  pre_race_week: PreRaceDay[];
  race_morning: RaceMorningPlan;
  during_race: DuringRacePlan;
  post_race: PostRacePlan;
}

// ----------------------------------------------------------------
// Pre-race week
// ----------------------------------------------------------------

function buildPreRaceWeek(input: RaceDayInput): PreRaceDay[] {
  const easyVerb =
    input.sport === 'cycling'
      ? 'Easy spin'
      : input.sport === 'triathlon'
        ? 'Easy session in your strongest discipline'
        : 'Easy run';

  return [
    {
      day: 'day_minus_7',
      focus: 'maintain',
      training: 'short_quality',
      nutrition_focus: 'normal',
      notes: `Last quality session — short and crisp. 40–50 min total with 4–6 short race-pace pickups.`,
    },
    {
      day: 'day_minus_6',
      focus: 'taper',
      training: 'short_easy',
      nutrition_focus: 'normal',
      notes: `${easyVerb} 30–40 min at conversational effort.`,
    },
    {
      day: 'day_minus_5',
      focus: 'taper',
      training: 'short_with_strides',
      nutrition_focus: 'normal',
      notes: `${easyVerb} 30 min + 4 × 20s pickups to keep the legs sharp.`,
    },
    {
      day: 'day_minus_4',
      focus: 'taper',
      training: 'short_easy',
      nutrition_focus: 'normal',
      notes: `${easyVerb} 25–30 min, smooth form, no intensity.`,
    },
    {
      day: 'day_minus_3',
      focus: 'race_prep',
      training: 'short_easy',
      nutrition_focus: 'carb_load',
      notes: `${easyVerb} 20–30 min. Start lifting carbs — aim 8–10 g/kg today and tomorrow.`,
    },
    {
      day: 'day_minus_2',
      focus: 'race_prep',
      training: 'rest',
      nutrition_focus: 'low_fiber',
      notes: `Rest day. Switch to low-fibre carbs (white rice, pasta, bread) to avoid race-day GI surprises.`,
    },
    {
      day: 'day_minus_1',
      focus: 'race_prep',
      training: 'rest',
      nutrition_focus: 'hydration_priority',
      notes: `Rest. Drink consistently — pale yellow urine target. Add salt. No alcohol. Lay out kit and pin race number.`,
    },
  ];
}

// ----------------------------------------------------------------
// Race morning
// ----------------------------------------------------------------

function buildRaceMorning(input: RaceDayInput): RaceMorningPlan {
  // 1.5 g carbs per kg body weight, rounded to 5 g.
  const mealCarbs = Math.round((input.weightKg * 1.5) / 5) * 5;

  const baseExamples = [
    `Oats + banana + honey (~${mealCarbs} g carbs)`,
    `White toast + jam + small coffee (~${mealCarbs} g carbs)`,
    `Rice + scrambled egg whites + dates`,
  ];
  if (!input.caffeineOk) {
    baseExamples[1] = `White toast + jam + small juice (~${mealCarbs} g carbs)`;
  }

  const warmUp =
    input.sport === 'cycling'
      ? '10 min easy spin + 3 × 30s openers ending 10 min before start.'
      : input.sport === 'triathlon'
        ? '5 min easy jog + dynamic mobility + 4 × 20s swim pickups.'
        : '15 min walk + 5 min easy jog + 4 × 20s strides ending 10 min before start.';

  return {
    wake_up_offset_hours: 3,
    meal_offset_hours: 2.5,
    meal_carbs_g: mealCarbs,
    meal_examples: baseExamples,
    hydration_pre_race_ml: 500,
    hydration_with_pinch_salt: true,
    last_brut_capsule_offset_min: 30,
    warm_up_protocol: warmUp,
  };
}

// ----------------------------------------------------------------
// During race — segments
// ----------------------------------------------------------------

/** Sensible breakpoints (in km) for splitting the race into segments. */
function segmentBreaks(distanceKm: number): number[] {
  const step =
    distanceKm >= 100
      ? 25
      : distanceKm >= 30
        ? 10
        : distanceKm >= 15
          ? 5
          : distanceKm >= 8
            ? 2
            : 1;
  const breaks: number[] = [];
  for (let k = step; k < distanceKm - step / 2; k += step) {
    breaks.push(k);
  }
  breaks.push(distanceKm);
  return breaks;
}

function paceString(minPerKm: number): string {
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

function speedString(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`;
}

/** Rough baseline pace if the user hasn't set a target time. */
function defaultBaselineMinPerKm(sport: Sport, distanceKm: number): number {
  if (sport === 'cycling') return 60 / 28; // ≈ 28 km/h
  if (sport === 'triathlon') return 60 / 18;
  // Running: pace eases with distance.
  if (distanceKm <= 10) return 5.2;
  if (distanceKm <= 25) return 5.5;
  if (distanceKm <= 50) return 6.0;
  return 6.5;
}

/** Heat adjustment in seconds-per-km, capped. */
function heatAdjustSecPerKm(tempC: number): number {
  if (tempC <= 25) return 0;
  return Math.min(30, Math.round((tempC - 25) * 7));
}

interface SegmentNumbers {
  basePaceMin: number; // base pace min/km (or min/km equivalent)
  pacePerSegment: number[]; // per-segment pace adjustment in seconds added
  waterPerSegment: number; // ml
  capsulesPerSegment: number; // base capsules per segment (before bonuses)
  gelsPerSegment: number;
}

function buildSegments(input: RaceDayInput): RaceSegment[] {
  const breaks = segmentBreaks(input.distanceKm);
  const segCount = breaks.length;

  // Base pace.
  const basePace =
    input.targetTimeMinutes && input.targetTimeMinutes > 0
      ? input.targetTimeMinutes / input.distanceKm
      : defaultBaselineMinPerKm(input.sport, input.distanceKm);

  // Per-segment adjustments (negative = faster).
  const adjust = new Array<number>(segCount).fill(0);

  // Heat adjustment applied to every segment.
  const heatSec = heatAdjustSecPerKm(input.expectedTemperatureC);
  for (let i = 0; i < segCount; i += 1) {
    adjust[i] = (adjust[i] ?? 0) + heatSec;
  }

  switch (input.pacingStrategy) {
    case 'cautious_start':
      adjust[0] = (adjust[0] ?? 0) + 8;
      break;
    case 'aggressive_start':
      adjust[0] = (adjust[0] ?? 0) - 5;
      break;
    case 'negative_split': {
      const lastTwo = Math.max(0, segCount - 2);
      for (let i = lastTwo; i < segCount; i += 1) {
        adjust[i] = (adjust[i] ?? 0) - 5;
      }
      break;
    }
    case 'even':
    default:
      break;
  }

  // Hot conditions also bump water and capsules.
  const tempBonus = input.expectedTemperatureC > 25 ? 1 : 0;
  const humidityBonus = input.expectedHumidityPct > 70 ? 1 : 0;

  // Effort labels per position in the race.
  const effortFor = (idx: number): string => {
    if (segCount <= 1) return 'race effort';
    if (idx === 0) return 'easy controlled';
    if (idx === segCount - 1) return 'finish strong';
    if (idx === Math.floor(segCount / 2)) return 'settle in';
    return 'rhythm';
  };

  const cueFor = (idx: number): string => {
    if (segCount <= 1) return 'Settle in, run your race.';
    if (idx === 0) return 'Stay relaxed. Resist going faster than the plan.';
    if (idx === segCount - 1) {
      return 'Last stretch — empty the tank with controlled form.';
    }
    if (idx === Math.floor(segCount / 2)) {
      return 'Halfway. Focus on cadence and breathing.';
    }
    return 'Hold rhythm. Tick off the kilometres.';
  };

  return breaks.map((kmEnd, idx) => {
    const kmStart = idx === 0 ? 0 : (breaks[idx - 1] ?? 0);
    const segLen = kmEnd - kmStart;

    let paceTarget: string;
    if (input.sport === 'cycling') {
      // Convert minutes/km to km/h, applying the seconds adjustment.
      const adjustedMinPerKm = basePace + (adjust[idx] ?? 0) / 60;
      const kmh = 60 / adjustedMinPerKm;
      paceTarget = speedString(kmh);
    } else {
      const adjusted = basePace + (adjust[idx] ?? 0) / 60;
      paceTarget = paceString(adjusted);
    }

    // Fuelling: ~1 gel per 30–45 min of running, scaled to segment length.
    const minutesInSegment = (basePace + (adjust[idx] ?? 0) / 60) * segLen;
    const gels = Math.max(0, Math.round(minutesInSegment / 35));
    const water_ml =
      Math.round((250 + (tempBonus ? 75 : 0)) * Math.max(1, segLen / 5)) >= 250
        ? Math.round((250 + (tempBonus ? 75 : 0)) * Math.min(2, segLen / 5))
        : 250;
    const brut_capsules = Math.max(
      0,
      Math.round(minutesInSegment / 45) + tempBonus + humidityBonus,
    );

    // Place fuelling cues at the midpoint of each segment.
    const mid = kmStart + segLen / 2;
    const round1 = (x: number) => Math.round(x * 10) / 10;

    return {
      km_start: round1(kmStart),
      km_end: round1(kmEnd),
      pace_target: paceTarget,
      effort: effortFor(idx),
      fueling: {
        gels,
        gel_at_km: gels > 0 ? round1(mid) : null,
        water_ml,
        water_at_km: round1(mid),
        brut_capsules,
        brut_at_km: brut_capsules > 0 ? round1(mid) : null,
      },
      cues: cueFor(idx),
    };
  });
}

function buildDuringRace(input: RaceDayInput): DuringRacePlan {
  const segments = buildSegments(input);
  const notes: string[] = [];
  if (input.expectedTemperatureC > 25) {
    notes.push('Heat adjustment: paces eased and fluids increased.');
  }
  if (input.expectedHumidityPct > 70) {
    notes.push('High humidity: extra BRUT capsule per segment.');
  }
  if (!input.caffeineOk) {
    notes.push('Avoid caffeinated gels — read the labels carefully.');
  }
  if (input.preferredGels) {
    notes.push(`Preferred fuelling: ${input.preferredGels}.`);
  }
  return {
    segments,
    notes: notes.join(' '),
  };
}

// ----------------------------------------------------------------
// Post-race
// ----------------------------------------------------------------

function buildPostRace(input: RaceDayInput): PostRacePlan {
  const carbsAfter = Math.round(input.weightKg * 1.0);
  return {
    immediate_60_min: {
      protein_g: 25,
      carbs_g: Math.max(60, carbsAfter),
      water_ml: 750,
      brut_capsules: 1,
      examples: [
        'Recovery shake (milk + whey + banana)',
        'Banana + peanut butter sandwich',
        'Chocolate milk + handful of pretzels',
      ],
    },
    day_of:
      'High carbs across meals, rehydrate steadily, gentle walking only. Cold shower or light stretch if needed.',
    day_after:
      'Easy 30 min walk. Normal balanced eating. No running. Sleep is the priority.',
    day_2_after:
      'Optional 20 min easy session (jog/spin) if you feel fresh. Otherwise another rest day.',
    return_to_training:
      'Day 5–7 depending on effort, soreness and motivation. Rebuild gradually — no quality work in the first ten days.',
  };
}

// ----------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------

export function generateRaceDayPlan(
  input: RaceDayInput,
): GeneratedRaceDayPlan {
  return {
    pre_race_week: buildPreRaceWeek(input),
    race_morning: buildRaceMorning(input),
    during_race: buildDuringRace(input),
    post_race: buildPostRace(input),
  };
}
