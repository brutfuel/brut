import { englishCalc, type CalcTranslator } from './translator';
import type {
  SessionInput,
  SessionType,
  ReplacementLevel,
} from './types';

// Sport-specific baseline sweat rate per kg of body weight (L/h/kg).
// Baker LB, 2017 — within typical inter-individual ranges.
const SPORT_BASE: Record<SessionInput['sport'], number> = {
  running: 0.013,
  cycling: 0.011,
  triathlon: 0.0125,
};

// Effort multiplier per session type.
const INTENSITY: Record<SessionType, number> = {
  // running
  'easy-run': 0.7,
  'long-run': 0.8,
  tempo: 1.0,
  intervals: 1.3,
  'hill-repeats': 1.3,
  recovery: 0.7,
  'race-simulation': 1.25,
  // cycling
  endurance: 0.7,
  'long-ride': 0.8,
  'sweet-spot': 1.0,
  threshold: 1.2,
  'hill-repeats-bike': 1.3,
  'recovery-bike': 0.7,
  'race-simulation-bike': 1.25,
  // triathlon
  swim: 0.9,
  brick: 1.1,
  'long-combined': 0.8,
  'recovery-tri': 0.7,
};

function surfaceModifier(input: SessionInput): number {
  if (input.sport === 'running') return input.surface === 'trail' ? 1.1 : 1.0;
  if (input.sport === 'cycling') {
    if (input.surface === 'gravel') return 1.08;
    if (input.surface === 'mtb') return 1.15;
    return 1.0;
  }
  return 1.0;
}

function temperatureFactor(t: number): number {
  if (t < 10) return 0.7 + 0.025 * t;
  if (t <= 25) return 0.95 + 0.02 * (t - 10);
  if (t <= 35) return 1.25 + 0.06 * (t - 25);
  return 1.85 + 0.1 * (t - 35);
}

function humidityFactor(t: number, humidity: number): number {
  let f: number;
  if (t > 25) {
    f = 1 + 0.006 * (humidity - 50);
    if (humidity > 75 && t > 28) f *= 0.95;
  } else {
    f = 1 + 0.002 * (humidity - 50);
  }
  return f;
}

function elevationFactor(input: SessionInput): number {
  if (input.elevation <= 0 || input.duration <= 0) return 1;
  const ePerHour = input.elevation / input.duration;
  const coef = input.sport === 'cycling' ? 0.05 : 0.1;
  return Math.min(1.5, 1 + coef * (ePerHour / 500));
}

function acclimationFactor(acclimated: boolean): number {
  return acclimated ? 0.95 : 1.05;
}

export interface SweatMetrics {
  sweatRate: number; // L/h
  totalLoss: number; // L
  dehydrationPct: number; // % of body weight
  sodiumConcentration: number; // mg/L
  sodiumTotalMg: number;
}

export function calculateSweat(input: SessionInput): SweatMetrics {
  const raw =
    input.knownSweatRate !== null && input.knownSweatRate > 0
      ? input.knownSweatRate
      : SPORT_BASE[input.sport] *
        input.weight *
        surfaceModifier(input) *
        INTENSITY[input.sessionType] *
        temperatureFactor(input.temperature) *
        humidityFactor(input.temperature, input.humidity) *
        elevationFactor(input) *
        acclimationFactor(input.heatAcclimated);

  const sweatRate = Math.min(3.5, Math.max(0.3, raw));
  const totalLoss = sweatRate * input.duration;
  const dehydrationPct = (totalLoss / input.weight) * 100;

  const sodiumBase = input.heatAcclimated ? 850 : 1150;
  const dietMod = { low: 0.85, normal: 1.0, high: 1.15 }[input.sodiumDiet];
  const sodiumConcentration = sodiumBase * dietMod;
  const sodiumTotalMg = sweatRate * sodiumConcentration * input.duration;

  return {
    sweatRate,
    totalLoss,
    dehydrationPct,
    sodiumConcentration,
    sodiumTotalMg,
  };
}

// Discrete bucketing of session-wide replacement need.
export function calculateReplacementLevel(
  input: SessionInput,
  metrics: SweatMetrics,
  t: CalcTranslator = englishCalc,
): { level: ReplacementLevel; message: string; score: number } {
  let score = 0;

  if (input.duration < 1) score += 0;
  else if (input.duration < 1.5) score += 1;
  else if (input.duration < 3) score += 2;
  else score += 3;

  if (metrics.dehydrationPct < 1) score += 0;
  else if (metrics.dehydrationPct < 2) score += 1;
  else if (metrics.dehydrationPct < 4) score += 2;
  else score += 3;

  if (metrics.sodiumTotalMg < 500) score += 0;
  else if (metrics.sodiumTotalMg < 1000) score += 1;
  else if (metrics.sodiumTotalMg < 2000) score += 2;
  else score += 3;

  if (input.temperature > 30) score += 2;
  else if (input.temperature > 25) score += 1;

  const level: ReplacementLevel =
    score <= 2
      ? 'not-necessary'
      : score <= 5
        ? 'optional'
        : score <= 8
          ? 'recommended'
          : 'essential';

  return {
    score,
    level,
    message: t(`replacement_messages.${level}`),
  };
}
