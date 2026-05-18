import type {
  SessionInput,
  SessionStructure,
  SessionType,
} from './types';

// Each builder receives the full session duration in minutes and returns
// a three-block plan (warm-up, main set, cool-down).
type StructureBuilder = (totalMinutes: number) => SessionStructure;

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
  'easy-run': (d) => {
    const wu = 10;
    const cd = 10;
    const main = Math.max(10, d - wu - cd);
    return {
      warmup: block(wu, 'Very easy jog in Z1, build into low Z2.'),
      mainSet: block(
        main,
        'Steady aerobic running in Z2 — conversational pace, smooth breathing.'
      ),
      cooldown: block(cd, 'Easy jog, then a few minutes of mobility work.'),
    };
  },
  'long-run': (d) => {
    const wu = 10;
    const cd = 10;
    const main = Math.max(20, d - wu - cd);
    return {
      warmup: block(wu, 'Easy build from walking to low Z2 jogging.'),
      mainSet: block(
        main,
        'Steady aerobic effort in mid Z2. Hold form, fuel and hydrate from the start.'
      ),
      cooldown: block(cd, 'Easy jog and walk to bring HR down.'),
    };
  },
  tempo: (d) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(15, d - wu - cd);
    return {
      warmup: block(wu, 'Easy jog Z1 to Z2, finish with 4 × 20 s strides.'),
      mainSet: block(
        main,
        `${main} min continuous tempo at Z3 to low Z4 — comfortably hard, controlled breathing.`
      ),
      cooldown: block(cd, 'Easy jog Z1 then walk.'),
    };
  },
  intervals: (d) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(15, d - wu - cd);
    const reps = approxRepCount(main, 5);
    return {
      warmup: block(wu, 'Z1 to Z2 jog, then 4 × 20 s strides at goal pace.'),
      mainSet: block(
        main,
        `${reps} × 800 m at Z4 to Z5 with 2–3 min easy jog recovery between reps.`
      ),
      cooldown: block(cd, 'Easy jog Z1 then walk.'),
    };
  },
  'hill-repeats': (d) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(15, d - wu - cd);
    const reps = approxRepCount(main, 4);
    return {
      warmup: block(wu, 'Easy jog Z2 on flat ground, finish near the climb.'),
      mainSet: block(
        main,
        `${reps} × 60–90 s uphill at Z4 to Z5, strong arm drive. Jog down for recovery.`
      ),
      cooldown: block(cd, 'Easy jog on flat ground, walk to finish.'),
    };
  },
  recovery: (d) => {
    const wu = 5;
    const cd = 5;
    const main = Math.max(10, d - wu - cd);
    return {
      warmup: block(wu, 'Walk into a very gentle jog.'),
      mainSet: block(main, 'Easy Z1 jogging — short and conversational.'),
      cooldown: block(cd, 'Walk, mobility work, foam roll.'),
    };
  },
  'race-simulation': (d) => {
    const wu = 20;
    const cd = 15;
    const main = Math.max(20, d - wu - cd);
    return {
      warmup: block(wu, 'Z1 to Z2 jog with 6 × 30 s race-pace strides.'),
      mainSet: block(
        main,
        `${main} min continuous at goal race pace. Rehearse fuel and hydration timings.`
      ),
      cooldown: block(cd, 'Easy jog and walk.'),
    };
  },

  // ---------- cycling ----------
  endurance: (d) => {
    const wu = 10;
    const cd = 10;
    const main = Math.max(20, d - wu - cd);
    return {
      warmup: block(wu, 'Spin in Z1 to Z2, light cadence build.'),
      mainSet: block(main, 'Steady Z2 — cadence 85–95 rpm, controlled effort.'),
      cooldown: block(cd, 'Easy spin Z1.'),
    };
  },
  'long-ride': (d) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(30, d - wu - cd);
    return {
      warmup: block(wu, 'Z1 to Z2 spin, smooth into ride pace.'),
      mainSet: block(
        main,
        'Mid Z2 endurance. Fuel and hydrate from the first hour.'
      ),
      cooldown: block(cd, 'Easy spin Z1.'),
    };
  },
  'sweet-spot': (d) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(15, d - wu - cd);
    const reps = clamp(approxRepCount(main, 20), 2, 4);
    return {
      warmup: block(wu, 'Z1 to Z2 spin, 2 × 1 min openers near threshold.'),
      mainSet: block(
        main,
        `${reps} × 20 min at 88–94% FTP with 5 min Z1 recovery between efforts.`
      ),
      cooldown: block(cd, 'Easy spin Z1.'),
    };
  },
  threshold: (d) => {
    const wu = 20;
    const cd = 15;
    const main = Math.max(15, d - wu - cd);
    const reps = clamp(approxRepCount(main, 18), 2, 4);
    return {
      warmup: block(wu, 'Z1 to Z2 spin, 3 × 1 min openers approaching FTP.'),
      mainSet: block(
        main,
        `${reps} × 15 min at 95–105% FTP with 5 min Z1 recovery between efforts.`
      ),
      cooldown: block(cd, 'Easy spin Z1.'),
    };
  },
  'hill-repeats-bike': (d) => {
    const wu = 15;
    const cd = 10;
    const main = Math.max(15, d - wu - cd);
    const reps = approxRepCount(main, 7);
    return {
      warmup: block(wu, 'Z1 to Z2 spin to the climb base.'),
      mainSet: block(
        main,
        `${reps} × 5 min seated climb at threshold, descend or spin easy for recovery.`
      ),
      cooldown: block(cd, 'Easy spin Z1 back home.'),
    };
  },
  'recovery-bike': (d) => {
    const wu = 5;
    const cd = 5;
    const main = Math.max(10, d - wu - cd);
    return {
      warmup: block(wu, 'Easy spin Z1, high cadence.'),
      mainSet: block(main, 'Z1 only — flat terrain, light gears, 90+ rpm.'),
      cooldown: block(cd, 'Easy spin Z1, off-bike mobility.'),
    };
  },
  'race-simulation-bike': (d) => {
    const wu = 20;
    const cd = 10;
    const main = Math.max(20, d - wu - cd);
    return {
      warmup: block(wu, 'Z1 to Z2 spin with 3 × 1 min openers at goal effort.'),
      mainSet: block(
        main,
        `${main} min at goal race power. Rehearse fuelling and bottle hand-offs.`
      ),
      cooldown: block(cd, 'Easy spin Z1.'),
    };
  },

  // ---------- triathlon ----------
  swim: (d) => {
    const wu = 10;
    const cd = 5;
    const main = Math.max(15, d - wu - cd);
    return {
      warmup: block(wu, '400 m easy mixed strokes, 4 × 50 m build.'),
      mainSet: block(
        main,
        `${main} min main set — pull buoy or open water, sustained moderate effort with form focus.`
      ),
      cooldown: block(cd, '200 m easy choice — stretch shoulders.'),
    };
  },
  brick: (d) => {
    const wu = 5;
    const ride = Math.max(20, Math.round((d - wu - 5) * 0.65));
    const run = Math.max(15, d - wu - 5 - ride);
    return {
      warmup: block(wu, 'Easy spin Z1 on the trainer or flat road.'),
      mainSet: block(
        ride + run,
        `${ride} min bike at race effort, transition under 90 s, then ${run} min run at goal pace.`
      ),
      cooldown: block(5, 'Easy walk and mobility.'),
    };
  },
  'long-combined': (d) => {
    const wu = 10;
    const cd = 10;
    const main = Math.max(30, d - wu - cd);
    return {
      warmup: block(wu, 'Easy aerobic warm-up in chosen discipline.'),
      mainSet: block(
        main,
        'Continuous Z2 across two disciplines — fuel and hydrate from the first hour.'
      ),
      cooldown: block(cd, 'Easy spin or jog and mobility.'),
    };
  },
  'recovery-tri': (d) => {
    const wu = 5;
    const cd = 5;
    const main = Math.max(10, d - wu - cd);
    return {
      warmup: block(wu, 'Walk or very easy spin.'),
      mainSet: block(main, 'Light Z1 movement — pick the discipline that feels best.'),
      cooldown: block(cd, 'Mobility, foam roll, stretch.'),
    };
  },
};

export function buildSessionStructure(input: SessionInput): SessionStructure {
  const totalMinutes = Math.round(input.duration * 60);
  return BUILDERS[input.sessionType](totalMinutes);
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
