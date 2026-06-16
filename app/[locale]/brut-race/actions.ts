'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import {
  raceFormSchema,
  weeksUntilRace,
  type RaceFormValues,
} from '@/lib/validation/race';
import {
  markSessionDoneSchema,
  postponeRaceSchema,
  rescheduleSessionSchema,
  skipSessionSchema,
  type MarkSessionDoneValues,
  type PostponeRaceValues,
  type RescheduleSessionValues,
  type SkipSessionValues,
} from '@/lib/validation/race-session';
import {
  generateRacePlan,
  type RacePlanInput,
} from '@/lib/calculations/race-plan-generator';
import { buildNutritionPhases } from '@/lib/calculations/nutrition-plan-generator';
import { buildPlan } from '@/lib/calculations/plan';
import type {
  SessionInput,
  Surface,
  TimeOfDay,
} from '@/lib/calculations/types';
import type { ExperienceLevel } from '@/lib/validation/race';
import type { Profile, RacePlan } from '@/lib/types/db';

type ActionResult = { ok: true } | { ok: false; error: string };
type CreateResult = { error: string };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ----------------------------------------------------------------
// Date helpers
// ----------------------------------------------------------------

/** Monday (1) … Sunday (7) of the week containing `date`. */
function mondayOf(date: Date): Date {
  const day = date.getDay(); // 0 = Sun … 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function toIsoDate(date: Date): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// ----------------------------------------------------------------
// Programme generation + persistence (shared by create + regenerate)
// ----------------------------------------------------------------

/**
 * Generate phases / sessions / nutrition for an existing `race_plans`
 * row and insert them. Caller is responsible for cleaning up child
 * rows on failure (or before calling, for the regenerate flow).
 */
async function generateAndPersistProgramme(
  supabase: SupabaseClient,
  planId: string,
  userId: string,
  input: RacePlanInput,
  raceDate: string,
): Promise<ActionResult> {
  const { phases, weeks } = generateRacePlan(input);
  const nutritionPhases = buildNutritionPhases(input.weightKg, phases);

  // Phases — keep id per name.
  const { data: phaseRows, error: phaseError } = await supabase
    .from('phases')
    .insert(
      phases.map((p) => ({
        race_plan_id: planId,
        name: p.name,
        order_index: p.orderIndex,
        week_start: p.weekStart,
        week_end: p.weekEnd,
        focus_description: p.focusDescription,
      })),
    )
    .select('id, name');

  if (phaseError || !phaseRows) {
    return { ok: false, error: 'Could not insert phases.' };
  }
  const phaseIdByName = new Map<string, string>(
    (phaseRows as Array<{ id: string; name: string }>).map((r) => [
      r.name,
      r.id,
    ]),
  );

  // Per-phase nutrition guidelines.
  const { error: nutritionError } = await supabase
    .from('nutrition_phases')
    .insert(
      nutritionPhases.map((n) => ({
        phase_id: phaseIdByName.get(n.phaseName),
        carbs_g_per_kg_min: n.carbsGPerKgMin,
        carbs_g_per_kg_max: n.carbsGPerKgMax,
        protein_g_per_kg_min: n.proteinGPerKgMin,
        protein_g_per_kg_max: n.proteinGPerKgMax,
        hydration_ml_per_kg: n.hydrationMlPerKg,
        carb_periodisation_note: n.carbPeriodisationNote,
        timing_guidelines: n.timingGuidelines,
        food_focus: n.foodFocus,
        things_to_avoid: n.thingsToAvoid,
      })),
    );

  if (nutritionError) {
    return { ok: false, error: 'Could not insert nutrition guidelines.' };
  }

  // Sessions. Anchor dates so the final week contains race day.
  const raceWeekMonday = mondayOf(new Date(`${raceDate}T00:00:00`));
  const week1Monday = new Date(raceWeekMonday);
  week1Monday.setDate(raceWeekMonday.getDate() - (input.weeksTotal - 1) * 7);

  const sessionRows = weeks.flatMap((week) =>
    week.sessions.map((s) => {
      const sessionInput: SessionInput = {
        sport: input.sport,
        surface: input.surface,
        sessionType: s.sessionType,
        duration: s.durationMinutes / 60,
        distance: s.distanceKm,
        elevation: 0,
        temperature: 22,
        timeOfDay: input.preferredTime,
        lastMeal: '2-4h',
        weight: input.weightKg,
        humidity: 50,
        heatAcclimated: false,
        sodiumDiet: 'normal',
        knownSweatRate: null,
      };
      const plan = buildPlan(sessionInput);

      const date = new Date(week1Monday);
      date.setDate(
        week1Monday.getDate() +
          (s.weekNumber - 1) * 7 +
          (s.dayOfWeek - 1),
      );

      return {
        race_plan_id: planId,
        phase_id: phaseIdByName.get(week.phaseName) ?? null,
        user_id: userId,
        week_number: s.weekNumber,
        day_of_week: s.dayOfWeek,
        scheduled_date: toIsoDate(date),
        session_type: s.sessionType,
        duration_minutes: s.durationMinutes,
        distance_km: s.distanceKm,
        target_zone: s.targetZone,
        structure: s.structure,
        structure_text: `${s.structure.warmup.minutes}m warm-up · ${s.structure.mainSet.minutes}m main · ${s.structure.cooldown.minutes}m cool-down`,
        pre_session_nutrition: plan.preSession,
        during_nutrition: {
          carbsPerHour: plan.carbsPerHour,
          capsulesPerHour: plan.capsulesPerHour,
          schedule: plan.schedule,
          totals: plan.totals,
        },
        post_session_nutrition: plan.postSession,
        status: 'planned',
      };
    }),
  );

  const { error: sessionError } = await supabase
    .from('sessions')
    .insert(sessionRows);

  if (sessionError) {
    return { ok: false, error: 'Could not insert sessions.' };
  }
  return { ok: true };
}

/** Build a `RacePlanInput` from a persisted `race_plans` row. */
function inputFromPlanRow(
  plan: RacePlan,
  weightKg: number,
  weeksTotalOverride?: number,
): RacePlanInput {
  return {
    sport: plan.sport,
    surface: (plan.surface as Surface) ?? null,
    distanceKm: plan.distance_km,
    elevationGainM: plan.elevation_gain_m,
    weeksTotal: weeksTotalOverride ?? plan.weeks_total,
    trainingDays: plan.training_days ?? [2, 4, 6],
    preferredTime: (plan.preferred_time as TimeOfDay | null) ?? 'morning',
    experienceLevel:
      (plan.experience_level as ExperienceLevel | null) ?? 'amateur',
    currentWeeklyVolumeHours: plan.current_weekly_volume_hours ?? 5,
    hoursPerWeek: plan.hours_per_week ?? 5,
    longestRecentSessionHours: plan.longest_recent_session_hours ?? 1,
    targetTimeMinutes: plan.target_time_minutes,
    weightKg,
    hrMax: plan.hr_max,
    ftp: plan.ftp,
  };
}

// ----------------------------------------------------------------
// Create race plan (entry point from /brut-race form)
// ----------------------------------------------------------------

export async function createRacePlan(
  values: RaceFormValues,
): Promise<CreateResult | void> {
  const parsed = raceFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid plan details.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/brut-race');
  }

  const d = parsed.data;
  const weeksTotal = weeksUntilRace(d.raceDate);
  const targetTimeMinutes =
    d.objectiveHours === null && d.objectiveMinutes === null
      ? null
      : (d.objectiveHours ?? 0) * 60 + (d.objectiveMinutes ?? 0);

  const { data: profileData } = await supabase
    .from('profiles')
    .select('weight_kg')
    .eq('id', user.id)
    .single();
  const weightKg = (profileData as Pick<Profile, 'weight_kg'> | null)
    ?.weight_kg ?? 70;

  const { data: planRow, error: planError } = await supabase
    .from('race_plans')
    .insert({
      user_id: user.id,
      sport: d.sport,
      distance_km: d.distanceKm,
      target_time_minutes: targetTimeMinutes,
      race_date: d.raceDate,
      weeks_total: weeksTotal,
      days_per_week: d.trainingDays.length,
      hours_per_week: d.hoursPerWeek,
      surface: d.surface,
      elevation_gain_m: d.elevationGainM,
      experience_level: d.experienceLevel,
      current_weekly_volume_hours: d.currentWeeklyVolumeHours,
      longest_recent_session_hours: d.longestRecentSessionHours,
      hr_max: d.hrMax,
      ftp: d.ftp,
      preferred_time: d.preferredTime,
      training_days: d.trainingDays,
    })
    .select('id')
    .single();

  if (planError || !planRow) {
    return { error: 'Could not create your race plan. Please try again.' };
  }
  const planId = (planRow as { id: string }).id;

  const input: RacePlanInput = {
    sport: d.sport,
    surface: d.surface,
    distanceKm: d.distanceKm,
    elevationGainM: d.elevationGainM,
    weeksTotal,
    trainingDays: d.trainingDays,
    preferredTime: d.preferredTime,
    experienceLevel: d.experienceLevel,
    currentWeeklyVolumeHours: d.currentWeeklyVolumeHours,
    hoursPerWeek: d.hoursPerWeek,
    longestRecentSessionHours: d.longestRecentSessionHours,
    targetTimeMinutes,
    weightKg,
    hrMax: d.hrMax,
    ftp: d.ftp,
  };

  const result = await generateAndPersistProgramme(
    supabase,
    planId,
    user.id,
    input,
    d.raceDate,
  );

  if (!result.ok) {
    // Best-effort cleanup — cascades remove phases / sessions / nutrition.
    await supabase.from('race_plans').delete().eq('id', planId);
    return { error: result.error };
  }

  redirect(`/brut-race/${planId}`);
}

// ----------------------------------------------------------------
// Per-session actions: mark done, skip, reschedule
// ----------------------------------------------------------------

async function loadSessionAndPlan(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<
  | { ok: true; race_plan_id: string; week_number: number }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from('sessions')
    .select('race_plan_id, week_number')
    .eq('id', sessionId)
    .maybeSingle();
  if (error || !data) {
    return { ok: false, error: 'Session not found.' };
  }
  const row = data as { race_plan_id: string; week_number: number };
  return { ok: true, race_plan_id: row.race_plan_id, week_number: row.week_number };
}

/** Mark a session as completed with the post-session feedback. */
export async function markSessionDone(
  sessionId: string,
  values: MarkSessionDoneValues,
): Promise<ActionResult> {
  const parsed = markSessionDoneSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid feedback.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in required.' };

  const session = await loadSessionAndPlan(supabase, sessionId);
  if (!session.ok) return session;

  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      felt: parsed.data.felt,
      user_notes: parsed.data.notes,
      capsules_taken: parsed.data.capsulesTaken,
    })
    .eq('id', sessionId);

  if (error) return { ok: false, error: 'Could not save. Please try again.' };

  revalidatePath(`/brut-race/${session.race_plan_id}`);
  revalidatePath(`/brut-race/${session.race_plan_id}/session/${sessionId}`);
  revalidatePath('/dashboard');
  return { ok: true };
}

/** Mark a session as skipped, with an optional reason. */
export async function skipSession(
  sessionId: string,
  values: SkipSessionValues,
): Promise<ActionResult> {
  const parsed = skipSessionSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in required.' };

  const session = await loadSessionAndPlan(supabase, sessionId);
  if (!session.ok) return session;

  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'skipped',
      completed_at: new Date().toISOString(),
      user_notes: parsed.data.reason,
    })
    .eq('id', sessionId);

  if (error) return { ok: false, error: 'Could not save. Please try again.' };

  revalidatePath(`/brut-race/${session.race_plan_id}`);
  revalidatePath(`/brut-race/${session.race_plan_id}/session/${sessionId}`);
  revalidatePath('/dashboard');
  return { ok: true };
}

/**
 * Move a session to a different day within the same training week.
 * Week-crossing moves are out of scope for v1 — the caller must pass
 * a date that falls in the session's current week.
 */
export async function rescheduleSession(
  sessionId: string,
  values: RescheduleSessionValues,
): Promise<ActionResult> {
  const parsed = rescheduleSessionSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid date.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in required.' };

  const session = await loadSessionAndPlan(supabase, sessionId);
  if (!session.ok) return session;

  const { error } = await supabase
    .from('sessions')
    .update({
      scheduled_date: parsed.data.newDate,
      day_of_week: parsed.data.newDayOfWeek,
      status: 'modified',
    })
    .eq('id', sessionId);

  if (error) return { ok: false, error: 'Could not move the session.' };

  revalidatePath(`/brut-race/${session.race_plan_id}`);
  revalidatePath(`/brut-race/${session.race_plan_id}/session/${sessionId}`);
  return { ok: true };
}

// ----------------------------------------------------------------
// Postpone race date
// ----------------------------------------------------------------

/**
 * Move the race date later.
 *  - Shift ≤ 28 days: shift every session's `scheduled_date` forward.
 *  - Shift > 28 days: requires `regenerate: true` — wipes existing
 *    phases / sessions / nutrition and re-generates the programme.
 */
export async function postponeRace(
  planId: string,
  values: PostponeRaceValues,
): Promise<ActionResult> {
  const parsed = postponeRaceSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid date.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in required.' };

  const { data: planData } = await supabase
    .from('race_plans')
    .select('*')
    .eq('id', planId)
    .maybeSingle();
  const plan = planData as RacePlan | null;
  if (!plan) return { ok: false, error: 'Plan not found.' };

  const oldDate = new Date(`${plan.race_date}T00:00:00`);
  const newDate = new Date(`${parsed.data.newRaceDate}T00:00:00`);
  if (Number.isNaN(newDate.getTime())) {
    return { ok: false, error: 'Invalid new date.' };
  }
  const diffDays = Math.round(
    (newDate.getTime() - oldDate.getTime()) / MS_PER_DAY,
  );
  if (diffDays === 0) {
    return { ok: false, error: 'New race date must differ from the current one.' };
  }
  if (diffDays < 0) {
    return { ok: false, error: 'New race date must be later than the current one.' };
  }

  if (diffDays > 28) {
    if (!parsed.data.regenerate) {
      return {
        ok: false,
        error:
          'Postponing by more than four weeks regenerates the full plan. Please confirm.',
      };
    }

    // Regenerate: wipe child rows, then re-run the generator with the new date.
    const { error: delError } = await supabase
      .from('phases')
      .delete()
      .eq('race_plan_id', planId);
    if (delError) {
      return { ok: false, error: 'Could not reset the existing programme.' };
    }

    const newWeeksTotal = weeksUntilRace(parsed.data.newRaceDate);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('weight_kg')
      .eq('id', user.id)
      .single();
    const weightKg =
      (profileData as Pick<Profile, 'weight_kg'> | null)?.weight_kg ?? 70;

    const { error: planUpdateError } = await supabase
      .from('race_plans')
      .update({
        race_date: parsed.data.newRaceDate,
        weeks_total: newWeeksTotal,
        current_week: 1,
      })
      .eq('id', planId);
    if (planUpdateError) {
      return { ok: false, error: 'Could not update the plan.' };
    }

    const input = inputFromPlanRow(plan, weightKg, newWeeksTotal);
    const result = await generateAndPersistProgramme(
      supabase,
      planId,
      user.id,
      input,
      parsed.data.newRaceDate,
    );
    if (!result.ok) return result;
  } else {
    // Soft shift: move every scheduled session by `diffDays`.
    const { data: sessionRows, error: fetchError } = await supabase
      .from('sessions')
      .select('id, scheduled_date')
      .eq('race_plan_id', planId);
    if (fetchError) {
      return { ok: false, error: 'Could not load the sessions to move.' };
    }

    const sessions =
      (sessionRows as Array<{ id: string; scheduled_date: string | null }>) ??
      [];
    const updates = sessions
      .filter((s) => s.scheduled_date)
      .map((s) => {
        const d = new Date(`${s.scheduled_date}T00:00:00`);
        d.setDate(d.getDate() + diffDays);
        return supabase
          .from('sessions')
          .update({ scheduled_date: toIsoDate(d) })
          .eq('id', s.id);
      });
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) {
      return { ok: false, error: 'Could not shift some sessions.' };
    }

    const { error: planUpdateError } = await supabase
      .from('race_plans')
      .update({ race_date: parsed.data.newRaceDate })
      .eq('id', planId);
    if (planUpdateError) {
      return { ok: false, error: 'Could not update the plan.' };
    }
  }

  revalidatePath(`/brut-race/${planId}`);
  revalidatePath('/dashboard');
  return { ok: true };
}
