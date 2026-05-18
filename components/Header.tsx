import Link from 'next/link';

// Sticky, monochrome header. Server component — no interactivity required.
export default function Header() {
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
        </nav>
      </div>
    </header>
  );
}
