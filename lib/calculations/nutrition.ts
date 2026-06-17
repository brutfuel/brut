import { englishCalc, type CalcTranslator } from './translator';
import type {
  LastMeal,
  PostSessionPlan,
  PreSessionPlan,
  ScheduleRow,
  SessionInput,
  TimeOfDay,
} from './types';
import { BRUT_CAPSULE_SODIUM_MG } from './types';
import type { SweatMetrics } from './sweat';

// Easier-intensity types are eligible for the lower carb target.
const EASY_TYPES = new Set<SessionInput['sessionType']>([
  'easy-run',
  'recovery',
  'endurance',
  'recovery-bike',
  'recovery-tri',
  'swim',
  'long-run',
  'long-ride',
  'long-combined',
]);

// Hourly exogenous CHO target as a function of duration and intensity.
export function carbsPerHour(input: SessionInput): number {
  if (input.duration < 1) return 0;
  const easy = EASY_TYPES.has(input.sessionType);
  if (input.duration <= 2) return easy ? 30 : 40;
  if (input.duration <= 3) return easy ? 50 : 60;
  return easy ? 70 : 90;
}

export function capsulesPerHour(metrics: SweatMetrics): number {
  const sodiumLow = metrics.sweatRate * metrics.sodiumConcentration * 0.75;
  return Math.max(0, Math.ceil(sodiumLow / BRUT_CAPSULE_SODIUM_MG));
}

function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function capsuleTimes(
  durationHours: number,
  sodiumHourly: number,
): number[] {
  if (durationHours < 1) return [];
  if (durationHours < 1.5) return [1.0];
  if (durationHours < 2) return [0.75, 1.5];

  const baseline: number[] = [];
  for (let t = 0.75; t <= durationHours + 1e-9; t += 0.75) {
    baseline.push(Math.round(t * 100) / 100);
  }

  if (durationHours < 3) return baseline;

  const sodiumTotal = Math.max(0, Math.round(sodiumHourly * durationHours));
  const target = Math.min(sodiumTotal, baseline.length * 2);
  if (target <= baseline.length) return baseline;

  const span = durationHours - 0.75;
  const times: number[] = [];
  for (let i = 0; i < target; i += 1) {
    const t =
      target === 1 ? 0.75 + span / 2 : 0.75 + (i * span) / (target - 1);
    times.push(Math.round(t * 100) / 100);
  }
  return times;
}

export function buildSchedule(
  input: SessionInput,
  metrics: SweatMetrics,
): ScheduleRow[] {
  if (input.duration <= 0) return [];

  const intervals = Math.max(1, Math.round(input.duration * 2));
  const carbsH = carbsPerHour(input);

  const mlPerInterval =
    Math.round((metrics.sweatRate * 0.8 * 0.5 * 1000) / 50) * 50;
  const carbsPerInterval =
    carbsH > 0 ? Math.max(5, Math.round((carbsH * 0.5) / 5) * 5) : 0;

  const capsPerRow = new Array<number>(intervals).fill(0);
  const sodiumHourly = capsulesPerHour(metrics);
  const times = capsuleTimes(input.duration, sodiumHourly);
  for (const t of times) {
    const idx = Math.min(intervals - 1, Math.max(0, Math.ceil(t * 2) - 1));
    capsPerRow[idx] = (capsPerRow[idx] ?? 0) + 1;
  }

  const rows: ScheduleRow[] = [];
  for (let i = 1; i <= intervals; i += 1) {
    rows.push({
      time: formatTime(i * 0.5),
      waterMl: mlPerInterval,
      carbsG: carbsPerInterval,
      capsules: capsPerRow[i - 1] ?? 0,
    });
  }
  return rows;
}

export function preSession(
  lastMeal: LastMeal,
  timeOfDay: TimeOfDay,
  t: CalcTranslator = englishCalc,
): PreSessionPlan {
  let food: string;
  switch (lastMeal) {
    case '<1h':
      food = t('pre_session.food_under_1h');
      break;
    case '1-2h':
      food = t('pre_session.food_1_2h');
      break;
    case '2-4h':
      food = t('pre_session.food_2_4h');
      break;
    case '>4h':
    default:
      food =
        timeOfDay === 'early-morning'
          ? t('pre_session.food_over_4h_early_morning')
          : t('pre_session.food_over_4h_default');
      break;
  }
  return {
    food,
    hydration: t('pre_session.hydration'),
  };
}

export function postSession(
  input: SessionInput,
  metrics: SweatMetrics,
  t: CalcTranslator = englishCalc,
): PostSessionPlan {
  const carbsLow = Math.round(input.weight * 0.8);
  const carbsHigh = Math.round(input.weight * 1.2);

  const replaceMl = Math.round(metrics.totalLoss * 1500);
  const waterMl =
    replaceMl >= 750
      ? t('post_session.water_replacement', { ml: replaceMl })
      : t('post_session.water_minimum');

  return {
    proteinGrams: t('post_session.protein_grams'),
    carbsGrams: t('post_session.carbs_grams', {
      low: carbsLow,
      high: carbsHigh,
    }),
    waterMl,
    capsules: 1,
    exampleMeal: t('post_session.example_meal'),
  };
}
