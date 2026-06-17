import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from '@/lib/i18n/routing';

export default async function NotFound() {
  const t = await getTranslations('errors');

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 md:px-10 pt-16 md:pt-24 pb-24 min-h-[70vh]">
        <span className="text-xs font-semibold tracking-brut-wide uppercase text-brut-muted">
          {t('eyebrow_404')}
        </span>
        <h1 className="mt-6 text-[40px] md:text-[56px] leading-[1.0] font-thin tracking-brut text-brut-black">
          {t('title_404')}
        </h1>
        <p className="mt-4 text-base font-normal text-brut-ink leading-relaxed">
          {t('body_404')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors"
          >
            {t('go_to_dashboard')}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-brut-black text-brut-black text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            {t('back_to_home')}
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
