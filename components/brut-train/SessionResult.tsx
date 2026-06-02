import type {
  ReplacementLevel,
  SessionPlan,
} from '@/lib/calculations/types';
import SessionTable from './SessionTable';

interface Props {
  plan: SessionPlan;
}

// Hairline + uppercase label used as section header inside the result panel.
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

const LEVEL_COPY: Record<ReplacementLevel, string> = {
  'not-necessary': 'Not necessary',
  optional: 'Optional',
  recommended: 'Recommended',
  essential: 'Essential',
};

export default function SessionResult({ plan }: Props) {
  return (
    <div id="results" className="flex flex-col gap-10">
      {/* Replacement need banner */}
      <section className="border border-brut-line p-6 md:p-7">
        <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
          Replacement need
        </span>
        <p className="mt-2 text-[42px] font-normal tracking-[0.02em] text-brut-black uppercase leading-[1.05]">
          {LEVEL_COPY[plan.replacementLevel]}
        </p>
        <p className="mt-4 text-sm font-normal text-brut-ink leading-[1.5]">
          {plan.replacementMessage}
        </p>
      </section>

      {/* Key metrics */}
      <section className="grid grid-cols-2 gap-x-5 gap-y-6">
        <Metric
          label="Sweat rate"
          value={plan.sweatRate.toFixed(2)}
          unit="L / h"
        />
        <Metric
          label="Total loss"
          value={plan.totalLoss.toFixed(2)}
          unit="L"
        />
        <Metric
          label="Dehydration"
          value={`${plan.dehydrationPct.toFixed(1)}`}
          unit="% BW"
        />
        <Metric
          label="Sodium lost"
          value={`${Math.round(plan.sodiumTotalMg)}`}
          unit="mg"
        />
        {plan.pace ? (
          <div className="col-span-2">
            <Metric label={plan.pace.label} value={plan.pace.value} />
          </div>
        ) : null}
      </section>

      {/* Session structure */}
      <section className="flex flex-col gap-5">
        <SectionHeader index="01" label="Session structure" />
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              Warm-up · {plan.structure.warmup.minutes} min
            </p>
            <p className="mt-1 text-sm text-brut-ink leading-relaxed">
              {plan.structure.warmup.description}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              Main set · {plan.structure.mainSet.minutes} min
            </p>
            <p className="mt-1 text-sm text-brut-ink leading-relaxed">
              {plan.structure.mainSet.description}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              Cool-down · {plan.structure.cooldown.minutes} min
            </p>
            <p className="mt-1 text-sm text-brut-ink leading-relaxed">
              {plan.structure.cooldown.description}
            </p>
          </div>
        </div>
      </section>

      {/* Pre-session */}
      <section className="flex flex-col gap-5">
        <SectionHeader index="02" label="Pre-session" />
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
        <SectionHeader index="03" label="During session" />
        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          <Metric
            label="Carb target"
            value={plan.carbsPerHour > 0 ? String(plan.carbsPerHour) : '—'}
            unit={plan.carbsPerHour > 0 ? 'g / h' : undefined}
          />
          <Metric
            label="BRUT target"
            value={String(plan.capsulesPerHour)}
            unit="caps / h"
          />
        </div>
        <SessionTable rows={plan.schedule} />
      </section>

      {/* Post-session */}
      <section className="flex flex-col gap-5">
        <SectionHeader index="04" label="Post-session" />
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
          <div className="col-span-1">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              Protein
            </dt>
            <dd className="text-brut-ink">{plan.postSession.proteinGrams}</dd>
          </div>
          <div className="col-span-1">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              Carbs
            </dt>
            <dd className="text-brut-ink">{plan.postSession.carbsGrams}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              Water
            </dt>
            <dd className="text-brut-ink">{plan.postSession.waterMl}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              BRUT
            </dt>
            <dd className="text-brut-ink">
              {plan.postSession.capsules} capsule with an electrolyte-rich
              snack.
            </dd>
          </div>
        </dl>
        <p className="text-sm text-brut-muted leading-relaxed">
          {plan.postSession.exampleMeal}
        </p>
      </section>

      {/* Totals + CTA */}
      <section className="bg-brut-black text-white p-5">
        <SectionHeader index="05" label="Totals" />
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div>
            <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
              BRUT
            </p>
            <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
              {plan.totals.capsules}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
              Water
            </p>
            <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
              {plan.totals.waterMl}
              <span className="ml-1 text-xs font-normal text-white/60">ml</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium tracking-brut-wide uppercase text-white/60">
              Carbs
            </p>
            <p className="mt-1 text-3xl font-thin tracking-brut tabular-nums">
              {plan.totals.carbsG}
              <span className="ml-1 text-xs font-normal text-white/60">g</span>
            </p>
          </div>
        </div>
        <a
          href="https://brutfuel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-white pb-1 hover:opacity-70 transition-opacity"
        >
          Buy at brutfuel.com →
        </a>
      </section>

      {/* Footer note overriding any leftover styling */}
      <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
        References: Baker LB 2017 · Barnes et al. 2019
      </p>
    </div>
  );
}

// Re-export header so it can be reused if needed elsewhere.
export { SectionHeader };
