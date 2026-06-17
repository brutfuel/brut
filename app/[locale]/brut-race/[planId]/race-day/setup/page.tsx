import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RaceDaySetupForm from '@/components/brut-race/RaceDaySetupForm';
import { Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { daysFromTodayToIso } from '@/lib/utils/dates';
import type { RaceDayPlan, RacePlan } from '@/lib/types/db';
import type { RaceDaySetupValues } from '@/lib/validation/race-day';

interface Props {
  params: { planId: string };
}

function defaultSetup(): RaceDaySetupValues {
  return {
    courseProfile: 'flat',
    expectedTemperatureC: 18,
    expectedHumidityPct: 60,
    expectedWeather: 'cloudy',
    startTime: '09:00',
    pacingStrategy: 'even',
    caffeineOk: true,
    preferredGels: null,
  };
}

export default async function RaceDaySetupPage({ params }: Props) {
  const t = await getTranslations('brut_race.race_day_setup');
  const tSports = await getTranslations('sports');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: planData } = await supabase
    .from('race_plans')
    .select('id, sport, distance_km, race_date, race_name')
    .eq('id', params.planId)
    .maybeSingle();
  const plan = planData as Pick<
    RacePlan,
    'id' | 'sport' | 'distance_km' | 'race_date' | 'race_name'
  > | null;

  if (!plan) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
          <Link
            href="/dashboard"
            className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors"
          >
            {t('back_to_dashboard')}
          </Link>
          <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
            {t('plan_not_found')}
          </h1>
        </main>
        <Footer />
      </>
    );
  }

  const { data: existingData } = await supabase
    .from('race_day_plans')
    .select('*')
    .eq('race_plan_id', plan.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const existing = existingData as RaceDayPlan | null;

  const initialValues: RaceDaySetupValues = existing
    ? {
        courseProfile: existing.course_profile ?? 'flat',
        expectedTemperatureC: existing.expected_temperature_c ?? 18,
        expectedHumidityPct: existing.expected_humidity_pct ?? 60,
        expectedWeather: existing.expected_weather ?? 'cloudy',
        startTime: existing.start_time
          ? existing.start_time.slice(0, 5)
          : '09:00',
        pacingStrategy: existing.pacing_strategy ?? 'even',
        caffeineOk: existing.caffeine_ok ?? true,
        preferredGels: existing.preferred_gels,
      }
    : defaultSetup();

  const daysToGo = daysFromTodayToIso(plan.race_date);
  const title =
    plan.race_name ?? `${tSports(plan.sport)} · ${plan.distance_km} km`;

  return (
    <>
      <Header />

      <main className="mx-auto max-w-2xl px-6 md:px-10 pt-12 md:pt-16 pb-24 min-h-[70vh]">
        <Link
          href={`/brut-race/${plan.id}`}
          className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors"
        >
          {t('back_to_plan')}
        </Link>

        <span className="mt-6 inline-block text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          {t('eyebrow')}
        </span>
        <h1 className="mt-3 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          {title}
        </h1>
        <p className="mt-3 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted tabular-nums">
          {daysToGo >= 0
            ? t('days_to_go', { days: daysToGo })
            : t('race_day_passed')}
        </p>

        <div className="mt-12">
          <RaceDaySetupForm planId={plan.id} initialValues={initialValues} />
        </div>
      </main>

      <Footer />
    </>
  );
}
