'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  MarkDoneModal,
  RescheduleModal,
  SkipModal,
} from '@/components/brut-race/SessionModals';
import { formatDuration, WEEKDAY_LABELS } from '@/lib/utils/dates';
import { SESSION_TYPE_LABELS } from '@/lib/types/db';
import type { Phase, Session } from '@/lib/types/db';

interface Props {
  planId: string;
  weeksTotal: number;
  phases: Phase[];
  sessions: Session[];
}

const PHASE_LABELS: Record<Phase['name'], string> = {
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  taper: 'Taper',
};

type ModalKind = 'mark' | 'skip' | 'reschedule';

interface SessionRowProps {
  session: Session;
  planId: string;
  onAction: (kind: ModalKind, session: Session) => void;
}

function SessionRow({ session, planId, onAction }: SessionRowProps) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isCompleted = session.status === 'completed';
  const isSkipped = session.status === 'skipped';
  const canAct = !isCompleted && !isSkipped;
  const { structure } = session;

  const labelClass = `flex-1 text-sm ${
    isCompleted
      ? 'font-normal text-brut-muted line-through'
      : isSkipped
        ? 'font-normal text-brut-muted'
        : 'font-medium text-brut-black'
  }`;

  return (
    <div
      className={`border-t border-brut-line first:border-t-0 ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className="w-10 shrink-0 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
            {WEEKDAY_LABELS[session.day_of_week - 1]}
          </span>
          <span className={labelClass}>
            {SESSION_TYPE_LABELS[session.session_type]}
          </span>
          <span className="hidden sm:inline text-sm font-normal text-brut-ink tabular-nums">
            {formatDuration(session.duration_minutes)}
          </span>
          <span className="hidden md:inline w-28 shrink-0 text-right text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
            {session.target_zone ?? '—'}
          </span>
        </button>

        {isCompleted ? (
          <span
            aria-label="Completed"
            className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-black"
          >
            ✓
          </span>
        ) : null}
        {isSkipped ? (
          <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted border border-brut-line px-2 py-0.5">
            Skipped
          </span>
        ) : null}

        {canAct ? (
          <>
            <button
              type="button"
              onClick={() => onAction('mark', session)}
              className="hidden sm:inline-flex px-3 py-1.5 text-[10px] font-semibold tracking-brut-wide uppercase border border-brut-black text-brut-black hover:bg-brut-black hover:text-white transition-colors"
            >
              Mark done
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="w-7 h-7 text-brut-muted hover:text-brut-black transition-colors text-base leading-none"
                aria-label="Session actions"
              >
                ⋯
              </button>
              {menuOpen ? (
                <>
                  <button
                    type="button"
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-40 mt-1 w-40 border border-brut-line bg-white"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onAction('mark', session);
                      }}
                      className="block w-full text-left px-4 py-3 text-[10px] font-medium tracking-brut-wide uppercase text-brut-ink hover:bg-brut-bg-soft transition-colors sm:hidden"
                    >
                      Mark done
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onAction('reschedule', session);
                      }}
                      className="block w-full text-left px-4 py-3 text-[10px] font-medium tracking-brut-wide uppercase text-brut-ink hover:bg-brut-bg-soft transition-colors border-t border-brut-line first:border-t-0"
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onAction('skip', session);
                      }}
                      className="block w-full text-left px-4 py-3 text-[10px] font-medium tracking-brut-wide uppercase text-brut-ink hover:bg-brut-bg-soft transition-colors border-t border-brut-line"
                    >
                      Skip
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}

        <span className="w-4 shrink-0 text-right text-brut-muted">
          {open ? '−' : '+'}
        </span>
      </div>

      {open ? (
        <div className="pb-6 pl-14 pr-2 flex flex-col gap-5">
          {structure ? (
            <div className="flex flex-col gap-3">
              {(['warmup', 'mainSet', 'cooldown'] as const).map((key) => {
                const block = structure[key];
                const label =
                  key === 'warmup'
                    ? 'Warm-up'
                    : key === 'mainSet'
                      ? 'Main set'
                      : 'Cool-down';
                return (
                  <div key={key}>
                    <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                      {label} · {block.minutes} min
                    </p>
                    <p className="mt-1 text-sm font-normal text-brut-ink leading-relaxed">
                      {block.description}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="border-t border-brut-line pt-4 flex flex-col gap-3">
            <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              Fuelling
            </p>
            {session.pre_session_nutrition ? (
              <p className="text-sm font-normal text-brut-ink leading-relaxed">
                <span className="text-brut-muted">Before — </span>
                {session.pre_session_nutrition.food}
              </p>
            ) : null}
            {session.during_nutrition ? (
              <p className="text-sm font-normal text-brut-ink leading-relaxed">
                <span className="text-brut-muted">During — </span>
                {session.during_nutrition.carbsPerHour} g carbs/h ·{' '}
                {session.during_nutrition.capsulesPerHour} BRUT caps/h ·{' '}
                {session.during_nutrition.totals.waterMl} ml water total
              </p>
            ) : null}
            {session.post_session_nutrition ? (
              <p className="text-sm font-normal text-brut-ink leading-relaxed">
                <span className="text-brut-muted">After — </span>
                {session.post_session_nutrition.proteinGrams} protein ·{' '}
                {session.post_session_nutrition.carbsGrams} carbs ·{' '}
                {session.post_session_nutrition.waterMl} fluid
              </p>
            ) : null}
          </div>

          {(isCompleted || isSkipped) && session.user_notes ? (
            <div className="border-t border-brut-line pt-4">
              <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                Your notes
              </p>
              <p className="mt-1 text-sm font-normal text-brut-ink leading-relaxed">
                {session.user_notes}
              </p>
            </div>
          ) : null}

          <Link
            href={`/brut-race/${planId}/session/${session.id}?week=${session.week_number}`}
            className="inline-block text-[10px] font-semibold tracking-brut-wide uppercase border-b border-brut-black pb-0.5 self-start hover:opacity-60 transition-opacity"
          >
            Open session detail &rarr;
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function PlanWeekBrowser({
  planId,
  weeksTotal,
  phases,
  sessions,
}: Props) {
  const searchParams = useSearchParams();
  const initialWeek = Math.max(
    1,
    Math.min(weeksTotal, Number(searchParams.get('week')) || 1),
  );
  const [currentWeek, setCurrentWeek] = useState(initialWeek);
  const [modal, setModal] = useState<{
    kind: ModalKind;
    session: Session;
  } | null>(null);

  const peakWeek = useMemo(() => {
    const taper = phases.find((p) => p.name === 'taper');
    return (taper ? taper.week_start : weeksTotal + 1) - 1;
  }, [phases, weeksTotal]);

  const sessionsByWeek = useMemo(() => {
    const map = new Map<number, Session[]>();
    for (const s of sessions) {
      const list = map.get(s.week_number) ?? [];
      list.push(s);
      map.set(s.week_number, list);
    }
    return map;
  }, [sessions]);

  const isRecovery = (week: number): boolean =>
    week > 1 && week % 4 === 0 && week !== peakWeek && week <= peakWeek;

  const phaseForWeek = (week: number): Phase | undefined =>
    phases.find((p) => week >= p.week_start && week <= p.week_end);

  const weekSessions = sessionsByWeek.get(currentWeek) ?? [];
  const weekPhase = phaseForWeek(currentWeek);
  const weekMinutes = weekSessions.reduce(
    (sum, s) => sum + s.duration_minutes,
    0,
  );
  const completed = weekSessions.filter((s) => s.status === 'completed').length;
  const skipped = weekSessions.filter((s) => s.status === 'skipped').length;
  const total = weekSessions.length;
  const progressPct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const recovery = isRecovery(currentWeek);

  function openModal(kind: ModalKind, session: Session) {
    setModal({ kind, session });
  }
  function closeModal() {
    setModal(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Week scrubber */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {Array.from({ length: weeksTotal }, (_, i) => i + 1).map((week) => {
          const active = week === currentWeek;
          return (
            <button
              key={week}
              type="button"
              onClick={() => setCurrentWeek(week)}
              aria-current={active ? 'true' : undefined}
              className={`h-9 w-9 shrink-0 text-[10px] font-semibold tabular-nums border transition-colors ${
                active
                  ? 'bg-brut-black text-white border-brut-black'
                  : 'bg-white text-brut-ink border-brut-line hover:bg-brut-bg-soft'
              }`}
            >
              {String(week).padStart(2, '0')}
            </button>
          );
        })}
      </div>

      {/* Week navigation + header */}
      <div className="flex items-center justify-between border-b border-brut-line pb-4">
        <button
          type="button"
          onClick={() => setCurrentWeek((w) => Math.max(1, w - 1))}
          disabled={currentWeek === 1}
          className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-ink hover:text-brut-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          &larr; Prev
        </button>
        <div className="flex items-baseline gap-3 flex-wrap justify-center">
          <span className="text-sm font-medium tracking-brut-wide uppercase text-brut-black tabular-nums">
            Week {String(currentWeek).padStart(2, '0')} / {weeksTotal}
          </span>
          {weekPhase ? (
            <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
              {PHASE_LABELS[weekPhase.name]}
            </span>
          ) : null}
          {recovery ? (
            <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-black border border-brut-black px-2 py-0.5">
              Recovery
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setCurrentWeek((w) => Math.min(weeksTotal, w + 1))}
          disabled={currentWeek === weeksTotal}
          className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-ink hover:text-brut-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next &rarr;
        </button>
      </div>

      {/* Week progress + volume */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
            {completed} of {total} sessions completed
            {skipped > 0 ? ` · ${skipped} skipped` : ''}
          </span>
          <span className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted tabular-nums">
            {formatDuration(weekMinutes)} planned
          </span>
        </div>
        <div className="h-px bg-brut-line relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-brut-black"
            style={{ width: `${progressPct}%` }}
            aria-hidden
          />
        </div>
      </div>

      {/* Day rows */}
      <div className="flex flex-col">
        {WEEKDAY_LABELS.map((label, index) => {
          const day = index + 1;
          const session = weekSessions.find((s) => s.day_of_week === day);
          if (session) {
            return (
              <SessionRow
                key={session.id}
                session={session}
                planId={planId}
                onAction={openModal}
              />
            );
          }
          return (
            <div
              key={day}
              className="border-t border-brut-line first:border-t-0 flex items-center gap-4 py-4"
            >
              <span className="w-10 shrink-0 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
                {label}
              </span>
              <span className="flex-1 text-sm font-normal text-brut-muted">
                Rest
              </span>
            </div>
          );
        })}
      </div>

      {modal?.kind === 'mark' ? (
        <MarkDoneModal
          open
          onClose={closeModal}
          session={modal.session}
          onSaved={closeModal}
        />
      ) : null}
      {modal?.kind === 'skip' ? (
        <SkipModal
          open
          onClose={closeModal}
          session={modal.session}
          onSaved={closeModal}
        />
      ) : null}
      {modal?.kind === 'reschedule' ? (
        <RescheduleModal
          open
          onClose={closeModal}
          session={modal.session}
          onSaved={closeModal}
        />
      ) : null}
    </div>
  );
}
