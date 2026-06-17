'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import { postponeRace } from '@/app/[locale]/brut-race/actions';

interface Props {
  planId: string;
  currentRaceDate: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const blackButton =
  'inline-flex items-center justify-center px-5 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const ghostButton =
  'inline-flex items-center justify-center px-5 py-3 border border-brut-line text-brut-ink text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-bg-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const subLabel =
  'text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted';

export default function PostponeRaceLink({ planId, currentRaceDate }: Props) {
  const t = useTranslations('brut_race.postpone');
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(currentRaceDate);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const oldDate = new Date(`${currentRaceDate}T00:00:00`);
  const newDate = date ? new Date(`${date}T00:00:00`) : null;
  const diffDays =
    newDate && !Number.isNaN(newDate.getTime())
      ? Math.round((newDate.getTime() - oldDate.getTime()) / MS_PER_DAY)
      : 0;
  const requiresRegenerate = diffDays > 28;

  function reset() {
    setDate(currentRaceDate);
    setConfirm(false);
    setError(null);
  }

  function submit() {
    setError(null);
    if (diffDays <= 0) {
      setError(t('new_date_earlier_error'));
      return;
    }
    if (requiresRegenerate && !confirm) {
      setError(t('confirm_regen_error'));
      return;
    }
    startTransition(async () => {
      const result = await postponeRace(planId, {
        newRaceDate: date,
        regenerate: requiresRegenerate,
      });
      if (result.ok) {
        setOpen(false);
        reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted hover:text-brut-black transition-colors underline underline-offset-4 decoration-brut-line hover:decoration-brut-black"
      >
        {t('trigger')}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('title')}
        footer={
          <>
            <button
              type="button"
              className={ghostButton}
              onClick={() => setOpen(false)}
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
              {pending ? t('submitting') : t('submit')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-normal text-brut-ink leading-relaxed">
            {t('current_race_date', { date: currentRaceDate })}
          </p>
          <div className="flex flex-col gap-2">
            <span className={subLabel}>{t('new_race_date_label')}</span>
            <input
              type="date"
              value={date}
              min={currentRaceDate}
              onChange={(e) => setDate(e.target.value)}
              className="w-full max-w-xs bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black focus:outline-none focus:border-brut-black transition-colors"
            />
          </div>

          {diffDays > 0 ? (
            <p className="text-xs font-normal text-brut-muted">
              {t('days_later', { days: diffDays })}
            </p>
          ) : null}

          {requiresRegenerate ? (
            <label className="flex items-start gap-3 text-sm font-normal text-brut-ink leading-relaxed">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
                className="mt-1"
              />
              <span>{t('regen_consent')}</span>
            </label>
          ) : (
            <p className="text-xs font-normal text-brut-muted">
              {t('soft_shift_note')}
            </p>
          )}

          {error ? (
            <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
              {error}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
