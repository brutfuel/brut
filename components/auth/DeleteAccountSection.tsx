'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { deleteAccount } from '@/app/[locale]/profile/actions';

const blackButton =
  'inline-flex items-center justify-center px-5 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const ghostButton =
  'inline-flex items-center justify-center px-5 py-3 border border-brut-line text-brut-ink text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-bg-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const subLabel =
  'text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted';

export default function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canDelete = confirmed && typed === 'DELETE';

  function reset() {
    setConfirmed(false);
    setTyped('');
    setError(null);
  }

  function submit() {
    setError(null);
    if (!canDelete) {
      setError('Tick the box and type DELETE to confirm.');
      return;
    }
    startTransition(async () => {
      const result = await deleteAccount({
        confirmed: true,
        typedConfirmation: 'DELETE',
      });
      if (result.ok) {
        // Server action signs the user out and redirects, but force a
        // client navigation in case the harness keeps a cached session.
        router.replace('/');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="mt-16 border-t border-brut-line pt-10">
      <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
        Danger zone
      </span>
      <h2 className="mt-4 text-xl font-thin tracking-brut text-brut-ink">
        Delete account
      </h2>
      <p className="mt-2 max-w-md text-xs font-normal text-brut-muted leading-relaxed">
        Permanently remove your account, profile and every race plan you
        have generated. This cannot be undone.
      </p>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="mt-5 inline-flex items-center justify-center px-5 py-3 border border-brut-line text-brut-muted text-[10px] font-semibold tracking-brut-wide uppercase hover:text-brut-black hover:border-brut-black transition-colors"
      >
        Delete my account
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete account"
        footer={
          <>
            <button
              type="button"
              className={ghostButton}
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="button"
              className={blackButton}
              onClick={submit}
              disabled={pending || !canDelete}
            >
              {pending ? 'Deleting…' : 'Delete account'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-normal text-brut-ink leading-relaxed">
            This will erase your account, profile and every race plan you have
            generated. There is no undo.
          </p>

          <label className="flex items-start gap-3 text-sm font-normal text-brut-ink leading-relaxed">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>I understand this is permanent.</span>
          </label>

          <div className="flex flex-col gap-2">
            <span className={subLabel}>Type DELETE to confirm</span>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="DELETE"
              className="w-full max-w-xs bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black placeholder:text-brut-muted focus:outline-none focus:border-brut-black transition-colors"
            />
          </div>

          {error ? (
            <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
              {error}
            </p>
          ) : null}
        </div>
      </Modal>
    </section>
  );
}
