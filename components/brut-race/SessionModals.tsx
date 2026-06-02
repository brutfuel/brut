'use client';

import { useMemo, useState, useTransition } from 'react';
import Modal from '@/components/ui/Modal';
import {
  markSessionDone,
  rescheduleSession,
  skipSession,
} from '@/app/brut-race/actions';
import { dayOfWeekFromIso, weekBoundsFromIso } from '@/lib/utils/dates';
import type { Session, SessionFelt } from '@/lib/types/db';

interface BaseProps {
  open: boolean;
  onClose: () => void;
  session: Session;
  onSaved: () => void;
}

const blackButton =
  'inline-flex items-center justify-center px-5 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const ghostButton =
  'inline-flex items-center justify-center px-5 py-3 border border-brut-line text-brut-ink text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-bg-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const subLabel =
  'text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted';

const FELT_OPTIONS: ReadonlyArray<{ value: SessionFelt; label: string }> = [
  { value: 'easy', label: 'Easy' },
  { value: 'right', label: 'Right' },
  { value: 'hard', label: 'Hard' },
];

export function MarkDoneModal({ open, onClose, session, onSaved }: BaseProps) {
  const recommendedCaps = session.during_nutrition?.totals.capsules ?? 0;
  const [felt, setFelt] = useState<SessionFelt>('right');
  const [notes, setNotes] = useState('');
  const [caps, setCaps] = useState<string>(String(recommendedCaps));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await markSessionDone(session.id, {
        felt,
        notes: notes.trim() ? notes.trim() : null,
        capsulesTaken: caps === '' ? null : Number(caps),
      });
      if (result.ok) {
        onSaved();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark as done"
      footer={
        <>
          <button
            type="button"
            className={ghostButton}
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={blackButton}
            onClick={submit}
            disabled={pending}
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className={subLabel}>How did it feel?</span>
          <div className="grid grid-cols-3 gap-px bg-brut-line border border-brut-line">
            {FELT_OPTIONS.map((opt) => {
              const active = felt === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFelt(opt.value)}
                  aria-pressed={active}
                  className={`py-3 text-xs font-semibold tracking-brut-wide uppercase transition-colors ${
                    active
                      ? 'bg-brut-black text-white'
                      : 'bg-white text-brut-ink hover:bg-brut-bg-soft'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={subLabel}>Notes (optional)</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How the session went…"
            className="w-full bg-transparent border-b border-brut-line py-2 text-sm font-normal text-brut-black placeholder:text-brut-muted focus:outline-none focus:border-brut-black transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className={subLabel}>BRUT capsules taken</span>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              min={0}
              max={99}
              value={caps}
              onChange={(e) => setCaps(e.target.value)}
              className="brut-number w-20 bg-transparent border-b border-brut-line py-2 text-2xl font-thin tracking-brut text-brut-black focus:outline-none focus:border-brut-black transition-colors tabular-nums"
              aria-label="BRUT capsules taken"
            />
            <span className={subLabel}>caps</span>
          </div>
          <p className="text-xs font-normal text-brut-muted">
            Recommended for this session: {recommendedCaps}.
          </p>
        </div>

        {error ? (
          <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

export function SkipModal({ open, onClose, session, onSaved }: BaseProps) {
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await skipSession(session.id, {
        reason: reason.trim() ? reason.trim() : null,
      });
      if (result.ok) {
        onSaved();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Skip this session"
      footer={
        <>
          <button
            type="button"
            className={ghostButton}
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={blackButton}
            onClick={submit}
            disabled={pending}
          >
            {pending ? 'Saving…' : 'Skip session'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm font-normal text-brut-ink leading-relaxed">
          The session will be marked as skipped and removed from your weekly
          totals.
        </p>
        <div className="flex flex-col gap-2">
          <span className={subLabel}>Why? (optional)</span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Quick note for future you…"
            className="w-full bg-transparent border-b border-brut-line py-2 text-sm font-normal text-brut-black placeholder:text-brut-muted focus:outline-none focus:border-brut-black transition-colors resize-none"
          />
        </div>
        {error ? (
          <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

export function RescheduleModal({
  open,
  onClose,
  session,
  onSaved,
}: BaseProps) {
  const current = session.scheduled_date ?? '';
  const bounds = useMemo(
    () => (current ? weekBoundsFromIso(current) : null),
    [current],
  );
  const [date, setDate] = useState(current);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!date) {
      setError('Pick a new date.');
      return;
    }
    if (bounds && (date < bounds.monday || date > bounds.sunday)) {
      setError('New date must stay within the current training week.');
      return;
    }
    startTransition(async () => {
      const result = await rescheduleSession(session.id, {
        newDate: date,
        newDayOfWeek: dayOfWeekFromIso(date),
      });
      if (result.ok) {
        onSaved();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reschedule session"
      footer={
        <>
          <button
            type="button"
            className={ghostButton}
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={blackButton}
            onClick={submit}
            disabled={pending}
          >
            {pending ? 'Saving…' : 'Move session'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm font-normal text-brut-ink leading-relaxed">
          Pick any day within this training week. Cross-week moves arrive
          later.
        </p>
        <div className="flex flex-col gap-2">
          <span className={subLabel}>New date</span>
          <input
            type="date"
            value={date}
            min={bounds?.monday}
            max={bounds?.sunday}
            onChange={(e) => setDate(e.target.value)}
            className="w-full max-w-xs bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black focus:outline-none focus:border-brut-black transition-colors"
          />
        </div>
        {error ? (
          <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
