import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RaceForm from '@/components/brut-race/RaceForm';
import { createClient } from '@/lib/supabase/server';

// Public page — the form is visible to everyone, but generating a plan
// requires a signed-in user (handled inside RaceForm / the Server Action).
export default async function BrutRacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-20">
        {/* Page header */}
        <section className="mb-12 md:mb-16">
          <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
            02 — Race
          </span>
          <h1 className="mt-6 text-[56px] md:text-[88px] leading-[0.95] font-thin tracking-brut text-brut-black">
            BRUT RACE
          </h1>
          <p className="mt-6 max-w-xl text-base md:text-lg font-normal text-brut-ink leading-relaxed">
            Set your race goal and build a complete 12 to 24 week programme —
            periodised training, nutrition guidelines and a session-by-session
            fuelling strategy.
          </p>
        </section>

        {/* Configuration form */}
        <div className="max-w-2xl">
          <RaceForm isAuthed={!!user} />
        </div>
      </main>

      <Footer />
    </>
  );
}
