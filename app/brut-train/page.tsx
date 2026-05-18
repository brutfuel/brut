'use client';

import { useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SessionForm from '@/components/brut-train/SessionForm';
import SessionResult from '@/components/brut-train/SessionResult';
import { DEFAULT_INPUT, buildPlan } from '@/lib/calculations/plan';
import type { SessionInput } from '@/lib/calculations/types';

export default function BrutTrainPage() {
  const [input, setInput] = useState<SessionInput>(DEFAULT_INPUT);

  // Plan is fully deterministic — memo by input identity.
  const plan = useMemo(() => buildPlan(input), [input]);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-20">
        {/* Page header */}
        <section className="mb-12 md:mb-16">
          <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
            01 — Session
          </span>
          <h1 className="mt-6 text-[56px] md:text-[88px] leading-[0.95] font-thin tracking-brut text-brut-black">
            BRUT TRAIN
          </h1>
          <p className="mt-6 max-w-xl text-base md:text-lg font-normal text-brut-ink leading-relaxed">
            Configure your next session and get a complete structure, fuelling
            schedule and replacement target.
          </p>
        </section>

        {/* Form (1fr) + Results (380 px sticky) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-16">
          <div>
            <SessionForm value={input} onChange={setInput} />
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pl-1 lg:pr-1">
            <SessionResult plan={plan} />
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
