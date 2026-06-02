'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import SignOutButton from '@/components/auth/SignOutButton';

/**
 * Sticky, monochrome header. Client component so it can reflect the
 * Supabase auth state live (it is also rendered inside client pages
 * such as BRUT TRAIN, which rules out an async server component).
 */
export default function Header() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [firstName, setFirstName] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadProfileName(userId: string, fallback: string) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      if (!active) return;
      const fullName = (data as { full_name: string | null } | null)?.full_name;
      const name = fullName && fullName !== fallback ? fullName : fallback;
      setFirstName(name.trim().split(' ')[0] ?? '');
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      setSignedIn(!!user);
      setLoading(false);
      if (user) {
        void loadProfileName(user.id, user.email ?? '');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const user = session?.user ?? null;
      setSignedIn(!!user);
      setLoading(false);
      setMenuOpen(false);
      if (user) {
        void loadProfileName(user.id, user.email ?? '');
      } else {
        setFirstName('');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-brut-line">
      <div className="mx-auto max-w-7xl px-6 md:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          aria-label="BRUT home"
          className="text-xl md:text-2xl font-thin tracking-brut-wide text-brut-black"
        >
          BRUT
        </Link>

        <nav className="flex items-center gap-6 md:gap-10 text-xs md:text-sm font-medium tracking-brut-wide uppercase">
          <Link
            href="/brut-train"
            className="text-brut-ink hover:text-brut-black transition-colors"
          >
            Train
          </Link>
          <Link
            href="/brut-race"
            className="text-brut-ink hover:text-brut-black transition-colors"
          >
            Race
          </Link>
          <a
            href="https://brutfuel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brut-ink hover:text-brut-black transition-colors"
          >
            Shop
          </a>

          {/* Auth slot */}
          {loading ? (
            <span className="w-12" aria-hidden />
          ) : signedIn ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="text-brut-black hover:text-brut-ink transition-colors uppercase"
              >
                {firstName || 'Account'}
              </button>

              {menuOpen ? (
                <>
                  {/* Click-away layer */}
                  <button
                    type="button"
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-3 w-44 border border-brut-line bg-white"
                  >
                    <Link
                      href="/dashboard"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 text-xs font-medium tracking-brut-wide uppercase text-brut-ink hover:bg-brut-bg-soft transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 text-xs font-medium tracking-brut-wide uppercase text-brut-ink hover:bg-brut-bg-soft transition-colors border-t border-brut-line"
                    >
                      Profile
                    </Link>
                    <div className="border-t border-brut-line">
                      <SignOutButton />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-brut-black hover:text-brut-ink transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
