import { englishCalc, type CalcTranslator } from './translator';
import type { PaceInfo, SessionInput, SessionPlan } from './types';
import { calculateReplacementLevel, calculateSweat } from './sweat';
import {
  buildSchedule,
  carbsPerHour,
  postSession,
  preSession,
} from './nutrition';
import { buildSessionStructure } from './session-structure';

function calculatePace(input: SessionInput, t: CalcTranslator): PaceInfo | null {
  if (!input.distance || input.distance <= 0 || input.duration <= 0) {
    return null;
  }
  if (input.sport === 'running') {
    const minPerKm = (input.duration * 60) / input.distance;
    const whole = Math.floor(minPerKm);
    const sec = Math.round((minPerKm - whole) * 60);
    return {
      label: t('pace_estimated'),
      value: `${whole}:${String(sec).padStart(2, '0')} / km`,
    };
  }
  const speed = input.distance / input.duration;
  return {
    label: t('pace_average'),
    value: `${speed.toFixed(1)} km/h`,
  };
}

// Compose every sub-calculation into a single deterministic plan.
// The translator argument is optional — when omitted the generators
// fall back to the English copy bundled in `locales/en.json`.
export function buildPlan(
  input: SessionInput,
  t: CalcTranslator = englishCalc,
): SessionPlan {
  const metrics = calculateSweat(input);
  const replacement = calculateReplacementLevel(input, metrics, t);

  const carbsH = carbsPerHour(input);
  const schedule = buildSchedule(input, metrics);

  const totals = schedule.reduce(
    (acc, row) => ({
      capsules: acc.capsules + row.capsules,
      waterMl: acc.waterMl + row.waterMl,
      carbsG: acc.carbsG + row.carbsG,
    }),
    { capsules: 0, waterMl: 0, carbsG: 0 },
  );

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
    pace: calculatePace(input, t),

    replacementLevel: replacement.level,
    replacementMessage: replacement.message,

    structure: buildSessionStructure(input, t),
    preSession: preSession(input.lastMeal, input.timeOfDay, t),
    postSession: postSession(input, metrics, t),

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
