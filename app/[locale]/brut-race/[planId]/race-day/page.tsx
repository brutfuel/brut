import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SectionHeader } from '@/components/brut-train/SessionResult';
import { createClient } from '@/lib/supabase/server';
import { daysFromTodayToIso, formatLongDate } from '@/lib/utils/dates';
import type { RaceDayPlan, RacePlan } from '@/lib/types/db';
import type {
  DayMinusKey,
  PreRaceDay,
} from '@/lib/calculations/race-day-generator';

interface Props {
  params: { planId: string };
}

const SPORT_LABELS: Record<RacePlan['sport'], string> = {
  running: 'Running',
  cycling: 'Cycling',
  triathlon: 'Triathlon',
};

const DAY_KEY_LABEL: Record<DayMinusKey, string> = {
  day_minus_7: 'Day −7',
  day_minus_6: 'Day −6',
  day_minus_5: 'Day −5',
  day_minus_4: 'Day −4',
  day_minus_3: 'Day −3',
  day_minus_2: 'Day −2',
  day_minus_1: 'Day −1',
};

const FOCUS_LABEL: Record<PreRaceDay['focus'], string> = {
  maintain: 'Maintain',
  taper: 'Taper',
  rest: 'Rest',
  race_prep: 'Race prep',
};

const TRAINING_LABEL: Record<PreRaceDay['training'], string> = {
  short_easy: 'Short easy',
  short_with_strides: 'Easy + strides',
  short_quality: 'Short quality',
  rest: 'Rest',
};

const NUTRITION_LABEL: Record<PreRaceDay['nutrition_focus'], string> = {
  normal: 'Normal eating',
  carb_load: 'Carb loading',
  low_fiber: 'Low fibre',
  hydration_priority: 'Hydration priority',
};

function fmtPct(n: number | null | undefined): string {
  return n == null ? '—' : `${n}%`;
}

function fmtTemp(n: number | null | undefined): string {
  return n == null ? '—' : `${n}°C`;
}

export default async function RaceDayPlanPage({ params }: Props) {
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
    redirect('/dashboard');
  }

  const { data: rdpData } = await supabase
    .from('race_day_plans')
    .select('*')
    .eq('race_plan_id', plan.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const rdp = rdpData as RaceDayPlan | null;

  // No race-day plan yet — send the athlete to the setup page.
  if (!rdp) {
    redirect(`/brut-race/${plan.id}/race-day/setup`);
  }

  const daysToGo = daysFromTodayToIso(plan.race_date);
  const title =
    plan.race_name ?? `${SPORT_LABELS[plan.sport]} · ${plan.distance_km} km`;

  const startTimeShort = rdp.start_time ? rdp.start_time.slice(0, 5) : '—';
  const morning = rdp.race_morning;
  const during = rdp.during_race;
  const post = rdp.post_race;
  const week = rdp.pre_race_week ?? [];

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 md:px-10 pt-12 md:pt-16 pb-24 min-h-[70vh]">
        <Link
          href={`/brut-race/${plan.id}`}
          className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors"
        >
          &larr; Back to plan
        </Link>

        {/* Header */}
        <span className="mt-6 inline-block text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          Race day plan
        </span>
        <h1 className="mt-3 text-[44px] md:text-[64px] leading-[0.98] font-thin tracking-brut text-brut-black">
          {title}
        </h1>
        <p className="mt-3 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
          {formatLongDate(plan.race_date)} · Start {startTimeShort} · Expected{' '}
          {fmtTemp(rdp.expected_temperature_c)} · {fmtPct(rdp.expected_humidity_pct)}{' '}
          humidity
        </p>

        {/* Countdown banner */}
        <section className="mt-10 border border-brut-black p-8 md:p-10 text-center">
          <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
            Countdown
          </p>
          <p className="mt-2 text-[64px] md:text-[96px] leading-none font-thin tracking-brut text-brut-black tabular-nums">
            {daysToGo > 0 ? daysToGo : daysToGo === 0 ? 0 : '—'}
          </p>
          <p className="mt-2 text-xs font-semibold tracking-brut-wide uppercase text-brut-ink">
            {daysToGo > 1
              ? 'days to go'
              : daysToGo === 1
                ? 'day to go'
                : daysToGo === 0
                  ? 'Today is the day'
                  : 'Race day passed'}
          </p>
        </section>

        {/* 01 — Pre-race week */}
        <section className="mt-16 flex flex-col gap-6">
          <SectionHeader index="01" label="Pre-race week" />
          <div className="flex flex-col">
            {week.map((d) => (
              <div
                key={d.day}
                className="border-t border-brut-line first:border-t-0 py-5 flex flex-col gap-2"
              >
                <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted tabular-nums">
                  {DAY_KEY_LABEL[d.day]} · {FOCUS_LABEL[d.focus]} ·{' '}
                  {TRAINING_LABEL[d.training]} · {NUTRITION_LABEL[d.nutrition_focus]}
                </p>
                <p className="text-sm font-normal text-brut-ink leading-relaxed">
                  {d.notes}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 02 — Race morning */}
        <section className="mt-16 flex flex-col gap-6">
          <SectionHeader index="02" label="Race morning" />
          {morning ? (
            <ol className="flex flex-col">
              {[
                {
                  offset: `−${morning.wake_up_offset_hours}h 00m`,
                  label: 'Wake up',
                  detail: 'Calm start. Daylight, fluids, light movement.',
                },
                {
                  offset: `−${morning.meal_offset_hours.toString().replace('.', ':').padEnd(4, '0')}`,
                  label: `Pre-race meal · ${morning.meal_carbs_g} g carbs`,
                  detail: morning.meal_examples.join(' · '),
                },
                {
                  offset: '−1h 00m',
                  label: `${morning.hydration_pre_race_ml} ml water${morning.hydration_with_pinch_salt ? ' with a pinch of salt' : ''}`,
                  detail: 'Sip steadily, not gulp.',
                },
                {
                  offset: `−${morning.last_brut_capsule_offset_min} min`,
                  label: 'Last BRUT capsule',
                  detail: 'Top up sodium right before the gun.',
                },
                {
                  offset: '−15 min',
                  label: 'Warm-up',
                  detail: morning.warm_up_protocol,
                },
                {
                  offset: '0:00',
                  label: 'RACE START',
                  detail: 'Trust the plan.',
                },
              ].map((step, idx) => (
                <li
                  key={idx}
                  className="border-t border-brut-line first:border-t-0 py-5 grid grid-cols-[6rem_1fr] gap-4"
                >
                  <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted tabular-nums">
                    {step.offset}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-brut-black uppercase tracking-brut">
                      {step.label}
                    </p>
                    <p className="mt-1 text-sm font-normal text-brut-ink leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-brut-muted">
              Race morning plan unavailable.
            </p>
          )}
        </section>

        {/* 03 — During the race */}
        <section className="mt-16 flex flex-col gap-6">
          <SectionHeader index="03" label="During the race" />
          {during ? (
            <>
              <div className="grid grid-cols-1 gap-px bg-brut-line border border-brut-line">
                {during.segments.map((seg, idx) => (
                  <div key={idx} className="bg-white p-5 flex flex-col gap-3">
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted tabular-nums">
                        Km {seg.km_start} – {seg.km_end}
                      </span>
                      <span className="text-sm font-medium text-brut-black tabular-nums">
                        {seg.pace_target}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-ink">
                      {seg.effort}
                    </p>
                    <p className="text-sm font-normal text-brut-ink leading-relaxed">
                      {seg.cues}
                    </p>
                    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-normal text-brut-muted">
                      {seg.fueling.gels > 0 ? (
                        <li>
                          {seg.fueling.gels} gel
                          {seg.fueling.gels > 1 ? 's' : ''}
                          {seg.fueling.gel_at_km != null
                            ? ` @ km ${seg.fueling.gel_at_km}`
                            : ''}
                        </li>
                      ) : null}
                      <li>
                        {seg.fueling.water_ml} ml water @ km {seg.fueling.water_at_km}
                      </li>
                      {seg.fueling.brut_capsules > 0 ? (
                        <li>
                          {seg.fueling.brut_capsules} BRUT cap
                          {seg.fueling.brut_capsules > 1 ? 's' : ''}
                          {seg.fueling.brut_at_km != null
                            ? ` @ km ${seg.fueling.brut_at_km}`
                            : ''}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ))}
              </div>
              {during.notes ? (
                <p className="text-xs font-normal text-brut-muted leading-relaxed">
                  {during.notes}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-brut-muted">
              During-race plan unavailable.
            </p>
          )}
        </section>

        {/* 04 — Post-race recovery */}
        <section className="mt-16 flex flex-col gap-6">
          <SectionHeader index="04" label="Post-race recovery" />
          {post ? (
            <ol className="flex flex-col">
              <li className="border-t border-brut-line first:border-t-0 py-5 grid grid-cols-[6rem_1fr] gap-4">
                <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  0–60 min
                </span>
                <div>
                  <p className="text-sm font-medium text-brut-black uppercase tracking-brut">
                    Refuel window
                  </p>
                  <p className="mt-1 text-sm font-normal text-brut-ink leading-relaxed">
                    {post.immediate_60_min.protein_g} g protein ·{' '}
                    {post.immediate_60_min.carbs_g} g carbs ·{' '}
                    {post.immediate_60_min.water_ml} ml water ·{' '}
                    {post.immediate_60_min.brut_capsules} BRUT capsule
                  </p>
                  <p className="mt-2 text-xs font-normal text-brut-muted">
                    {post.immediate_60_min.examples.join(' · ')}
                  </p>
                </div>
              </li>
              {[
                ['Day of', post.day_of],
                ['Day +1', post.day_after],
                ['Day +2', post.day_2_after],
                ['Return', post.return_to_training],
              ].map(([label, text]) => (
                <li
                  key={label}
                  className="border-t border-brut-line py-5 grid grid-cols-[6rem_1fr] gap-4"
                >
                  <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                    {label}
                  </span>
                  <p className="text-sm font-normal text-brut-ink leading-relaxed">
                    {text}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-brut-muted">
              Post-race plan unavailable.
            </p>
          )}
        </section>

        {/* Actions */}
        <section className="mt-16 flex flex-wrap items-center gap-4 border-t border-brut-line pt-8">
          <Link
            href={`/brut-race/${plan.id}/race-day/setup`}
            className="inline-flex items-center justify-center px-6 py-3 border border-brut-black text-brut-black text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            Edit setup
          </Link>
          <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
            Print and mark complete arrive soon.
          </span>
        </section>
      </main>

      <Footer />
    </>
  );
}
