import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SectionHeader } from '@/components/brut-train/SessionResult';
import { Link } from '@/lib/i18n/routing';
import type { AppLocale } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { daysFromTodayToIso, formatLongDate } from '@/lib/utils/dates';
import type { RaceDayPlan, RacePlan } from '@/lib/types/db';

interface Props {
  params: { planId: string };
}

function fmtPct(n: number | null | undefined): string {
  return n == null ? '—' : `${n}%`;
}

function fmtTemp(n: number | null | undefined): string {
  return n == null ? '—' : `${n}°C`;
}

export default async function RaceDayPlanPage({ params }: Props) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('brut_race.race_day_view');
  const tDay = await getTranslations('brut_race.race_day_view.day_keys');
  const tFocus = await getTranslations('brut_race.race_day_view.focus');
  const tTraining = await getTranslations('brut_race.race_day_view.training');
  const tNutFocus = await getTranslations(
    'brut_race.race_day_view.nutrition_focus',
  );
  const tSports = await getTranslations('sports');
  const tUnits = await getTranslations('common.units');

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

  if (!rdp) {
    redirect(`/brut-race/${plan.id}/race-day/setup`);
  }

  const daysToGo = daysFromTodayToIso(plan.race_date);
  const title =
    plan.race_name ?? `${tSports(plan.sport)} · ${plan.distance_km} km`;

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
          {t('back_to_plan')}
        </Link>

        {/* Header */}
        <span className="mt-6 inline-block text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          {t('eyebrow')}
        </span>
        <h1 className="mt-3 text-[44px] md:text-[64px] leading-[0.98] font-thin tracking-brut text-brut-black">
          {title}
        </h1>
        <p className="mt-3 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
          {formatLongDate(plan.race_date, locale)} ·{' '}
          {t('meta_start', { time: startTimeShort })} ·{' '}
          {t('meta_expected_prefix')}
          {fmtTemp(rdp.expected_temperature_c)} ·{' '}
          {fmtPct(rdp.expected_humidity_pct)}
          {t('meta_humidity_suffix')}
        </p>

        {/* Countdown banner */}
        <section className="mt-10 border border-brut-black p-8 md:p-10 text-center">
          <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
            {t('countdown')}
          </p>
          <p className="mt-2 text-[64px] md:text-[96px] leading-none font-thin tracking-brut text-brut-black tabular-nums">
            {daysToGo > 0 ? daysToGo : daysToGo === 0 ? 0 : '—'}
          </p>
          <p className="mt-2 text-xs font-semibold tracking-brut-wide uppercase text-brut-ink">
            {daysToGo > 1
              ? t('days_to_go')
              : daysToGo === 1
                ? t('day_to_go')
                : daysToGo === 0
                  ? t('today_is_the_day')
                  : t('race_day_passed')}
          </p>
        </section>

        {/* 01 — Pre-race week */}
        <section className="mt-16 flex flex-col gap-6">
          <SectionHeader index="01" label={t('section_pre_week')} />
          <div className="flex flex-col">
            {week.map((d) => (
              <div
                key={d.day}
                className="border-t border-brut-line first:border-t-0 py-5 flex flex-col gap-2"
              >
                <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted tabular-nums">
                  {tDay(d.day)} · {tFocus(d.focus)} ·{' '}
                  {tTraining(d.training)} · {tNutFocus(d.nutrition_focus)}
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
          <SectionHeader index="02" label={t('section_morning')} />
          {morning ? (
            <ol className="flex flex-col">
              {[
                {
                  offset: `−${morning.wake_up_offset_hours}h 00m`,
                  label: t('morning_wake_up'),
                  detail: t('morning_wake_up_detail'),
                },
                {
                  offset: `−${morning.meal_offset_hours
                    .toString()
                    .replace('.', ':')
                    .padEnd(4, '0')}`,
                  label: t('morning_meal', { carbs: morning.meal_carbs_g }),
                  detail: morning.meal_examples.join(' · '),
                },
                {
                  offset: '−1h 00m',
                  label: t('morning_water', {
                    ml: morning.hydration_pre_race_ml,
                    salt: morning.hydration_with_pinch_salt
                      ? 'true'
                      : 'false',
                  }),
                  detail: t('morning_water_detail'),
                },
                {
                  offset: `−${morning.last_brut_capsule_offset_min} ${tUnits(
                    'min',
                  )}`,
                  label: t('morning_last_brut'),
                  detail: t('morning_last_brut_detail'),
                },
                {
                  offset: `−15 ${tUnits('min')}`,
                  label: t('morning_warm_up'),
                  detail: morning.warm_up_protocol,
                },
                {
                  offset: '0:00',
                  label: t('morning_race_start'),
                  detail: t('morning_race_start_detail'),
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
            <p className="text-sm text-brut-muted">{t('morning_unavailable')}</p>
          )}
        </section>

        {/* 03 — During the race */}
        <section className="mt-16 flex flex-col gap-6">
          <SectionHeader index="03" label={t('section_during')} />
          {during ? (
            <>
              <div className="grid grid-cols-1 gap-px bg-brut-line border border-brut-line">
                {during.segments.map((seg, idx) => (
                  <div key={idx} className="bg-white p-5 flex flex-col gap-3">
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted tabular-nums">
                        {t('km_range', {
                          start: seg.km_start,
                          end: seg.km_end,
                        })}
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
                          {seg.fueling.gels === 1
                            ? t('fueling_gel_one', { count: seg.fueling.gels })
                            : t('fueling_gel_other', {
                                count: seg.fueling.gels,
                              })}
                          {seg.fueling.gel_at_km != null
                            ? t('fueling_gel_at', { at: seg.fueling.gel_at_km })
                            : ''}
                        </li>
                      ) : null}
                      <li>
                        {t('fueling_water', {
                          ml: seg.fueling.water_ml,
                          at: seg.fueling.water_at_km,
                        })}
                      </li>
                      {seg.fueling.brut_capsules > 0 ? (
                        <li>
                          {seg.fueling.brut_capsules === 1
                            ? t('fueling_brut_one', {
                                count: seg.fueling.brut_capsules,
                              })
                            : t('fueling_brut_other', {
                                count: seg.fueling.brut_capsules,
                              })}
                          {seg.fueling.brut_at_km != null
                            ? t('fueling_brut_at', {
                                at: seg.fueling.brut_at_km,
                              })
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
            <p className="text-sm text-brut-muted">{t('during_unavailable')}</p>
          )}
        </section>

        {/* 04 — Post-race recovery */}
        <section className="mt-16 flex flex-col gap-6">
          <SectionHeader index="04" label={t('section_post')} />
          {post ? (
            <ol className="flex flex-col">
              <li className="border-t border-brut-line first:border-t-0 py-5 grid grid-cols-[6rem_1fr] gap-4">
                <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                  0–60 {tUnits('min')}
                </span>
                <div>
                  <p className="text-sm font-medium text-brut-black uppercase tracking-brut">
                    {t('refuel_window')}
                  </p>
                  <p className="mt-1 text-sm font-normal text-brut-ink leading-relaxed">
                    {t('refuel_summary', {
                      protein: post.immediate_60_min.protein_g,
                      carbs: post.immediate_60_min.carbs_g,
                      water: post.immediate_60_min.water_ml,
                      count: post.immediate_60_min.brut_capsules,
                    })}
                  </p>
                  <p className="mt-2 text-xs font-normal text-brut-muted">
                    {post.immediate_60_min.examples.join(' · ')}
                  </p>
                </div>
              </li>
              {(
                [
                  [t('post_day_of'), post.day_of],
                  [t('post_day_plus_1'), post.day_after],
                  [t('post_day_plus_2'), post.day_2_after],
                  [t('post_return'), post.return_to_training],
                ] as Array<[string, string]>
              ).map(([label, text]) => (
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
            <p className="text-sm text-brut-muted">{t('post_unavailable')}</p>
          )}
        </section>

        {/* Actions */}
        <section className="mt-16 flex flex-wrap items-center gap-4 border-t border-brut-line pt-8">
          <Link
            href={`/brut-race/${plan.id}/race-day/setup`}
            className="inline-flex items-center justify-center px-6 py-3 border border-brut-black text-brut-black text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            {t('edit_setup')}
          </Link>
          <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
            {t('actions_coming_note')}
          </span>
        </section>
      </main>

      <Footer />
    </>
  );
}
