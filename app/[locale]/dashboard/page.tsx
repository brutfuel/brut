import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CountdownBanner from '@/components/dashboard/CountdownBanner';
import { Link } from '@/lib/i18n/routing';
import type { AppLocale } from '@/lib/i18n/routing';
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
import { formatDuration, toIsoDate, weekdayLong } from '@/lib/utils/dates';
import type {
  NutritionPhase,
  Phase,
  Profile,
  RaceDayPlan,
  RacePlan,
  Session,
} from '@/lib/types/db';

function sectionLabel(text: string) {
  return (
    <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
      {text}
    </span>
  );
}

export default async function DashboardPage() {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('dashboard');
  const tPhases = await getTranslations('phases');
  const tSessionTypes = await getTranslations('session_types');

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
    (profile.full_name ?? '').trim().split(' ')[0] || t('athlete_word');

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
          {sectionLabel(t('eyebrow'))}
          <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
            {t('welcome_new', { name: firstName })}
          </h1>
          <p className="mt-4 text-sm md:text-base font-normal text-brut-ink leading-relaxed">
            {t('empty_intro')}
          </p>
          <div className="mt-8 flex flex-col gap-3 items-start">
            <Link
              href="/brut-race"
              className="inline-flex items-center justify-center px-6 py-4 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors"
            >
              {t('build_first_plan')}
            </Link>
            <Link
              href="/brut-train"
              className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors underline underline-offset-4 decoration-brut-line hover:decoration-brut-black"
            >
              {t('or_single_session')}
            </Link>
          </div>

          <section className="mt-16">
            {sectionLabel(t('quick_tools'))}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-px bg-brut-line border border-brut-line">
              <Link
                href="/brut-train"
                className="bg-white p-5 hover:bg-brut-bg-soft transition-colors flex flex-col gap-2"
              >
                <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  BRUT TRAIN
                </span>
                <span className="text-xl font-thin tracking-brut text-brut-black">
                  {t('plan_a_session')}
                </span>
              </Link>
              <Link
                href="/brut-race"
                className="bg-white p-5 hover:bg-brut-bg-soft transition-colors flex flex-col gap-2"
              >
                <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  BRUT RACE
                </span>
                <span className="text-xl font-thin tracking-brut text-brut-black">
                  {t('plan_a_race')}
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

  function relativeDay(iso: string): string {
    if (iso === today) return t('relative_today');
    const next = new Date(`${today}T00:00:00`);
    next.setDate(next.getDate() + 1);
    const tomorrowIso = toIsoDate(next);
    if (iso === tomorrowIso) return t('relative_tomorrow');
    return weekdayLong(iso, locale);
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 md:px-10 pt-12 md:pt-20 pb-24 min-h-[70vh]">
        {sectionLabel(t('eyebrow'))}
        <h1 className="mt-4 text-[32px] md:text-[44px] leading-[1.0] font-thin tracking-brut text-brut-black">
          {t('welcome_back', { name: firstName })}
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
          {sectionLabel(t('today_eyebrow'))}
          {todaysSession ? (
            <>
              <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                {weekdayLong(today, locale)}
              </p>
              <p className="text-2xl md:text-3xl font-thin tracking-brut text-brut-black">
                {tSessionTypes(todaysSession.session_type)}
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
                {t('open_session')}
              </Link>
            </>
          ) : (
            <>
              <p className="text-2xl md:text-3xl font-thin tracking-brut text-brut-black">
                {t('rest_day')}
              </p>
              <p className="text-sm font-normal text-brut-ink leading-relaxed">
                {t('rest_day_caption')}
              </p>
            </>
          )}
        </section>

        {/* ────────────── BLOC 3 · This week & BLOC 5 · This week's nutrition ────────────── */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-px bg-brut-line border border-brut-line">
          <section className="bg-white p-6 md:p-7 flex flex-col gap-4">
            {sectionLabel(t('this_week'))}
            <p className="text-2xl md:text-3xl font-thin tracking-brut text-brut-black tabular-nums">
              {t.rich('week_x_of_y', {
                current: currentWeek,
                total: activePlan.weeks_total,
              })}
            </p>
            {currentPhase ? (
              <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                {t('phase_label', { phase: tPhases(currentPhase.name) })}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                {t('sessions_progress', {
                  completed: weekProgress.completed,
                  total: weekProgress.total,
                })}
                {weekProgress.skipped > 0
                  ? ` ${t('skipped_count', { count: weekProgress.skipped })}`
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
                {t('km_completed_of_planned', {
                  completed: kmCompleted.toFixed(1),
                  planned: kmPlanned.toFixed(1),
                })}
              </p>
            ) : null}
            <Link
              href={`/brut-race/${activePlan.id}?week=${currentWeek}`}
              className="mt-2 inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-brut-black pb-1 self-start hover:opacity-60 transition-opacity"
            >
              {t('see_week')}
            </Link>
          </section>

          <section className="bg-white p-6 md:p-7 flex flex-col gap-4">
            {sectionLabel(t('this_weeks_nutrition'))}
            {nutritionTargets ? (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    {t('carbs')}
                  </span>
                  <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                    {nutritionTargets.carbsMinGPerDay}–
                    {nutritionTargets.carbsMaxGPerDay}
                    <span className="ml-2 text-sm font-normal text-brut-muted">
                      {t('g_per_day')}
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    {t('protein')}
                  </span>
                  <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                    {nutritionTargets.proteinMinGPerDay}–
                    {nutritionTargets.proteinMaxGPerDay}
                    <span className="ml-2 text-sm font-normal text-brut-muted">
                      {t('g_per_day')}
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    {t('hydration')}
                  </span>
                  <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                    {nutritionTargets.hydrationLPerDay}
                    <span className="ml-2 text-sm font-normal text-brut-muted">
                      {t('l_per_day')}
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm font-normal text-brut-muted">
                {t('nutrition_unavailable')}
              </p>
            )}

            <div className="mt-2 pt-4 border-t border-brut-line flex flex-col gap-2">
              <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                {t('capsules_this_week')}
              </span>
              <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                {capsulesThisWeek}
                <span className="ml-2 text-sm font-normal text-brut-muted">
                  {t('caps')}
                </span>
              </span>
              <a
                href="https://brutfuel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-brut-black pb-1 self-start hover:opacity-60 transition-opacity"
              >
                {t('get_capsules')}
              </a>
            </div>
          </section>
        </div>

        {/* ────────────── BLOC 4 · Next sessions ────────────── */}
        <section className="mt-12 flex flex-col gap-3">
          {sectionLabel(t('next_sessions'))}
          {nextSessions.length > 0 ? (
            <div className="flex flex-col">
              {nextSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/brut-race/${activePlan.id}/session/${s.id}?week=${s.week_number}`}
                  className="border-t border-brut-line first:border-t-0 py-4 flex items-center gap-3 hover:bg-brut-bg-soft transition-colors"
                >
                  <span className="w-24 shrink-0 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                    {s.scheduled_date ? relativeDay(s.scheduled_date) : '—'}
                  </span>
                  <span className="flex-1 text-sm font-medium text-brut-black">
                    {tSessionTypes(s.session_type)}
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
              {t('no_upcoming_sessions')}
            </p>
          )}
        </section>

        {/* ────────────── BLOC 6 · Quick tools ────────────── */}
        <section className="mt-12">
          {sectionLabel(t('quick_tools'))}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-px bg-brut-line border border-brut-line">
            <Link
              href="/brut-train"
              className="bg-white p-5 hover:bg-brut-bg-soft transition-colors flex flex-col gap-2"
            >
              <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                BRUT TRAIN
              </span>
              <span className="text-xl font-thin tracking-brut text-brut-black">
                {t('plan_a_session')}
              </span>
            </Link>
            <Link
              href="/brut-race"
              className="bg-white p-5 hover:bg-brut-bg-soft transition-colors flex flex-col gap-2"
            >
              <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                BRUT RACE
              </span>
              <span className="text-xl font-thin tracking-brut text-brut-black">
                {t('plan_a_race')}
              </span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
