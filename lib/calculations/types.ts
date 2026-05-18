// Domain types shared by all BRUT TRAIN calculation modules.

export type Sport = 'running' | 'cycling' | 'triathlon';

export type RunningSurface = 'track-road' | 'trail';
export type CyclingSurface = 'road' | 'gravel' | 'mtb';
export type Surface = RunningSurface | CyclingSurface | null;

export type SessionType =
  // running
  | 'easy-run'
  | 'long-run'
  | 'tempo'
  | 'intervals'
  | 'hill-repeats'
  | 'recovery'
  | 'race-simulation'
  // cycling
  | 'endurance'
  | 'long-ride'
  | 'sweet-spot'
  | 'threshold'
  | 'hill-repeats-bike'
  | 'recovery-bike'
  | 'race-simulation-bike'
  // triathlon
  | 'swim'
  | 'brick'
  | 'long-combined'
  | 'recovery-tri';

export type TimeOfDay =
  | 'early-morning'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night';

export type LastMeal = '<1h' | '1-2h' | '2-4h' | '>4h';
export type SodiumDiet = 'low' | 'normal' | 'high';

export interface SessionInput {
  sport: Sport;
  surface: Surface;
  sessionType: SessionType;
  duration: number; // hours
  distance: number | null; // km, optional
  elevation: number; // metres, default 0
  temperature: number; // °C
  timeOfDay: TimeOfDay;
  lastMeal: LastMeal;
  weight: number; // kg
  humidity: number; // %
  heatAcclimated: boolean;
  sodiumDiet: SodiumDiet;
}

export type ReplacementLevel =
  | 'not-necessary'
  | 'optional'
  | 'recommended'
  | 'essential';

export interface SessionStructureBlock {
  minutes: number;
  description: string;
}

export interface SessionStructure {
  warmup: SessionStructureBlock;
  mainSet: SessionStructureBlock;
  cooldown: SessionStructureBlock;
}

export interface PreSessionPlan {
  food: string;
  hydration: string;
}

export interface PostSessionPlan {
  proteinGrams: string;
  carbsGrams: string;
  waterMl: string;
  capsules: number;
  exampleMeal: string;
}

export interface ScheduleRow {
  time: string; // "0:30", "1:00"
  waterMl: number;
  carbsG: number;
  capsules: number;
}

export interface PaceInfo {
  label: string;
  value: string;
}

export interface SessionPlan {
  // metrics
  sweatRate: number; // L/h, clamped
  totalLoss: number; // L
  dehydrationPct: number;
  sodiumConcentration: number; // mg/L
  sodiumTotalMg: number;
  pace: PaceInfo | null;

  // recommendation
  replacementLevel: ReplacementLevel;
  replacementMessage: string;

  // sections
  structure: SessionStructure;
  preSession: PreSessionPlan;
  postSession: PostSessionPlan;

  // during-session
  carbsPerHour: number;
  capsulesPerHour: number;
  schedule: ScheduleRow[];

  // totals
  totals: {
    capsules: number;
    waterMl: number;
    carbsG: number;
  };
}

// Single source of truth for one BRUT capsule's sodium load.
export const BRUT_CAPSULE_SODIUM_MG = 211;
