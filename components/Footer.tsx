import Link from 'next/link';

const colTitle =
  'text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted';
const colLink =
  'text-xs font-medium tracking-brut-wide uppercase text-brut-ink hover:text-brut-black transition-colors';

/**
 * Editorial footer — three columns of section links above a row of
 * secondary links and the copyright. Pages that require auth still
 * gate access themselves, so every link is rendered unconditionally.
 */
export default function Footer() {
  return (
    <footer className="w-full border-t border-brut-line mt-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-12 md:py-16 flex flex-col gap-10">
        <p className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
          BRUT — Electrolyte performance
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-10">
          <div className="flex flex-col gap-3">
            <span className={colTitle}>Tools</span>
            <Link href="/brut-train" className={colLink}>
              Brut Train
            </Link>
            <Link href="/brut-race" className={colLink}>
              Brut Race
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className={colTitle}>Account</span>
            <Link href="/login" className={colLink}>
              Sign in
            </Link>
            <Link href="/profile" className={colLink}>
              Profile
            </Link>
            <Link href="/dashboard" className={colLink}>
              Dashboard
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className={colTitle}>Legal</span>
            <Link href="/legal/privacy" className={colLink}>
              Privacy
            </Link>
            <Link href="/legal/terms" className={colLink}>
              Terms
            </Link>
            <Link href="/legal/cookies" className={colLink}>
              Cookies
            </Link>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-3 border-t border-brut-line pt-8">
          <Link href="/about" className={colLink}>
            About
          </Link>
          <Link href="/contact" className={colLink}>
            Contact
          </Link>
          <a
            href="https://brutfuel.com"
            target="_blank"
            rel="noopener noreferrer"
            className={colLink}
          >
            Shop
          </a>
        </nav>

        <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted">
          © 2026 Brut.
        </p>
      </div>
    </footer>
  );
}
