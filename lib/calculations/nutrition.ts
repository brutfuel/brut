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

// Hourly sodium-based capsule rate. Kept as the baseline used by the
// schedule once a session is long enough that loss outpaces the
// duration-based protocol below.
export function capsulesPerHour(metrics: SweatMetrics): number {
  const sodiumLow = metrics.sweatRate * metrics.sodiumConcentration * 0.75;
  return Math.max(0, Math.ceil(sodiumLow / BRUT_CAPSULE_SODIUM_MG));
}

function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * Intake times (in hours from start) following the BRUT protocol:
 *   - < 1 h          → none
 *   - 1 – 1.5 h      → 1 at 1:00
 *   - 1.5 – 2 h      → 1 at 0:45, 1 at 1:30
 *   - ≥ 2 h          → one every 45 min from 0:45 onward
 *   - ≥ 3 h          → if the sodium-based total exceeds the 45-min count,
 *                      use the larger total, spread evenly from 0:45.
 */
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

  // ≥ 3 h: scale with sodium loss but never more than twice the every-45-min
  // baseline. Keeps the count realistic when sweat rates are high without a
  // jarring discontinuity at the 3 h boundary.
  const sodiumTotal = Math.max(0, Math.round(sodiumHourly * durationHours));
  const target = Math.min(sodiumTotal, baseline.length * 2);
  if (target <= baseline.length) return baseline;

  // Spread `target` capsules evenly between 0:45 and the session end.
  const span = durationHours - 0.75;
  const times: number[] = [];
  for (let i = 0; i < target; i += 1) {
    const t =
      target === 1 ? 0.75 + span / 2 : 0.75 + (i * span) / (target - 1);
    times.push(Math.round(t * 100) / 100);
  }
  return times;
}

/**
 * Build a 30-minute schedule of water / carbs / capsules to take.
 * Water and carbs are constant per row; capsule slots are derived from
 * `capsuleTimes` and snapped to the row that ends just after each time.
 */
export function buildSchedule(
  input: SessionInput,
  metrics: SweatMetrics,
): ScheduleRow[] {
  if (input.duration <= 0) return [];

  const intervals = Math.max(1, Math.round(input.duration * 2));
  const carbsH = carbsPerHour(input);

  // Replace ~80% of sweat per hour; round to nearest 50 ml per 30-min row.
  const mlPerInterval =
    Math.round((metrics.sweatRate * 0.8 * 0.5 * 1000) / 50) * 50;
  const carbsPerInterval =
    carbsH > 0 ? Math.max(5, Math.round((carbsH * 0.5) / 5) * 5) : 0;

  // Distribute capsules into 30-minute slots. A capsule taken at e.g.
  // 0:45 lives in the 1:00 row (intake during the previous 30 min).
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
