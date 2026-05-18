import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Placeholder for the full race plan builder.
export default function BrutRacePage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-20 md:pt-32 pb-20 md:pb-32 min-h-[60vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          02 — Race
        </span>
        <h1 className="mt-6 text-[56px] md:text-[88px] leading-[0.95] font-thin tracking-brut text-brut-black">
          BRUT RACE
        </h1>
        <p className="mt-8 max-w-xl text-lg md:text-xl font-normal text-brut-ink">
          Race plan builder — coming soon.
        </p>
        <p className="mt-4 max-w-xl text-base font-normal text-brut-muted leading-relaxed">
          A complete 12 to 16 week programme for a specific race — periodised
          training blocks, taper and a full fuelling strategy from long run
          to race day.
        </p>
      </main>

      <Footer />
    </>
  );
}
