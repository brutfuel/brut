// Minimal root layout. The <html>/<body> markup, fonts and providers
// live in `app/[locale]/layout.tsx` — Next.js still requires this file
// to exist, but next-intl renders the real layout per locale.

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
