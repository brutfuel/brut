'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import SessionForm from '@/components/brut-train/SessionForm';
import SessionResult from '@/components/brut-train/SessionResult';
import { buildPlan } from '@/lib/calculations/plan';
import type { SessionInput } from '@/lib/calculations/types';

interface Props {
  /** Starting form values — pre-filled from the user's profile when signed in. */
  initialInput: SessionInput;
}

function EmptyPlaceholder() {
  const t = useTranslations('brut_train');
  return (
    <section className="border border-brut-line p-6 md:p-7 flex flex-col gap-3">
      <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
        {t('empty_placeholder_eyebrow')}
      </span>
      <p className="text-2xl font-thin tracking-brut text-brut-black">
        {t('empty_placeholder_title')}
      </p>
      <p className="text-sm font-normal text-brut-ink leading-relaxed">
        {t.rich('empty_placeholder_body', {
          b: (chunks) => (
            <span className="font-medium text-brut-black">{chunks}</span>
          ),
        })}
      </p>
    </section>
  );
}

function OutdatedBanner() {
  const t = useTranslations('brut_train');
  return (
    <div className="mb-6 border border-brut-line bg-brut-bg-soft px-5 py-3">
      <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-black">
        {t('outdated_banner')}
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
  const t = useTranslations('brut_train');
  const [input, setInput] = useState<SessionInput>(initialInput);
  const [committedInput, setCommittedInput] = useState<SessionInput | null>(
    null,
  );
  const resultRef = useRef<HTMLElement>(null);

  const tCalc = useTranslations('calc');
  const plan = useMemo(
    () => (committedInput ? buildPlan(committedInput, tCalc) : null),
    [committedInput, tCalc],
  );

  const hasResult = committedInput !== null;
  const isOutdated =
    hasResult &&
    JSON.stringify(input) !== JSON.stringify(committedInput);

  const submitLabel = !hasResult
    ? t('submit_calculate')
    : isOutdated
      ? t('submit_recalculate')
      : t('submit_up_to_date');
  const submitDisabled = hasResult && !isOutdated;

  function commit() {
    setCommittedInput(input);
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
