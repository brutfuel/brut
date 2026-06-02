import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlanWeekBrowser from '@/components/brut-race/PlanWeekBrowser';
import PostponeRaceLink from '@/components/brut-race/PostponeRaceLink';
import { createClient } from '@/lib/supabase/server';
import { daysFromTodayToIso } from '@/lib/utils/dates';
import type {
  NutritionPhase,
  Phase,
  RaceDayPlan,
  RacePlan,
  Session,
} from '@/lib/types/db';

interface Props {
  params: { planId: string };
}

const SPORT_LABELS: Record<RacePlan['sport'], string> = {
  running: 'Running',
  cycling: 'Cycling',
  triathlon: 'Triathlon',
};

const PHASE_LABELS: Record<Phase['name'], string> = {
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  taper: 'Taper',
};

function formatTargetTime(minutes: number | null): string {
  if (minutes === null) return 'To be estimated';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export default async function RacePlanPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: planData } = await supabase
    .from('race_plans')
    .select('*')
    .eq('id', params.planId)
    .maybeSingle();

  const plan = planData as RacePlan | null;

  if (!plan) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
              Race plan
            </span>
            <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
              Plan not found
            </h1>
            <p className="mt-6 text-base font-normal text-brut-ink leading-relaxed">
              This race plan does not exist or is not yours to view.
            </p>
            <Link
              href="/brut-race"
              className="mt-8 inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-brut-black pb-1 hover:opacity-60 transition-opacity"
            >
              Build a new plan &rarr;
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const [{ data: phaseData }, { data: sessionData }] = await Promise.all([
    supabase
      .from('phases')
      .select('*')
      .eq('race_plan_id', plan.id)
      .order('order_index', { ascending: true }),
    supabase
      .from('sessions')
      .select('*')
      .eq('race_plan_id', plan.id)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true }),
  ]);

  const phases = (phaseData as Phase[] | null) ?? [];
  const sessions = (sessionData as Session[] | null) ?? [];

  const phaseIds = phases.map((p) => p.id);
  const [{ data: nutritionData }, { data: rdpData }] = await Promise.all([
    phaseIds.length
      ? supabase
          .from('nutrition_phases')
          .select('*')
          .in('phase_id', phaseIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('race_day_plans')
      .select('id')
      .eq('race_plan_id', plan.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const nutritionPhases = (nutritionData as NutritionPhase[] | null) ?? [];
  const nutritionByPhase = new Map(
    nutritionPhases.map((n) => [n.phase_id, n]),
  );
  const raceDayPlan = rdpData as Pick<RaceDayPlan, 'id'> | null;
  const daysToRace = daysFromTodayToIso(plan.race_date);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-24">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          Race plan
        </span>
        <h1 className="mt-6 text-[44px] md:text-[68px] leading-[0.98] font-thin tracking-brut text-brut-black">
          {SPORT_LABELS[plan.sport]} · {plan.distance_km} km
        </h1>

        {/* Summary */}
        <dl className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8 max-w-3xl">
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              Race date
            </dt>
            <dd className="text-2xl font-thin tracking-brut text-brut-black">
              {plan.race_date}
            </dd>
            <PostponeRaceLink
              planId={plan.id}
              currentRaceDate={plan.race_date}
            />
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              Target time
            </dt>
            <dd className="text-2xl font-thin tracking-brut text-brut-black">
              {formatTargetTime(plan.target_time_minutes)}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              Programme
            </dt>
            <dd className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
              {plan.weeks_total} weeks
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              Days / week
            </dt>
            <dd className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
              {plan.days_per_week}
            </dd>
          </div>
        </dl>

        {/* Phase overview */}
        <section className="mt-16">
          <div className="flex items-baseline justify-between pb-3 border-b border-brut-line">
            <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted tabular-nums">
              01
            </span>
            <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-ink">
              Phases
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-px bg-brut-line border border-brut-line">
            {phases.map((phase) => {
              const nutrition = nutritionByPhase.get(phase.id);
              return (
                <div key={phase.id} className="bg-white p-5 flex flex-col gap-2">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted tabular-nums">
                    Weeks {phase.week_start}–{phase.week_end}
                  </span>
                  <span className="text-xl font-thin tracking-brut text-brut-black uppercase">
                    {PHASE_LABELS[phase.name]}
                  </span>
                  <p className="text-xs font-normal text-brut-ink leading-relaxed">
                    {phase.focus_description}
                  </p>
                  {nutrition ? (
                    <p className="mt-1 text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                      Carbs {nutrition.carbs_g_per_kg_min}–
                      {nutrition.carbs_g_per_kg_max} g/kg
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Race day plan */}
        <section className="mt-16 border border-brut-black p-6 md:p-8 flex flex-col gap-3">
          <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
            Race day plan
          </span>
          {raceDayPlan ? (
            <>
              <p className="text-2xl font-thin tracking-brut text-brut-black">
                Your race-day plan is ready.
              </p>
              <p className="text-sm font-normal text-brut-ink leading-relaxed">
                Pre-race week, race morning, segment-by-segment fuelling and
                recovery — all in one place.
              </p>
              <Link
                href={`/brut-race/${plan.id}/race-day`}
                className="mt-3 inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-brut-black pb-1 self-start hover:opacity-60 transition-opacity"
              >
                Open race day plan &rarr;
              </Link>
            </>
          ) : daysToRace <= 14 && daysToRace >= 0 ? (
            <>
              <p className="text-2xl font-thin tracking-brut text-brut-black">
                Almost ready — build your race day plan.
              </p>
              <p className="text-sm font-normal text-brut-ink leading-relaxed">
                Course profile, expected weather, pacing strategy and the full
                segment-by-segment fuelling plan. Takes two minutes.
              </p>
              <Link
                href={`/brut-race/${plan.id}/race-day/setup`}
                className="mt-3 inline-flex items-center justify-center px-5 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors self-start"
              >
                Build my race day plan
              </Link>
            </>
          ) : (
            <>
              <p className="text-2xl font-thin tracking-brut text-brut-black">
                Unlocks 14 days before the race.
              </p>
              <p className="text-sm font-normal text-brut-ink leading-relaxed">
                You can build it manually any time — but the closer you are to
                race day, the more accurate the weather and fuelling defaults
                will be.
              </p>
              <Link
                href={`/brut-race/${plan.id}/race-day/setup`}
                className="mt-3 inline-block text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors underline underline-offset-4 decoration-brut-line hover:decoration-brut-black self-start"
              >
                Build it now anyway
              </Link>
            </>
          )}
        </section>

        {/* Week-by-week schedule */}
        <section className="mt-16">
          <div className="flex items-baseline justify-between pb-3 border-b border-brut-line">
            <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted tabular-nums">
              02
            </span>
            <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-ink">
              Weekly schedule
            </span>
          </div>
          <div className="mt-6">
            <PlanWeekBrowser
              planId={plan.id}
              weeksTotal={plan.weeks_total}
              phases={phases}
              sessions={sessions}
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
