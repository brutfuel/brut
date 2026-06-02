import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileEditor from '@/app/profile/ProfileEditor';
import DeleteAccountSection from '@/components/auth/DeleteAccountSection';
import { createClient } from '@/lib/supabase/server';
import {
  DIETARY_RESTRICTION_OPTIONS,
  EMPTY_PRS,
  TERRAIN_OPTIONS,
  prsFromDb,
  type DietaryRestriction,
  type ExperienceLevel,
  type ProfileFormValues,
  type SodiumDietValue,
  type Terrain,
} from '@/lib/validation/profile-schema';
import type { Profile } from '@/lib/types/db';

const DIETARY_SET = new Set<string>(DIETARY_RESTRICTION_OPTIONS);
const TERRAIN_SET = new Set<string>(TERRAIN_OPTIONS);

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;

  if (!profile) {
    // Profile row missing — onboarding never ran. Send the user there.
    redirect('/register/onboarding');
  }

  const initialValues: ProfileFormValues = {
    // Identity
    fullName: profile.full_name ?? '',
    age: profile.age,
    gender: profile.gender,
    heightCm: profile.height_cm,
    weightKg: profile.weight_kg ?? 70,
    // Experience
    primarySport: profile.primary_sport ?? 'running',
    level: (profile.level as ExperienceLevel | null) ?? 'amateur',
    yearsTraining: profile.years_training,
    weeklyVolumeHours: profile.weekly_volume_hours,
    longestRecentSessionKm: profile.longest_recent_session_km,
    // PRs
    prs: profile.prs ? prsFromDb(profile.prs) : { ...EMPTY_PRS },
    // Physiology
    fcmax: profile.fcmax,
    fcrest: profile.fcrest,
    vo2max: profile.vo2max,
    // Health
    injuries: profile.injuries ?? '',
    dietaryRestrictions: (profile.dietary_restrictions ?? []).filter((v) =>
      DIETARY_SET.has(v),
    ) as DietaryRestriction[],
    medicallyCleared: profile.medically_cleared ?? false,
    // Hydration
    acclimated: profile.acclimated ?? false,
    sodiumDiet: (profile.sodium_diet as SodiumDietValue | null) ?? 'normal',
    knownSweatRateLh: profile.known_sweat_rate_lh,
    // Logistics
    typicalTrainingTime: profile.typical_training_time,
    typicalTerrain: (profile.typical_terrain ?? []).filter((v) =>
      TERRAIN_SET.has(v),
    ) as Terrain[],
  };

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[720px] px-6 md:px-10 pt-16 md:pt-24 pb-12 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          Account
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          Profile
        </h1>
        <p className="mt-4 text-sm font-normal text-brut-muted">
          Personalise your plans and per-session fuelling. Everything here is
          optional — fill in only what helps us tune your training.
        </p>

        <div className="mt-12">
          <ProfileEditor initialValues={initialValues} />
        </div>

        <DeleteAccountSection />
      </main>

      <Footer />
    </>
  );
}
