'use client';

import { useTranslations } from 'next-intl';
import type {
  ReplacementLevel,
  SessionPlan,
} from '@/lib/calculations/types';
import SessionTable from './SessionTable';

interface Props {
  plan: SessionPlan;
}

function SectionHeader({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline justify-between pb-3 border-b border-brut-line">
      <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted tabular-nums">
        {index}
      </span>
      <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-ink">
        {label}
      </span>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
        {label}
      </span>
      <span className="text-2xl font-thin tracking-brut text-brut-black tabular-nums">
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-normal text-brut-muted">
            {unit}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export default function SessionResult({ plan }: Props) {
  const tR = useTranslations('brut_train.result');
  const tLevels = useTranslations('brut_train.replacement_levels');
  const tUnits = useTranslations('common.units');

  return (
    <div id="results" className="flex flex-col gap-10">
      {/* Replacement need banner */}
      <section className="border border-brut-line p-6 md:p-7">
        <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
          {tR('replacement_need')}
        </span>
        <p className="mt-2 text-[42px] font-normal tracking-[0.02em] text-brut-black uppercase leading-[1.05]">
          {tLevels(plan.replacementLevel as ReplacementLevel)}
        </p>
        <p className="mt-4 text-sm font-normal text-brut-ink leading-[1.5]">
          {plan.replacementMessage}
        </p>
      </section>

      {/* Key metrics */}
      <section className="grid grid-cols-2 gap-x-5 gap-y-6">
        <Metric
          label={tR('sweat_rate')}
          value={plan.sweatRate.toFixed(2)}
          unit={tUnits('L_per_h')}
        />
        <Metric
          label={tR('total_loss')}
          value={plan.totalLoss.toFixed(2)}
          unit={tUnits('L')}
        />
        <Metric
          label={tR('dehydration')}
          value={`${plan.dehydrationPct.toFixed(1)}`}
          unit="% BW"
        />
        <Metric
          label={tR('sodium_lost')}
          value={`${Math.round(plan.sodiumTotalMg)}`}
          unit={tUnits('mg')}
        />
        {plan.pace ? (
          <div className="col-span-2">
            <Metric label={plan.pace.label} value={plan.pace.value} />
          </div>
        ) : null}
      </section>

      {/* Session structure */}
      <section className="flex flex-col gap-5">
        <SectionHeader index="01" label={tR('session_structure')} />
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              {tR('warm_up')} · {plan.structure.warmup.minutes} {tUnits('min')}
            </p>
            <p className="mt-1 text-sm text-brut-ink leading-relaxed">
              {plan.structure.warmup.description}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              {tR('main_set')} · {plan.structure.mainSet.minutes} {tUnits('min')}
            </p>
            <p className="mt-1 text-sm text-brut-ink leading-relaxed">
              {plan.structure.mainSet.description}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              {tR('cool_down')} · {plan.structure.cooldown.minutes} {tUnits('min')}
            </p>
            <p className="mt-1 text-sm text-brut-ink leading-relaxed">
              {plan.structure.cooldown.description}
            </p>
          </div>
        </div>
      </section>

      {/* Pre-session */}
      <section className="flex flex-col gap-5">
        <SectionHeader index="02" label={tR('pre_session')} />
        <div className="flex flex-col gap-4">
          <p className="text-sm text-brut-ink leading-relaxed">
            {plan.preSession.food}
          </p>
          <p className="text-sm text-brut-muted leading-relaxed">
            {plan.preSession.hydration}
          </p>
        </div>
      </section>

      {/* During session */}
      <section className="flex flex-col gap-5">
        <SectionHeader index="03" label={tR('during_session')} />
        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          <Metric
            label={tR('carb_target')}
            value={plan.carbsPerHour > 0 ? String(plan.carbsPerHour) : '—'}
            unit={plan.carbsPerHour > 0 ? tUnits('g_per_h') : undefined}
          />
          <Metric
            label={tR('brut_target')}
            value={String(plan.capsulesPerHour)}
            unit={tUnits('caps_per_h')}
          />
        </div>
        <SessionTable rows={plan.schedule} />
      </section>

      {/* Post-session */}
      <section className="flex flex-col gap-5">
        <SectionHeader index="04" label={tR('post_session')} />
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
          <div className="col-span-1">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              {tR('protein')}
            </dt>
            <dd className="text-brut-ink">{plan.postSession.proteinGrams}</dd>
          </div>
          <div className="col-span-1">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              {tR('carbs')}
            </dt>
            <dd className="text-brut-ink">{plan.postSession.carbsGrams}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              {tR('water')}
            </dt>
            <dd className="text-brut-ink">{plan.postSession.waterMl}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              {tR('brut')}
            </dt>
            <dd className="text-brut-ink">
              {tR('post_session_brut_note', { count: plan.postSession.capsules })}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-brut-muted leading-relaxed">
          {plan.postSession.exampleMeal}
        </p>
      </section>

      {/* Totals + CTA */}
      <section className="bg-brut-black text-white p-5">
        <SectionHeader index="05" label={tR('totals')} />
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div>
            <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
              {tR('brut')}
            </p>
            <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
              {plan.totals.capsules}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
              {tR('water')}
            </p>
            <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
              {plan.totals.waterMl}
              <span className="ml-1 text-xs font-normal text-white/60">
                {tUnits('ml')}
              </span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
              {tR('carbs')}
            </p>
            <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
              {plan.totals.carbsG}
              <span className="ml-1 text-xs font-normal text-white/60">
                {tUnits('g')}
              </span>
            </p>
          </div>
        </div>
        <a
          href="https://brutfuel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-white pb-1 hover:opacity-70 transition-opacity"
        >
          {tR('buy_cta')}
        </a>
      </section>

      <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
        {tR('references')}
      </p>
    </div>
  );
}

export { SectionHeader };
