'use client';

import { useTransition } from 'react';
import { signOut } from '@/app/login/actions';

interface Props {
  /** Override styling when used outside the header dropdown. */
  className?: string;
}

/** Signs the user out via the `signOut` Server Action. */
export default function SignOutButton({ className }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className={
        className ??
        'w-full text-left px-4 py-3 text-xs font-medium tracking-brut-wide uppercase text-brut-ink hover:bg-brut-bg-soft transition-colors disabled:opacity-40'
      }
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
