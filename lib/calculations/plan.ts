import type { PaceInfo, SessionInput, SessionPlan } from './types';
import { calculateReplacementLevel, calculateSweat } from './sweat';
import {
  buildSchedule,
  carbsPerHour,
  postSession,
  preSession,
} from './nutrition';
import { buildSessionStructure } from './session-structure';

function calculatePace(input: SessionInput): PaceInfo | null {
  if (!input.distance || input.distance <= 0 || input.duration <= 0) {
    return null;
  }
  if (input.sport === 'running') {
    const minPerKm = (input.duration * 60) / input.distance;
    const whole = Math.floor(minPerKm);
    const sec = Math.round((minPerKm - whole) * 60);
    return {
      label: 'Estimated pace',
      value: `${whole}:${String(sec).padStart(2, '0')} / km`,
    };
  }
  const speed = input.distance / input.duration;
  return { label: 'Average speed', value: `${speed.toFixed(1)} km/h` };
}

// Compose every sub-calculation into a single deterministic plan.
// Pure function — same input always produces the same plan.
export function buildPlan(input: SessionInput): SessionPlan {
  const metrics = calculateSweat(input);
  const replacement = calculateReplacementLevel(input, metrics);

  const carbsH = carbsPerHour(input);
  const schedule = buildSchedule(input, metrics);

  // Totals computed from the schedule itself so the visible plan and the
  // headline numbers always agree.
  const totals = schedule.reduce(
    (acc, row) => ({
      capsules: acc.capsules + row.capsules,
      waterMl: acc.waterMl + row.waterMl,
      carbsG: acc.carbsG + row.carbsG,
    }),
    { capsules: 0, waterMl: 0, carbsG: 0 }
  );

  // Capsule rate displayed in the header is derived from the actual
  // schedule so it always matches the per-row counts.
  const capsH =
    input.duration > 0
      ? Math.round(totals.capsules / input.duration)
      : 0;

  return {
    sweatRate: metrics.sweatRate,
    totalLoss: metrics.totalLoss,
    dehydrationPct: metrics.dehydrationPct,
    sodiumConcentration: metrics.sodiumConcentration,
    sodiumTotalMg: metrics.sodiumTotalMg,
    pace: calculatePace(input),

    replacementLevel: replacement.level,
    replacementMessage: replacement.message,

    structure: buildSessionStructure(input),
    preSession: preSession(input.lastMeal, input.timeOfDay),
    postSession: postSession(input, metrics),

    carbsPerHour: carbsH,
    capsulesPerHour: capsH,
    schedule,

    totals,
  };
}

export const DEFAULT_INPUT: SessionInput = {
  sport: 'running',
  surface: 'track-road',
  sessionType: 'easy-run',
  duration: 1,
  distance: null,
  elevation: 0,
  temperature: 22,
  timeOfDay: 'morning',
  lastMeal: '2-4h',
  weight: 70,
  humidity: 50,
  heatAcclimated: false,
  sodiumDiet: 'normal',
  knownSweatRate: null,
};
