import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SessionTable from '@/components/brut-train/SessionTable';
import { SectionHeader } from '@/components/brut-train/SessionResult';
import SessionDetailActions from '@/components/brut-race/SessionDetailActions';
import { Link } from '@/lib/i18n/routing';
import type { AppLocale } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { buildPlan } from '@/lib/calculations/plan';
import type {
  PostSessionPlan,
  PreSessionPlan,
  SessionInput,
  SodiumDiet,
} from '@/lib/calculations/types';
import type {
  Phase,
  Profile,
  RacePlan,
  Session,
  SessionDuringNutrition,
} from '@/lib/types/db';
import { formatDuration, formatLongDate } from '@/lib/utils/dates';

interface Props {
  params: { planId: string; sessionId: string };
}

export default async function SessionDetailPage({ params }: Props) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('brut_race.session_detail');
  const tPhases = await getTranslations('phases');
  const tSessionTypes = await getTranslations('session_types');
  const tUnits = await getTranslations('common.units');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: sessionData } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.sessionId)
    .eq('race_plan_id', params.planId)
    .maybeSingle();
  const session = sessionData as Session | null;

  if (!session) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
          <Link
            href={`/brut-race/${params.planId}`}
            className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors"
          >
            {t('back_to_plan')}
          </Link>
          <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
            {t('not_found_title')}
          </h1>
          <p className="mt-6 text-base font-normal text-brut-ink leading-relaxed">
            {t('not_found_body')}
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const [{ data: planData }, phaseFetch] = await Promise.all([
    supabase
      .from('race_plans')
      .select('id, sport')
      .eq('id', params.planId)
      .maybeSingle(),
    session.phase_id
      ? supabase
          .from('phases')
          .select('name')
          .eq('id', session.phase_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const plan = planData as Pick<RacePlan, 'id' | 'sport'> | null;
  const phase = phaseFetch.data as Pick<Phase, 'name'> | null;

  let pre: PreSessionPlan | null = session.pre_session_nutrition;
  let during: SessionDuringNutrition | null = session.during_nutrition;
  let post: PostSessionPlan | null = session.post_session_nutrition;

  if ((!pre || !during || !post) && plan) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('weight_kg, acclimated, sodium_diet, known_sweat_rate_lh')
      .eq('id', user.id)
      .single();
    const profile = profileData as Pick<
      Profile,
      'weight_kg' | 'acclimated' | 'sodium_diet' | 'known_sweat_rate_lh'
    > | null;

    const sessionInput: SessionInput = {
      sport: plan.sport,
      surface: null,
      sessionType: session.session_type,
      duration: session.duration_minutes / 60,
      distance: session.distance_km,
      elevation: 0,
      temperature: 22,
      timeOfDay: 'morning',
      lastMeal: '2-4h',
      weight: profile?.weight_kg ?? 70,
      humidity: 50,
      heatAcclimated: profile?.acclimated ?? false,
      sodiumDiet: (profile?.sodium_diet as SodiumDiet | null) ?? 'normal',
      knownSweatRate: profile?.known_sweat_rate_lh ?? null,
    };
    const tCalc = await getTranslations('calc');
    const computed = buildPlan(sessionInput, tCalc);
    pre = pre ?? computed.preSession;
    during =
      during ?? {
        carbsPerHour: computed.carbsPerHour,
        capsulesPerHour: computed.capsulesPerHour,
        schedule: computed.schedule,
        totals: computed.totals,
      };
    post = post ?? computed.postSession;
  }

  const typeLabel = tSessionTypes(session.session_type);
  const title =
    session.distance_km && session.distance_km > 0
      ? `${typeLabel} · ${session.distance_km} km`
      : typeLabel;
  const phaseLabel = phase ? tPhases(phase.name) : null;
  const dateLabel = formatLongDate(session.scheduled_date, locale);
  const badge =
    session.status === 'completed'
      ? t('badge_completed')
      : session.status === 'skipped'
        ? t('badge_skipped')
        : session.status === 'modified'
          ? t('badge_moved')
          : null;

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 md:px-10 pt-12 md:pt-16 pb-32 md:pb-24 min-h-[70vh]">
        <Link
          href={`/brut-race/${params.planId}?week=${session.week_number}`}
          className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors"
        >
          {t('back_to_week', { week: session.week_number })}
        </Link>

        <h1 className="mt-6 text-[44px] md:text-[64px] leading-[0.98] font-thin tracking-brut text-brut-black">
          {title}
        </h1>

        <p className="mt-3 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
          {t('meta_week', { week: session.week_number })}
          {phaseLabel
            ? t('meta_phase_suffix', { phase: phaseLabel.toUpperCase() })
            : ''}
          {dateLabel ? ` · ${dateLabel}` : ''}
        </p>

        {badge ? (
          <p className="mt-4 inline-block text-[10px] font-semibold tracking-brut-wide uppercase text-brut-black border border-brut-black px-2 py-0.5">
            {badge}
          </p>
        ) : null}

        <p className="mt-6 text-sm font-normal text-brut-muted tabular-nums">
          {formatDuration(session.duration_minutes)} · {session.target_zone ?? '—'}
        </p>

        {/* 01 — Session structure */}
        <section className="mt-12 flex flex-col gap-5">
          <SectionHeader index="01" label={t('section_structure')} />
          {session.structure ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  {t('warm_up')} · {session.structure.warmup.minutes}{' '}
                  {tUnits('min')}
                </p>
                <p className="mt-1 text-sm text-brut-ink leading-relaxed">
                  {session.structure.warmup.description}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  {t('main_set')} · {session.structure.mainSet.minutes}{' '}
                  {tUnits('min')}
                </p>
                <p className="mt-1 text-sm text-brut-ink leading-relaxed">
                  {session.structure.mainSet.description}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  {t('cool_down')} · {session.structure.cooldown.minutes}{' '}
                  {tUnits('min')}
                </p>
                <p className="mt-1 text-sm text-brut-ink leading-relaxed">
                  {session.structure.cooldown.description}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brut-muted">{t('structure_unavailable')}</p>
          )}
        </section>

        {/* 02 — Pre-session nutrition */}
        <section className="mt-12 flex flex-col gap-4">
          <SectionHeader index="02" label={t('section_pre')} />
          {pre ? (
            <>
              <p className="text-sm text-brut-ink leading-relaxed">{pre.food}</p>
              <p className="text-sm text-brut-muted leading-relaxed">
                {pre.hydration}
              </p>
            </>
          ) : (
            <p className="text-sm text-brut-muted">{t('pre_unavailable')}</p>
          )}
        </section>

        {/* 03 — During session */}
        <section className="mt-12 flex flex-col gap-5">
          <SectionHeader index="03" label={t('section_during')} />
          {during ? (
            <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    {t('carb_target')}
                  </span>
                  <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                    {during.carbsPerHour > 0 ? during.carbsPerHour : '—'}
                    {during.carbsPerHour > 0 ? (
                      <span className="ml-1 text-sm font-normal text-brut-muted">
                        {tUnits('g_per_h')}
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    {t('brut_target')}
                  </span>
                  <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                    {during.capsulesPerHour}
                    <span className="ml-1 text-sm font-normal text-brut-muted">
                      {tUnits('caps_per_h')}
                    </span>
                  </span>
                </div>
              </div>
              <SessionTable rows={during.schedule} />
              <div className="mt-2 grid grid-cols-3 gap-3 bg-brut-black text-white p-5">
                <div>
                  <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
                    {t('brut')}
                  </p>
                  <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
                    {during.totals.capsules}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
                    {t('water')}
                  </p>
                  <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
                    {during.totals.waterMl}
                    <span className="ml-1 text-xs font-normal text-white/60">
                      {tUnits('ml')}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
                    {t('carbs')}
                  </p>
                  <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
                    {during.totals.carbsG}
                    <span className="ml-1 text-xs font-normal text-white/60">
                      {tUnits('g')}
                    </span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-brut-muted">{t('during_unavailable')}</p>
          )}
        </section>

        {/* 04 — Post-session */}
        <section className="mt-12 flex flex-col gap-4">
          <SectionHeader index="04" label={t('section_post')} />
          {post ? (
            <>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                <div className="col-span-1">
                  <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    {t('protein')}
                  </dt>
                  <dd className="text-brut-ink">{post.proteinGrams}</dd>
                </div>
                <div className="col-span-1">
                  <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    {t('carbs')}
                  </dt>
                  <dd className="text-brut-ink">{post.carbsGrams}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    {t('water')}
                  </dt>
                  <dd className="text-brut-ink">{post.waterMl}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    {t('brut')}
                  </dt>
                  <dd className="text-brut-ink">
                    {t('post_brut_note', { count: post.capsules })}
                  </dd>
                </div>
              </dl>
              <p className="text-sm text-brut-muted leading-relaxed">
                {post.exampleMeal}
              </p>
            </>
          ) : (
            <p className="text-sm text-brut-muted">{t('post_unavailable')}</p>
          )}
        </section>

        {/* Notes if marked done */}
        {session.user_notes ? (
          <section className="mt-12 flex flex-col gap-3">
            <SectionHeader index="05" label={t('section_notes')} />
            <p className="text-sm text-brut-ink leading-relaxed">
              {session.user_notes}
            </p>
          </section>
        ) : null}

        <SessionDetailActions session={session} />
      </main>

      <Footer />
    </>
  );
}
