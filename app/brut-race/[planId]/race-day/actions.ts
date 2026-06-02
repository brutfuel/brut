'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  raceDaySetupSchema,
  type RaceDaySetupValues,
} from '@/lib/validation/race-day';
import {
  generateRaceDayPlan,
  type RaceDayInput,
} from '@/lib/calculations/race-day-generator';
import type { Profile, RaceDayPlan, RacePlan } from '@/lib/types/db';

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Save the race-day setup and (re)generate the four plan blocks.
 * Upserts manually onto the latest existing row for the race plan,
 * since `race_day_plans` has no UNIQUE on `race_plan_id` (v1 trade-off).
 */
export async function saveRaceDaySetup(
  planId: string,
  values: RaceDaySetupValues,
): Promise<ActionResult | void> {
  const parsed = raceDaySetupSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid setup.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sign in required.' };

  // Race plan — used as the input for the generator.
  const { data: planData } = await supabase
    .from('race_plans')
    .select('id, sport, distance_km, race_date, target_time_minutes')
    .eq('id', planId)
    .maybeSingle();
  const plan = planData as Pick<
    RacePlan,
    'id' | 'sport' | 'distance_km' | 'race_date' | 'target_time_minutes'
  > | null;
  if (!plan) return { ok: false, error: 'Race plan not found.' };

  // Athlete weight.
  const { data: profileData } = await supabase
    .from('profiles')
    .select('weight_kg')
    .eq('id', user.id)
    .single();
  const weightKg =
    (profileData as Pick<Profile, 'weight_kg'> | null)?.weight_kg ?? 70;

  const v = parsed.data;
  const input: RaceDayInput = {
    sport: plan.sport,
    distanceKm: plan.distance_km,
    raceDate: plan.race_date,
    targetTimeMinutes: plan.target_time_minutes,
    weightKg,
    courseProfile: v.courseProfile,
    expectedTemperatureC: v.expectedTemperatureC,
    expectedHumidityPct: v.expectedHumidityPct,
    expectedWeather: v.expectedWeather,
    startTime: v.startTime,
    pacingStrategy: v.pacingStrategy,
    caffeineOk: v.caffeineOk,
    preferredGels: v.preferredGels,
  };

  const generated = generateRaceDayPlan(input);

  const payload = {
    race_plan_id: plan.id,
    user_id: user.id,
    course_profile: v.courseProfile,
    expected_temperature_c: v.expectedTemperatureC,
    expected_humidity_pct: v.expectedHumidityPct,
    expected_weather: v.expectedWeather,
    start_time: v.startTime,
    pacing_strategy: v.pacingStrategy,
    caffeine_ok: v.caffeineOk,
    preferred_gels: v.preferredGels,
    pre_race_week: generated.pre_race_week,
    race_morning: generated.race_morning,
    during_race: generated.during_race,
    post_race: generated.post_race,
    status: 'finalized' as const,
  };

  // Manual upsert: find the latest existing row for this race plan.
  const { data: existingData } = await supabase
    .from('race_day_plans')
    .select('id')
    .eq('race_plan_id', plan.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const existing = existingData as Pick<RaceDayPlan, 'id'> | null;

  if (existing) {
    const { error } = await supabase
      .from('race_day_plans')
      .update(payload)
      .eq('id', existing.id);
    if (error) {
      return { ok: false, error: 'Could not save your race-day plan.' };
    }
  } else {
    const { error } = await supabase.from('race_day_plans').insert(payload);
    if (error) {
      return { ok: false, error: 'Could not save your race-day plan.' };
    }
  }

  revalidatePath(`/brut-race/${plan.id}`);
  revalidatePath(`/brut-race/${plan.id}/race-day`);
  redirect(`/brut-race/${plan.id}/race-day`);
}
