import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OnboardingFlow from '@/components/auth/OnboardingFlow';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/db';

export default async function OnboardingPage() {
  const t = await getTranslations('auth.onboarding');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('profiles')
    .select('full_name, weight_kg, primary_sport')
    .eq('id', user.id)
    .single();

  const profile = data as Pick<
    Profile,
    'full_name' | 'weight_kg' | 'primary_sport'
  > | null;

  // Already onboarded — no need to repeat it.
  if (profile && profile.weight_kg !== null && profile.primary_sport !== null) {
    redirect('/dashboard');
  }

  // The signup trigger seeds `full_name` with the email when no name is
  // known — only pre-fill the field with a genuine name.
  const initialName =
    profile?.full_name && profile.full_name !== user.email
      ? profile.full_name
      : '';

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <div className="mx-auto w-full max-w-md">
          <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
            {t('section_eyebrow')}
          </span>
          <div className="mt-10">
            <OnboardingFlow initialName={initialName} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
