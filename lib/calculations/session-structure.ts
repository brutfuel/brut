import { englishCalc, type CalcTranslator } from './translator';
import type {
  SessionInput,
  SessionStructure,
  SessionType,
} from './types';

type StructureBuilder = (
  totalMinutes: number,
  t: CalcTranslator,
) => SessionStructure;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function block(minutes: number, description: string) {
  return { minutes, description };
}

// Approximate rep counts for repeat-based main sets so the text stays plausible.
function approxRepCount(mainMinutes: number, perRepMin: number): number {
  return Math.max(3, Math.round(mainMinutes / perRepMin));
}

const BUILDERS: Record<SessionType, StructureBuilder> = {
  // ---------- running ----------
  'easy-run': (d, t) => {
    const wu = 10;
    const cd = 10;
    const main = Math.max(10, d - wu - cd);
    return {
      warmup: block(wu, t('structure.easy-run.warmup')),
      mainSet: block(main, t('structure.easy-run.main')),
      cooldown: block(cd, t('structure.easy-run.cooldown')),
    };
  },
  'long-run': (d, t) => {
    const wu = 10;
    const cd = 10;
    const main = Math.max(20, d - wu - cd);
    return {
      warmup: block(wu, t('structure.long-run.warmup')),
      mainSet: block(main, t('structure.long-run.main')),
      cooldown: block(cd, t('structure.long-run.cooldown')),
    };
  },
  tempo: (d, t) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(15, d - wu - cd);
    return {
      warmup: block(wu, t('structure.tempo.warmup')),
      mainSet: block(main, t('structure.tempo.main', { minutes: main })),
      cooldown: block(cd, t('structure.tempo.cooldown')),
    };
  },
  intervals: (d, t) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(15, d - wu - cd);
    const reps = approxRepCount(main, 5);
    return {
      warmup: block(wu, t('structure.intervals.warmup')),
      mainSet: block(main, t('structure.intervals.main', { reps })),
      cooldown: block(cd, t('structure.intervals.cooldown')),
    };
  },
  'hill-repeats': (d, t) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(15, d - wu - cd);
    const reps = approxRepCount(main, 4);
    return {
      warmup: block(wu, t('structure.hill-repeats.warmup')),
      mainSet: block(main, t('structure.hill-repeats.main', { reps })),
      cooldown: block(cd, t('structure.hill-repeats.cooldown')),
    };
  },
  recovery: (d, t) => {
    const wu = 5;
    const cd = 5;
    const main = Math.max(10, d - wu - cd);
    return {
      warmup: block(wu, t('structure.recovery.warmup')),
      mainSet: block(main, t('structure.recovery.main')),
      cooldown: block(cd, t('structure.recovery.cooldown')),
    };
  },
  'race-simulation': (d, t) => {
    const wu = 20;
    const cd = 15;
    const main = Math.max(20, d - wu - cd);
    return {
      warmup: block(wu, t('structure.race-simulation.warmup')),
      mainSet: block(
        main,
        t('structure.race-simulation.main', { minutes: main }),
      ),
      cooldown: block(cd, t('structure.race-simulation.cooldown')),
    };
  },

  // ---------- cycling ----------
  endurance: (d, t) => {
    const wu = 10;
    const cd = 10;
    const main = Math.max(20, d - wu - cd);
    return {
      warmup: block(wu, t('structure.endurance.warmup')),
      mainSet: block(main, t('structure.endurance.main')),
      cooldown: block(cd, t('structure.endurance.cooldown')),
    };
  },
  'long-ride': (d, t) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(30, d - wu - cd);
    return {
      warmup: block(wu, t('structure.long-ride.warmup')),
      mainSet: block(main, t('structure.long-ride.main')),
      cooldown: block(cd, t('structure.long-ride.cooldown')),
    };
  },
  'sweet-spot': (d, t) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(15, d - wu - cd);
    const reps = clamp(approxRepCount(main, 20), 2, 4);
    return {
      warmup: block(wu, t('structure.sweet-spot.warmup')),
      mainSet: block(main, t('structure.sweet-spot.main', { reps })),
      cooldown: block(cd, t('structure.sweet-spot.cooldown')),
    };
  },
  threshold: (d, t) => {
    const wu = 20;
    const cd = 15;
    const main = Math.max(15, d - wu - cd);
    const reps = clamp(approxRepCount(main, 18), 2, 4);
    return {
      warmup: block(wu, t('structure.threshold.warmup')),
      mainSet: block(main, t('structure.threshold.main', { reps })),
      cooldown: block(cd, t('structure.threshold.cooldown')),
    };
  },
  'hill-repeats-bike': (d, t) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(15, d - wu - cd);
    const reps = approxRepCount(main, 7);
    return {
      warmup: block(wu, t('structure.hill-repeats-bike.warmup')),
      mainSet: block(main, t('structure.hill-repeats-bike.main', { reps })),
      cooldown: block(cd, t('structure.hill-repeats-bike.cooldown')),
    };
  },
  'recovery-bike': (d, t) => {
    const wu = 5;
    const cd = 5;
    const main = Math.max(10, d - wu - cd);
    return {
      warmup: block(wu, t('structure.recovery-bike.warmup')),
      mainSet: block(main, t('structure.recovery-bike.main')),
      cooldown: block(cd, t('structure.recovery-bike.cooldown')),
    };
  },
  'race-simulation-bike': (d, t) => {
    const wu = 20;
    const cd = 10;
    const main = Math.max(20, d - wu - cd);
    return {
      warmup: block(wu, t('structure.race-simulation-bike.warmup')),
      mainSet: block(
        main,
        t('structure.race-simulation-bike.main', { minutes: main }),
      ),
      cooldown: block(cd, t('structure.race-simulation-bike.cooldown')),
    };
  },

  // ---------- triathlon ----------
  swim: (d, t) => {
    const wu = 10;
    const cd = 5;
    const main = Math.max(15, d - wu - cd);
    return {
      warmup: block(wu, t('structure.swim.warmup')),
      mainSet: block(main, t('structure.swim.main', { minutes: main })),
      cooldown: block(cd, t('structure.swim.cooldown')),
    };
  },
  brick: (d, t) => {
    const wu = 5;
    const ride = Math.max(20, Math.round((d - wu - 5) * 0.65));
    const run = Math.max(15, d - wu - 5 - ride);
    return {
      warmup: block(wu, t('structure.brick.warmup')),
      mainSet: block(
        ride + run,
        t('structure.brick.main', { ride, run }),
      ),
      cooldown: block(5, t('structure.brick.cooldown')),
    };
  },
  'long-combined': (d, t) => {
    const wu = 10;
    const cd = 10;
    const main = Math.max(30, d - wu - cd);
    return {
      warmup: block(wu, t('structure.long-combined.warmup')),
      mainSet: block(main, t('structure.long-combined.main')),
      cooldown: block(cd, t('structure.long-combined.cooldown')),
    };
  },
  'recovery-tri': (d, t) => {
    const wu = 5;
    const cd = 5;
    const main = Math.max(10, d - wu - cd);
    return {
      warmup: block(wu, t('structure.recovery-tri.warmup')),
      mainSet: block(main, t('structure.recovery-tri.main')),
      cooldown: block(cd, t('structure.recovery-tri.cooldown')),
    };
  },
};

export function buildSessionStructure(
  input: SessionInput,
  t: CalcTranslator = englishCalc,
): SessionStructure {
  const totalMinutes = Math.round(input.duration * 60);
  return BUILDERS[input.sessionType](totalMinutes, t);
}

// Session-type catalogue per sport, exposed for the form UI.
export const SESSION_TYPES_BY_SPORT: Record<
  SessionInput['sport'],
  Array<{ value: SessionType; label: string }>
> = {
  running: [
    { value: 'easy-run', label: 'Easy run' },
    { value: 'long-run', label: 'Long run' },
    { value: 'tempo', label: 'Tempo' },
    { value: 'intervals', label: 'Intervals' },
    { value: 'hill-repeats', label: 'Hill repeats' },
    { value: 'recovery', label: 'Recovery' },
    { value: 'race-simulation', label: 'Race simulation' },
  ],
  cycling: [
    { value: 'endurance', label: 'Endurance' },
    { value: 'long-ride', label: 'Long ride' },
    { value: 'sweet-spot', label: 'Sweet spot' },
    { value: 'threshold', label: 'Threshold' },
    { value: 'hill-repeats-bike', label: 'Hill repeats' },
    { value: 'recovery-bike', label: 'Recovery' },
    { value: 'race-simulation-bike', label: 'Race simulation' },
  ],
  triathlon: [
    { value: 'swim', label: 'Swim' },
    { value: 'brick', label: 'Brick (bike + run)' },
    { value: 'long-combined', label: 'Long combined' },
    { value: 'recovery-tri', label: 'Recovery' },
  ],
};
