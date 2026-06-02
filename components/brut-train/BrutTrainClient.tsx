'use client';

import { useMemo, useState } from 'react';
import SessionForm from '@/components/brut-train/SessionForm';
import SessionResult from '@/components/brut-train/SessionResult';
import { buildPlan } from '@/lib/calculations/plan';
import type { SessionInput } from '@/lib/calculations/types';

interface Props {
  /** Starting form values — pre-filled from the user's profile when signed in. */
  initialInput: SessionInput;
}

/**
 * Interactive client wrapper for the BRUT TRAIN form + result panel.
 * Kept narrow so the page itself can stay a Server Component and feed
 * profile-derived defaults to this component.
 */
export default function BrutTrainClient({ initialInput }: Props) {
  const [input, setInput] = useState<SessionInput>(initialInput);

  // Plan is fully deterministic — memo by input identity.
  const plan = useMemo(() => buildPlan(input), [input]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-16">
      <div>
        <SessionForm value={input} onChange={setInput} />
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pl-1 lg:pr-1">
        <SessionResult plan={plan} />
      </aside>
    </div>
  );
}
