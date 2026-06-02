// Root-level loading fallback, shown while a Server Component segment
// is being prepared. Editorial single-line, no spinners.

export default function RootLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 md:px-10 pt-32 pb-24 min-h-[70vh]">
      <p className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
        Loading…
      </p>
    </main>
  );
}
