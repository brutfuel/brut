import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BrutTrainClient from '@/components/brut-train/BrutTrainClient';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_INPUT } from '@/lib/calculations/plan';
import type { SessionInput, SodiumDiet, TimeOfDay } from '@/lib/calculations/types';
import type { Profile } from '@/lib/types/db';

/** Profile stores training time with underscores; SessionInput uses hyphens. */
const TIME_OF_DAY_FROM_PROFILE: Record<string, TimeOfDay> = {
  early_morning: 'early-morning',
  morning: 'morning',
  afternoon: 'afternoon',
  evening: 'evening',
  night: 'night',
};

const VALID_SODIUM_DIETS = new Set<SodiumDiet>(['low', 'normal', 'high']);

/** Merge the user's profile into the default session input. */
function buildInitialInput(
  profile: Pick<
    Profile,
    'weight_kg' | 'acclimated' | 'sodium_diet' | 'known_sweat_rate_lh' | 'typical_training_time'
  > | null,
): SessionInput {
  if (!profile) return DEFAULT_INPUT;

  const sodiumDiet =
    profile.sodium_diet && VALID_SODIUM_DIETS.has(profile.sodium_diet as SodiumDiet)
      ? (profile.sodium_diet as SodiumDiet)
      : DEFAULT_INPUT.sodiumDiet;

  const timeOfDay = profile.typical_training_time
    ? TIME_OF_DAY_FROM_PROFILE[profile.typical_training_time] ?? DEFAULT_INPUT.timeOfDay
    : DEFAULT_INPUT.timeOfDay;

  return {
    ...DEFAULT_INPUT,
    weight: profile.weight_kg ?? DEFAULT_INPUT.weight,
    heatAcclimated: profile.acclimated ?? DEFAULT_INPUT.heatAcclimated,
    sodiumDiet,
    knownSweatRate: profile.known_sweat_rate_lh ?? null,
    timeOfDay,
  };
}

export default async function BrutTrainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Pick<
    Profile,
    'weight_kg' | 'acclimated' | 'sodium_diet' | 'known_sweat_rate_lh' | 'typical_training_time'
  > | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select(
        'weight_kg, acclimated, sodium_diet, known_sweat_rate_lh, typical_training_time',
      )
      .eq('id', user.id)
      .single();
    profile = data as typeof profile;
  }

  const initialInput = buildInitialInput(profile);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-20">
        {/* Page header */}
        <section className="mb-12 md:mb-16">
          <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
            01 — Session
          </span>
          <h1 className="mt-6 text-[56px] md:text-[88px] leading-[0.95] font-thin tracking-brut text-brut-black">
            BRUT TRAIN
          </h1>
          <p className="mt-6 max-w-xl text-base md:text-lg font-normal text-brut-ink leading-relaxed">
            Configure your next session and get a complete structure, fuelling
            schedule and replacement target.
          </p>
        </section>

        {/* Form (1fr) + Results (380 px sticky) */}
        <BrutTrainClient initialInput={initialInput} />
      </main>

      <Footer />
    </>
  );
}
