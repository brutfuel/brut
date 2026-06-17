'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MarkDoneModal,
  RescheduleModal,
  SkipModal,
} from '@/components/brut-race/SessionModals';
import type { Session } from '@/lib/types/db';

interface Props {
  session: Session;
}

type ModalKind = 'mark' | 'skip' | 'reschedule';

export default function SessionDetailActions({ session }: Props) {
  const t = useTranslations('brut_race.session_detail');
  const [modal, setModal] = useState<ModalKind | null>(null);

  const finished = session.status === 'completed' || session.status === 'skipped';
  if (finished) return null;

  return (
    <>
      <div className="sticky bottom-0 -mx-6 md:-mx-10 px-6 md:px-10 py-4 mt-12 bg-white border-t border-brut-line z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setModal('mark')}
            className="block w-full text-center py-4 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors"
          >
            {t('action_mark_done')}
          </button>
          <button
            type="button"
            onClick={() => setModal('reschedule')}
            className="block w-full text-center py-4 border border-brut-black text-brut-black text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            {t('action_reschedule')}
          </button>
          <button
            type="button"
            onClick={() => setModal('skip')}
            className="block w-full text-center py-4 border border-brut-line text-brut-ink text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-bg-soft transition-colors"
          >
            {t('action_skip')}
          </button>
        </div>
      </div>

      {modal === 'mark' ? (
        <MarkDoneModal
          open
          onClose={() => setModal(null)}
          session={session}
          onSaved={() => setModal(null)}
        />
      ) : null}
      {modal === 'skip' ? (
        <SkipModal
          open
          onClose={() => setModal(null)}
          session={session}
          onSaved={() => setModal(null)}
        />
      ) : null}
      {modal === 'reschedule' ? (
        <RescheduleModal
          open
          onClose={() => setModal(null)}
          session={session}
          onSaved={() => setModal(null)}
        />
      ) : null}
    </>
  );
}
