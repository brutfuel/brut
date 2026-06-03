'use client';

import { useMemo, useRef, useState } from 'react';
import SessionForm from '@/components/brut-train/SessionForm';
import SessionResult from '@/components/brut-train/SessionResult';
import { buildPlan } from '@/lib/calculations/plan';
import type { SessionInput } from '@/lib/calculations/types';

interface Props {
  /** Starting form values — pre-filled from the user's profile when signed in. */
  initialInput: SessionInput;
}

// Editorial placeholder shown in the result panel before the first
// explicit Calculate click.
function EmptyPlaceholder() {
  return (
    <section className="border border-brut-line p-6 md:p-7 flex flex-col gap-3">
      <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
        Plan
      </span>
      <p className="text-2xl font-thin tracking-brut text-brut-black">
        Configure your session
      </p>
      <p className="text-sm font-normal text-brut-ink leading-relaxed">
        Fill in the form on the left, then press{' '}
        <span className="font-medium text-brut-black">Calculate</span> to see
        your fuelling plan.
      </p>
    </section>
  );
}

// Hairline banner shown above the result panel when the inputs have
// drifted from the last calculation.
function OutdatedBanner() {
  return (
    <div className="mb-6 border border-brut-line bg-brut-bg-soft px-5 py-3">
      <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-black">
        Outdated · Recalculate to refresh
      </span>
    </div>
  );
}

/**
 * Interactive client wrapper for the BRUT TRAIN form + result panel.
 * The result is only computed after the athlete explicitly presses
 * Calculate; any subsequent edit to the form marks the result as
 * outdated until the next Calculate.
 */
export default function BrutTrainClient({ initialInput }: Props) {
  const [input, setInput] = useState<SessionInput>(initialInput);
  const [committedInput, setCommittedInput] = useState<SessionInput | null>(
    null,
  );
  const resultRef = useRef<HTMLElement>(null);

  const plan = useMemo(
    () => (committedInput ? buildPlan(committedInput) : null),
    [committedInput],
  );

  const hasResult = committedInput !== null;
  const isOutdated =
    hasResult &&
    JSON.stringify(input) !== JSON.stringify(committedInput);

  const submitLabel = !hasResult
    ? 'Calculate'
    : isOutdated
      ? 'Recalculate'
      : 'Up to date';
  const submitDisabled = hasResult && !isOutdated;

  function commit() {
    setCommittedInput(input);
    // On mobile the result panel sits below the form — bring it into
    // view so the athlete sees the freshly-rendered plan. No-op on
    // desktop where the aside is already sticky-right.
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-16">
      <div>
        <SessionForm
          value={input}
          onChange={setInput}
          onSubmit={commit}
          submitLabel={submitLabel}
          submitDisabled={submitDisabled}
        />
      </div>

      <aside
        ref={resultRef}
        className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pl-1 lg:pr-1"
      >
        {!hasResult || !plan ? (
          <EmptyPlaceholder />
        ) : (
          <>
            {isOutdated ? <OutdatedBanner /> : null}
            <div className={isOutdated ? 'opacity-50' : ''}>
              <SessionResult plan={plan} />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
