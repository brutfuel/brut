import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Placeholder for the session plan generator. Real logic lands this week.
export default function BrutTrainPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-20 md:pt-32 pb-20 md:pb-32 min-h-[60vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          01 — Session
        </span>
        <h1 className="mt-6 text-[56px] md:text-[88px] leading-[0.95] font-thin tracking-brut text-brut-black">
          BRUT TRAIN
        </h1>
        <p className="mt-8 max-w-xl text-lg md:text-xl font-normal text-brut-ink">
          Session plan generator — coming this week.
        </p>
        <p className="mt-4 max-w-xl text-base font-normal text-brut-muted leading-relaxed">
          Tell us the session type, duration and conditions; we return a
          structured workout with pre, during and post fuelling targets.
        </p>
      </main>

      <Footer />
    </>
  );
}
