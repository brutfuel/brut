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

// Hourly capsule target derived from sodium loss minus ~25% lower bound.
export function capsulesPerHour(metrics: SweatMetrics): number {
  const sodiumLow = metrics.sweatRate * metrics.sodiumConcentration * 0.75;
  return Math.max(0, Math.ceil(sodiumLow / BRUT_CAPSULE_SODIUM_MG));
}

function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

// Build a 30-minute schedule of water / carbs / capsules to take.
// Capsules are distributed evenly using a cumulative rounding scheme.
export function buildSchedule(
  input: SessionInput,
  metrics: SweatMetrics
): ScheduleRow[] {
  if (input.duration <= 0) return [];

  const intervals = Math.max(1, Math.round(input.duration * 2));
  const carbsH = carbsPerHour(input);
  const capsH = capsulesPerHour(metrics);

  // Replace ~80% of sweat per hour; round to nearest 50 ml per 30-min row.
  const mlPerInterval =
    Math.round((metrics.sweatRate * 0.8 * 0.5 * 1000) / 50) * 50;
  const carbsPerInterval =
    carbsH > 0 ? Math.max(5, Math.round((carbsH * 0.5) / 5) * 5) : 0;

  const totalCaps = Math.max(0, Math.round(capsH * input.duration));
  const rows: ScheduleRow[] = [];
  let cumulative = 0;

  for (let i = 1; i <= intervals; i++) {
    const t = i * 0.5;
    const target = Math.round((totalCaps * i) / intervals);
    const caps = Math.max(0, target - cumulative);
    cumulative = target;

    rows.push({
      time: formatTime(t),
      waterMl: mlPerInterval,
      carbsG: carbsPerInterval,
      capsules: caps,
    });
  }
  return rows;
}

export function preSession(
  lastMeal: LastMeal,
  timeOfDay: TimeOfDay
): PreSessionPlan {
  let food: string;
  switch (lastMeal) {
    case '<1h':
      food =
        'Skip a heavy pre-feed. 30 g of fast carbs (banana or gel) with 200 ml of water is enough.';
      break;
    case '1-2h':
      food =
        'Light snack: a banana with a handful of dates, or a slice of toast with honey.';
      break;
    case '2-4h':
      food =
        'Carb-rich meal 2–3 h before: oatmeal with banana and honey, or pasta with a light sauce.';
      break;
    case '>4h':
    default:
      food =
        timeOfDay === 'early-morning'
          ? 'Fasted or early start — eat 30–60 min before with 30–50 g of fast carbs (toast, banana, oat porridge).'
          : 'Substantial meal needed. Aim for 60–90 g of carbs 3 h out, or 30–50 g of fast carbs 30–60 min before.';
      break;
  }
  return {
    food,
    hydration:
      'Add 300–500 ml of water with a pinch of salt 60 min before the session.',
  };
}

export function postSession(
  input: SessionInput,
  metrics: SweatMetrics
): PostSessionPlan {
  const carbsLow = Math.round(input.weight * 0.8);
  const carbsHigh = Math.round(input.weight * 1.2);

  // Replace 150% of fluid lost, but always recommend 500–750 ml at minimum.
  const replaceMl = Math.round(metrics.totalLoss * 1500);
  const waterMl =
    replaceMl >= 750
      ? `${replaceMl} ml (150% of fluid lost) within 1 h`
      : '500–750 ml within the first hour';

  return {
    proteinGrams: '20–30 g',
    carbsGrams: `${carbsLow}–${carbsHigh} g (0.8–1.2 g per kg)`,
    waterMl,
    capsules: 1,
    exampleMeal:
      'Smoothie: 200 ml semi-skimmed milk, 1 banana, 30 g whey, 50 g oats, 1 tsp honey, pinch of salt.',
  };
}
