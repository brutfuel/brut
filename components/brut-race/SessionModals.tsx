'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import {
  markSessionDone,
  rescheduleSession,
  skipSession,
} from '@/app/[locale]/brut-race/actions';
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

const FELT_VALUES: ReadonlyArray<SessionFelt> = ['easy', 'right', 'hard'];

export function MarkDoneModal({ open, onClose, session, onSaved }: BaseProps) {
  const t = useTranslations('brut_race.session_modals');
  const tFelt = useTranslations('brut_race.session_modals.felt');

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
      title={t('mark_done_title')}
      footer={
        <>
          <button
            type="button"
            className={ghostButton}
            onClick={onClose}
            disabled={pending}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            className={blackButton}
            onClick={submit}
            disabled={pending}
          >
            {pending ? t('saving') : t('save')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className={subLabel}>{t('how_did_it_feel')}</span>
          <div className="grid grid-cols-3 gap-px bg-brut-line border border-brut-line">
            {FELT_VALUES.map((value) => {
              const active = felt === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFelt(value)}
                  aria-pressed={active}
                  className={`py-3 text-xs font-semibold tracking-brut-wide uppercase transition-colors ${
                    active
                      ? 'bg-brut-black text-white'
                      : 'bg-white text-brut-ink hover:bg-brut-bg-soft'
                  }`}
                >
                  {tFelt(value)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={subLabel}>{t('notes_optional')}</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notes_placeholder')}
            className="w-full bg-transparent border-b border-brut-line py-2 text-sm font-normal text-brut-black placeholder:text-brut-muted focus:outline-none focus:border-brut-black transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className={subLabel}>{t('capsules_taken')}</span>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              min={0}
              max={99}
              value={caps}
              onChange={(e) => setCaps(e.target.value)}
              className="brut-number w-20 bg-transparent border-b border-brut-line py-2 text-2xl font-thin tracking-brut text-brut-black focus:outline-none focus:border-brut-black transition-colors tabular-nums"
              aria-label={t('capsules_taken_aria')}
            />
            <span className={subLabel}>{t('caps')}</span>
          </div>
          <p className="text-xs font-normal text-brut-muted">
            {t('recommended_for_session', { count: recommendedCaps })}
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
  const t = useTranslations('brut_race.session_modals');
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
      title={t('skip_title')}
      footer={
        <>
          <button
            type="button"
            className={ghostButton}
            onClick={onClose}
            disabled={pending}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            className={blackButton}
            onClick={submit}
            disabled={pending}
          >
            {pending ? t('saving') : t('skip_session')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm font-normal text-brut-ink leading-relaxed">
          {t('skip_body')}
        </p>
        <div className="flex flex-col gap-2">
          <span className={subLabel}>{t('skip_reason_label')}</span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('skip_reason_placeholder')}
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
  const t = useTranslations('brut_race.session_modals');
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
      setError(t('pick_new_date'));
      return;
    }
    if (bounds && (date < bounds.monday || date > bounds.sunday)) {
      setError(t('cross_week_error'));
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
      title={t('reschedule_title')}
      footer={
        <>
          <button
            type="button"
            className={ghostButton}
            onClick={onClose}
            disabled={pending}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            className={blackButton}
            onClick={submit}
            disabled={pending}
          >
            {pending ? t('saving') : t('move_session')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm font-normal text-brut-ink leading-relaxed">
          {t('reschedule_body')}
        </p>
        <div className="flex flex-col gap-2">
          <span className={subLabel}>{t('new_date_label')}</span>
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
