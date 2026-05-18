import Link from 'next/link';

// Minimal footer — single row on desktop, stacked on mobile.
export default function Footer() {
  return (
    <footer className="w-full border-t border-brut-line mt-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <p className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
          BRUT — Electrolyte performance
        </p>

        <nav className="flex flex-wrap items-center gap-6 text-xs font-medium tracking-brut-wide uppercase">
          <a
            href="https://brutfuel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brut-ink hover:text-brut-black transition-colors"
          >
            Shop
          </a>
          <Link
            href="/about"
            className="text-brut-ink hover:text-brut-black transition-colors"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="text-brut-ink hover:text-brut-black transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/contact"
            className="text-brut-ink hover:text-brut-black transition-colors"
          >
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
