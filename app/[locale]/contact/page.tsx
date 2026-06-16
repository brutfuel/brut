import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactForm from '@/app/[locale]/contact/ContactForm';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/db';

export default async function ContactPage() {
  const t = await getTranslations('contact');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialEmail = '';
  let initialName = '';
  if (user) {
    initialEmail = user.email ?? '';
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    const profile = profileData as Pick<Profile, 'full_name'> | null;
    initialName = profile?.full_name ?? '';
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[720px] px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          {t('eyebrow')}
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          {t('title')}
        </h1>
        <p className="mt-6 text-sm font-normal text-brut-ink leading-relaxed">
          {t.rich('intro', {
            mail: (chunks) => (
              <a
                href="mailto:hello@brutfuel.com"
                className="text-brut-black border-b border-brut-black pb-0.5 hover:opacity-60 transition-opacity"
              >
                {chunks}
              </a>
            ),
          })}
        </p>

        <div className="mt-12">
          <ContactForm initialEmail={initialEmail} initialName={initialName} />
        </div>
      </main>

      <Footer />
    </>
  );
}
