// Deterministic per-phase nutrition guidelines.
//
// Pure functions only. Produces daily macro and hydration targets for
// each training phase, following the methodology in CLAUDE.md
// (carb periodisation by phase, protein 1.4–1.8 g/kg, hydration baseline).

import type { GeneratedPhase, PhaseName } from './race-plan-generator';

export interface GeneratedNutritionPhase {
  phaseName: PhaseName;
  carbsGPerKgMin: number;
  carbsGPerKgMax: number;
  proteinGPerKgMin: number;
  proteinGPerKgMax: number;
  hydrationMlPerKg: number;
  carbPeriodisationNote: string;
  timingGuidelines: string;
  foodFocus: string;
  thingsToAvoid: string;
}

const PROTEIN_MIN = 1.4;
const PROTEIN_MAX = 1.8;
const HYDRATION_ML_PER_KG = 32; // CLAUDE.md baseline 30–35 ml/kg/day

const CARBS_BY_PHASE: Record<PhaseName, [number, number]> = {
  base: [4, 6],
  build: [5, 7],
  peak: [6, 8],
  taper: [5, 7],
};

const PHASE_COPY: Record<
  PhaseName,
  Omit<
    GeneratedNutritionPhase,
    | 'phaseName'
    | 'carbsGPerKgMin'
    | 'carbsGPerKgMax'
    | 'proteinGPerKgMin'
    | 'proteinGPerKgMax'
    | 'hydrationMlPerKg'
  >
> = {
  base: {
    carbPeriodisationNote:
      'Keep carbohydrate moderate. Match intake to the day: more on long and quality days, less on rest days.',
    timingGuidelines:
      'Three balanced meals plus one or two snacks. Eat a carb-rich meal 2–3 h before key sessions.',
    foodFocus:
      'Whole grains, potatoes, rice, fruit, vegetables, lean protein at every meal, healthy fats.',
    thingsToAvoid:
      'Training key sessions fasted by habit. Skipping post-session protein.',
  },
  build: {
    carbPeriodisationNote:
      'Lift carbohydrate to support added intensity. Fuel hard days well; pull back slightly on easy days.',
    timingGuidelines:
      'Carb-rich meal 2–3 h pre-session; refuel within 60 min after threshold and tempo work.',
    foodFocus:
      'Easily digested carbs around sessions, protein spread across the day, colourful vegetables.',
    thingsToAvoid:
      'Under-fuelling intensity sessions. High-fibre or high-fat meals close to hard efforts.',
  },
  peak: {
    carbPeriodisationNote:
      'Highest carbohydrate of the programme on heavy days. Practise race-day fuelling in key sessions.',
    timingGuidelines:
      'Top up carbs the evening before and the morning of long or race-specific sessions. Refuel promptly after.',
    foodFocus:
      'Familiar, reliable carb sources. Rehearse race-day foods and drinks — nothing new.',
    thingsToAvoid:
      'Experimenting with new foods or supplements. Going into peak sessions low on glycogen.',
  },
  taper: {
    carbPeriodisationNote:
      'Hold carbohydrate intake even as volume drops — glycogen stores should be full for race day.',
    timingGuidelines:
      'Maintain regular meals; trim total kcal slightly to match lower volume but keep carbs high.',
    foodFocus:
      'Familiar carb-rich meals, steady protein, good hydration and adequate sodium.',
    thingsToAvoid:
      'Cutting carbs because training is lighter. Trying new foods in race week.',
  },
};

/** One nutrition guideline set per training phase. */
export function buildNutritionPhases(
  weightKg: number,
  phases: GeneratedPhase[],
): GeneratedNutritionPhase[] {
  return phases.map((phase) => {
    const [carbMin, carbMax] = CARBS_BY_PHASE[phase.name];
    const copy = PHASE_COPY[phase.name];
    const carbGrams = `${Math.round(weightKg * carbMin)}–${Math.round(
      weightKg * carbMax,
    )} g/day`;
    return {
      phaseName: phase.name,
      carbsGPerKgMin: carbMin,
      carbsGPerKgMax: carbMax,
      proteinGPerKgMin: PROTEIN_MIN,
      proteinGPerKgMax: PROTEIN_MAX,
      hydrationMlPerKg: HYDRATION_ML_PER_KG,
      carbPeriodisationNote: `${copy.carbPeriodisationNote} Around ${carbGrams} at your body weight.`,
      timingGuidelines: copy.timingGuidelines,
      foodFocus: copy.foodFocus,
      thingsToAvoid: copy.thingsToAvoid,
    };
  });
}
