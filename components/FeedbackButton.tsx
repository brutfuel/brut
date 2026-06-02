'use client';

import { useEffect, useState, useTransition } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { sendFeedback } from '@/app/feedback/actions';

const blackButton =
  'inline-flex items-center justify-center px-5 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const ghostButton =
  'inline-flex items-center justify-center px-5 py-3 border border-brut-line text-brut-ink text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-bg-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const subLabel =
  'text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted';

/**
 * Floating "Send feedback" button, visible only to signed-in users.
 * Opens a modal with email pre-filled and the current page URL.
 */
export default function FeedbackButton() {
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState('');

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      setSignedIn(!!user);
      setEmail(user?.email ?? '');
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const user = session?.user ?? null;
      setSignedIn(!!user);
      setEmail(user?.email ?? '');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!authReady || !signedIn) return null;

  function submit() {
    setError(null);
    const url =
      typeof window !== 'undefined' ? window.location.href : undefined;
    startTransition(async () => {
      const result = await sendFeedback({ email, message, url });
      if (result.ok) {
        setSent(true);
        setMessage('');
      } else {
        setError(result.error);
      }
    });
  }

  function close() {
    setOpen(false);
    setSent(false);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-30 inline-flex items-center justify-center px-4 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase shadow-none hover:bg-brut-ink transition-colors"
      >
        Send feedback
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Send feedback"
        footer={
          <>
            <button
              type="button"
              className={ghostButton}
              onClick={close}
              disabled={pending}
            >
              Close
            </button>
            <button
              type="button"
              className={blackButton}
              onClick={submit}
              disabled={pending || sent}
            >
              {pending ? 'Sending…' : sent ? 'Sent' : 'Send'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-normal text-brut-ink leading-relaxed">
            Bug, idea, friction — whatever helps us improve BRUT. We read
            everything.
          </p>

          <div className="flex flex-col gap-2">
            <span className={subLabel}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black focus:outline-none focus:border-brut-black transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className={subLabel}>Message</span>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What&rsquo;s on your mind?"
              className="w-full bg-transparent border-b border-brut-line py-2 text-sm font-normal text-brut-black placeholder:text-brut-muted focus:outline-none focus:border-brut-black transition-colors resize-none"
            />
          </div>

          {sent ? (
            <p className="text-sm font-normal text-brut-ink leading-relaxed border-l-2 border-brut-black pl-3">
              Thanks — received. You can close this now.
            </p>
          ) : null}
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
