import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SessionTable from '@/components/brut-train/SessionTable';
import { SectionHeader } from '@/components/brut-train/SessionResult';
import SessionDetailActions from '@/components/brut-race/SessionDetailActions';
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
import { SESSION_TYPE_LABELS } from '@/lib/types/db';
import { formatDuration, formatLongDate } from '@/lib/utils/dates';

interface Props {
  params: { planId: string; sessionId: string };
}

const PHASE_LABELS: Record<Phase['name'], string> = {
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  taper: 'Taper',
};

function buildTitle(session: Session): string {
  const typeLabel = SESSION_TYPE_LABELS[session.session_type];
  if (session.distance_km && session.distance_km > 0) {
    return `${typeLabel} · ${session.distance_km} km`;
  }
  return typeLabel;
}

function statusBadge(status: Session['status']): string | null {
  if (status === 'completed') return 'Completed';
  if (status === 'skipped') return 'Skipped';
  if (status === 'modified') return 'Moved';
  return null;
}

export default async function SessionDetailPage({ params }: Props) {
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
            &larr; Back to plan
          </Link>
          <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
            Session not found
          </h1>
          <p className="mt-6 text-base font-normal text-brut-ink leading-relaxed">
            This session does not exist or is not part of this plan.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  // Fetch plan (sport for fallback nutrition) + phase name for the meta line.
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

  // Use the JSONB payload if present; otherwise compute on demand.
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
    const computed = buildPlan(sessionInput);
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

  const title = buildTitle(session);
  const phaseLabel = phase ? PHASE_LABELS[phase.name] : null;
  const dateLabel = formatLongDate(session.scheduled_date);
  const badge = statusBadge(session.status);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 md:px-10 pt-12 md:pt-16 pb-32 md:pb-24 min-h-[70vh]">
        <Link
          href={`/brut-race/${params.planId}?week=${session.week_number}`}
          className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors"
        >
          &larr; Back to week {session.week_number}
        </Link>

        <h1 className="mt-6 text-[44px] md:text-[64px] leading-[0.98] font-thin tracking-brut text-brut-black">
          {title}
        </h1>

        <p className="mt-3 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
          Week {session.week_number}
          {phaseLabel ? ` · ${phaseLabel.toUpperCase()} phase` : ''}
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
          <SectionHeader index="01" label="Session structure" />
          {session.structure ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  Warm-up · {session.structure.warmup.minutes} min
                </p>
                <p className="mt-1 text-sm text-brut-ink leading-relaxed">
                  {session.structure.warmup.description}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  Main set · {session.structure.mainSet.minutes} min
                </p>
                <p className="mt-1 text-sm text-brut-ink leading-relaxed">
                  {session.structure.mainSet.description}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  Cool-down · {session.structure.cooldown.minutes} min
                </p>
                <p className="mt-1 text-sm text-brut-ink leading-relaxed">
                  {session.structure.cooldown.description}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brut-muted">
              Structure unavailable for this session.
            </p>
          )}
        </section>

        {/* 02 — Pre-session nutrition */}
        <section className="mt-12 flex flex-col gap-4">
          <SectionHeader index="02" label="Pre-session nutrition" />
          {pre ? (
            <>
              <p className="text-sm text-brut-ink leading-relaxed">{pre.food}</p>
              <p className="text-sm text-brut-muted leading-relaxed">
                {pre.hydration}
              </p>
            </>
          ) : (
            <p className="text-sm text-brut-muted">
              Pre-session guidance unavailable.
            </p>
          )}
        </section>

        {/* 03 — During session */}
        <section className="mt-12 flex flex-col gap-5">
          <SectionHeader index="03" label="During session" />
          {during ? (
            <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    Carb target
                  </span>
                  <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                    {during.carbsPerHour > 0 ? during.carbsPerHour : '—'}
                    {during.carbsPerHour > 0 ? (
                      <span className="ml-1 text-sm font-normal text-brut-muted">
                        g / h
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    BRUT target
                  </span>
                  <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
                    {during.capsulesPerHour}
                    <span className="ml-1 text-sm font-normal text-brut-muted">
                      caps / h
                    </span>
                  </span>
                </div>
              </div>
              <SessionTable rows={during.schedule} />
              <div className="mt-2 grid grid-cols-3 gap-3 bg-brut-black text-white p-5">
                <div>
                  <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
                    BRUT
                  </p>
                  <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
                    {during.totals.capsules}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
                    Water
                  </p>
                  <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
                    {during.totals.waterMl}
                    <span className="ml-1 text-xs font-normal text-white/60">
                      ml
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
                    Carbs
                  </p>
                  <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
                    {during.totals.carbsG}
                    <span className="ml-1 text-xs font-normal text-white/60">
                      g
                    </span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-brut-muted">
              During-session guidance unavailable.
            </p>
          )}
        </section>

        {/* 04 — Post-session */}
        <section className="mt-12 flex flex-col gap-4">
          <SectionHeader index="04" label="Post-session recovery" />
          {post ? (
            <>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                <div className="col-span-1">
                  <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    Protein
                  </dt>
                  <dd className="text-brut-ink">{post.proteinGrams}</dd>
                </div>
                <div className="col-span-1">
                  <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    Carbs
                  </dt>
                  <dd className="text-brut-ink">{post.carbsGrams}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    Water
                  </dt>
                  <dd className="text-brut-ink">{post.waterMl}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
                    BRUT
                  </dt>
                  <dd className="text-brut-ink">
                    {post.capsules} capsule with an electrolyte-rich snack.
                  </dd>
                </div>
              </dl>
              <p className="text-sm text-brut-muted leading-relaxed">
                {post.exampleMeal}
              </p>
            </>
          ) : (
            <p className="text-sm text-brut-muted">
              Post-session guidance unavailable.
            </p>
          )}
        </section>

        {/* Notes if marked done */}
        {session.user_notes ? (
          <section className="mt-12 flex flex-col gap-3">
            <SectionHeader index="05" label="Your notes" />
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
