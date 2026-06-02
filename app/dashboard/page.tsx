import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CountdownBanner from '@/components/dashboard/CountdownBanner';
import { createClient } from '@/lib/supabase/server';
import {
  getCapsulesNeededThisWeek,
  getCurrentWeekNumber,
  getKmCompletedThisWeek,
  getKmPlannedThisWeek,
  getNextNSessions,
  getPhaseForWeek,
  getTodaysSession,
  getWeekProgress,
  getWeeklyNutritionTargets,
} from '@/lib/dashboard/metrics';
import { formatDuration, toIsoDate } from '@/lib/utils/dates';
import { SESSION_TYPE_LABELS } from '@/lib/types/db';
import type {
  NutritionPhase,
  Phase,
  Profile,
  RaceDayPlan,
  RacePlan,
  Session,
} from '@/lib/types/db';

const PHASE_LABELS: Record<Phase['name'], string> = {
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  taper: 'Taper',
};

function weekdayLong(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
  });
}

/** Relative day label: Today / Tomorrow / Saturday. */
function relativeDay(iso: string, today: string): string {
  if (iso === today) return 'Today';
  const next = new Date(`${today}T00:00:00`);
  next.setDate(next.getDate() + 1);
  const tomorrowIso = toIsoDate(next);
  if (iso === tomorrowIso) return 'Tomorrow';
  return weekdayLong(iso);
}

function sectionLabel(text: string) {
  return (
    <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
      {text}
    </span>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, weight_kg, primary_sport')
    .eq('id', user.id)
    .single();

  const profile = profileData as Pick<
    Profile,
    'full_name' | 'weight_kg' | 'primary_sport'
  > | null;

  if (!profile || profile.weight_kg === null || profile.primary_sport === null) {
    redirect('/register/onboarding');
  }

  const firstName =
    (profile.full_name ?? '').trim().split(' ')[0] || 'athlete';

  const { data: planData } = await supabase
    .from('race_plans')
    .select('id, sport, distance_km, race_date, race_name, weeks_total, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const activePlan = planData as Pick<
    RacePlan,
    | 'id'
    | 'sport'
    | 'distance_km'
    | 'race_date'
    | 'race_name'
    | 'weeks_total'
    | 'status'
  > | null;

  // ─────────────────────────────────────────────────────────────
  // No active race plan → empty state + quick tools.
  // ─────────────────────────────────────────────────────────────
  if (!activePlan) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
          {sectionLabel('Dashboard')}
          <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
            Welcome to BRUT, {firstName}
          </h1>
          <p className="mt-4 text-sm md:text-base font-normal text-brut-ink leading-relaxed">
            You haven&rsquo;t created a race plan yet. Let&rsquo;s build one in
            two minutes — sport, distance, date, when you train. We&rsquo;ll
            generate a periodised programme with fuelling baked in.
          </p>
          <div className="mt-8 flex flex-col gap-3 items-start">
            <Link
              href="/brut-race"
              className="inline-flex items-center justify-center px-6 py-4 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors"
            >
              Build my first race plan &rarr;
            </Link>
            <Link
              href="/brut-train"
              className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors underline underline-offset-4 decoration-brut-line hover:decoration-brut-black"
            >
              Or, plan just a single session &rarr;
            </Link>
          </div>

          <section className="mt-16">
            {sectionLabel('Quick tools')}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-px bg-brut-line border border-brut-line">
              <Link
                href="/brut-train"
                className="bg-white p-5 hover:bg-brut-bg-soft transition-colors flex flex-col gap-2"
              >
                <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  Brut Train
                </span>
                <span className="text-xl font-thin tracking-brut text-brut-black">
                  Plan a session &rarr;
                </span>
              </Link>
              <Link
                href="/brut-race"
                className="bg-white p-5 hover:bg-brut-bg-soft transition-colors flex flex-col gap-2"
              >
                <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  Brut Race
                </span>
                <span className="text-xl font-thin tracking-brut text-brut-black">
                  Plan a race &rarr;
                </span>
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Active plan — fetch everything we need in parallel.
  // ─────────────────────────────────────────────────────────────
  const [sessionsRes, phasesRes, rdpRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('*')
      .eq('race_plan_id', activePlan.id)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true }),
    supabase
      .from('phases')
      .select('*')
      .eq('race_plan_id', activePlan.id)
      .order('order_index', { ascending: true }),
    supabase
      .from('race_day_plans')
      .select('id')
      .eq('race_plan_id', activePlan.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const allSessions = (sessionsRes.data as Session[] | null) ?? [];
  const phases = (phasesRes.data as Phase[] | null) ?? [];
  const raceDayPlanExists = !!(rdpRes.data as Pick<RaceDayPlan, 'id'> | null);

  const today = toIsoDate(new Date());
  const currentWeek = getCurrentWeekNumber(activePlan, today);
  const currentPhase = getPhaseForWeek(phases, currentWeek);

  let nutritionPhase: NutritionPhase | null = null;
  if (currentPhase) {
    const { data: npData } = await supabase
      .from('nutrition_phases')
      .select('*')
      .eq('phase_id', currentPhase.id)
      .maybeSingle();
    nutritionPhase = npData as NutritionPhase | null;
  }

  const sessionsThisWeek = allSessions.filter(
    (s) => s.week_number === currentWeek,
  );
  const todaysSession = getTodaysSession(allSessions, today);
  const weekProgress = getWeekProgress(sessionsThisWeek);
  const kmPlanned = getKmPlannedThisWeek(sessionsThisWeek);
  const kmCompleted = getKmCompletedThisWeek(sessionsThisWeek);
  const nextSessions = getNextNSessions(allSessions, 3, today);
  const capsulesThisWeek = getCapsulesNeededThisWeek(sessionsThisWeek);
  const nutritionTargets = getWeeklyNutritionTargets(
    profile.weight_kg ?? 70,
    nutritionPhase,
  );

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 md:px-10 pt-12 md:pt-20 pb-24 min-h-[70vh]">
        {sectionLabel('Dashboard')}
        <h1 className="mt-4 text-[32px] md:text-[44px] leading-[1.0] font-thin tracking-brut text-brut-black">
          Welcome back, {firstName}
        </h1>

        {/* ────────────── BLOC 1 · Race countdown ────────────── */}
        <div className="mt-10">
          <CountdownBanner
            plan={activePlan}
            raceDayPlanExists={raceDayPlanExists}
          />
        </div>

        {/* ────────────── BLOC 2 · Today's session ────────────── */}
        <section className="mt-12 border border-brut-line p-6 md:p-7 flex flex-col gap-3">
          {sectionLabel('Today')}
          {todaysSession ? (
            <>
              <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                {weekdayLong(today)}
              </p>
              <p className="text-2xl md:text-3xl font-thin tracking-brut text-brut-black">
                {SESSION_TYPE_LABELS[todaysSession.session_type]}
                {todaysSession.distance_km
                  ? ` · ${todaysSession.distance_km} km`
                  : ''}
              </p>
              <p className="text-sm font-normal text-brut-ink">
                {formatDuration(todaysSession.duration_minutes)}
                {todaysSession.target_zone
                  ? ` · ${todaysSession.target_zone}`
                  : ''}
              </p>
              <Link
                href={`/brut-race/${activePlan.id}/session/${todaysSession.id}?week=${todaysSession.week_number}`}
                className="mt-3 inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-brut-black pb-1 self-start hover:opacity-60 transition-opacity"
              >
                Open session &rarr;
              </Link>
            </>
          ) : (
            <>
              <p className="text-2xl md:text-3xl font-thin tracking-brut text-brut-black">
                Rest day.
              </p>
              <p className="text-sm font-normal text-brut-ink leading-relaxed">
                Use it. Recovery is training.
              </p>
            </>
          )}
        </section>

        {/* ────────────── BLOC 3 · This week & BLOC 5 · This week's nutrition ────────────── */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-px bg-brut-line border border-brut-line">
          <section className="bg-white p-6 md:p-7 flex flex-col gap-4">
            {sectionLabel('This week')}
            <p className="text-2xl md:text-3xl font-thin tracking-brut text-brut-black tabular-nums">
              Week {currentWeek} <span className="text-brut-muted">/</span>{' '}
              {activePlan.weeks_total}
            </p>
            {currentPhase ? (
              <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                {PHASE_LABELS[currentPhase.name]} phase
              </p>
            ) : null}
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                {weekProgress.completed} of {weekProgress.total} sessions done
                {weekProgress.skipped > 0
                  ? ` · ${weekProgress.skipped} skipped`
                  : ''}
              </p>
              <div className="h-px bg-brut-line relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-brut-black"
                  style={{ width: `${weekProgress.pct}%` }}
                  aria-hidden
                />
              </div>
            </div>
            {kmPlanned > 0 ? (
              <p className="text-sm font-normal text-brut-ink tabular-nums">
                {kmCompleted.toFixed(1)} km of {kmPlanned.toFixed(1)} km
              </p>
            ) : null}
            <Link
              href={`/brut-race/${activePlan.id}?week=${currentWeek}`}
              className="mt-2 inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-brut-black pb-1 self-start hover:opacity-60 transition-opacity"
            >
              See week &rarr;
            </Link>
          </section>

          <section className="bg-white p-6 md:p-7 flex flex-col gap-4">
            {sectionLabel("This week's nutrition")}
            {nutritionTargets ? (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    Carbs
                  </span>
                  <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                    {nutritionTargets.carbsMinGPerDay}–
                    {nutritionTargets.carbsMaxGPerDay}
                    <span className="ml-2 text-sm font-normal text-brut-muted">
                      g / day
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    Protein
                  </span>
                  <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                    {nutritionTargets.proteinMinGPerDay}–
                    {nutritionTargets.proteinMaxGPerDay}
                    <span className="ml-2 text-sm font-normal text-brut-muted">
                      g / day
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    Hydration
                  </span>
                  <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                    {nutritionTargets.hydrationLPerDay}
                    <span className="ml-2 text-sm font-normal text-brut-muted">
                      L / day
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm font-normal text-brut-muted">
                Nutrition targets unavailable.
              </p>
            )}

            <div className="mt-2 pt-4 border-t border-brut-line flex flex-col gap-2">
              <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                BRUT capsules this week
              </span>
              <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                {capsulesThisWeek}
                <span className="ml-2 text-sm font-normal text-brut-muted">
                  caps
                </span>
              </span>
              <a
                href="https://brutfuel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-brut-black pb-1 self-start hover:opacity-60 transition-opacity"
              >
                Get capsules &rarr;
              </a>
            </div>
          </section>
        </div>

        {/* ────────────── BLOC 4 · Next sessions ────────────── */}
        <section className="mt-12 flex flex-col gap-3">
          {sectionLabel('Next sessions')}
          {nextSessions.length > 0 ? (
            <div className="flex flex-col">
              {nextSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/brut-race/${activePlan.id}/session/${s.id}?week=${s.week_number}`}
                  className="border-t border-brut-line first:border-t-0 py-4 flex items-center gap-3 hover:bg-brut-bg-soft transition-colors"
                >
                  <span className="w-24 shrink-0 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                    {s.scheduled_date ? relativeDay(s.scheduled_date, today) : '—'}
                  </span>
                  <span className="flex-1 text-sm font-medium text-brut-black">
                    {SESSION_TYPE_LABELS[s.session_type]}
                  </span>
                  <span className="text-sm font-normal text-brut-ink tabular-nums">
                    {s.distance_km != null
                      ? `${s.distance_km} km`
                      : formatDuration(s.duration_minutes)}
                  </span>
                  <span className="w-4 text-right text-brut-muted">&rarr;</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm font-normal text-brut-muted">
              No upcoming sessions on the calendar.
            </p>
          )}
        </section>

        {/* ────────────── BLOC 6 · Quick tools ────────────── */}
        <section className="mt-12">
          {sectionLabel('Quick tools')}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-px bg-brut-line border border-brut-line">
            <Link
              href="/brut-train"
              className="bg-white p-5 hover:bg-brut-bg-soft transition-colors flex flex-col gap-2"
            >
              <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                Brut Train
              </span>
              <span className="text-xl font-thin tracking-brut text-brut-black">
                Plan a session &rarr;
              </span>
            </Link>
            <Link
              href="/brut-race"
              className="bg-white p-5 hover:bg-brut-bg-soft transition-colors flex flex-col gap-2"
            >
              <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                Brut Race
              </span>
              <span className="text-xl font-thin tracking-brut text-brut-black">
                Plan a race &rarr;
              </span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
