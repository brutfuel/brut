import { getTranslations } from 'next-intl/server';

export default async function RootLoading() {
  const t = await getTranslations('errors');
  return (
    <main className="mx-auto max-w-7xl px-6 md:px-10 pt-32 pb-24 min-h-[70vh]">
      <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
        {t('loading')}
      </p>
    </main>
  );
}
