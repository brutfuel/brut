import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

// Single typeface across the app — only the weights we actually use.
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['200', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BRUT — Electrolyte performance',
  description:
    'Science-based nutrition tools for endurance athletes. Plan your session, build your race.',
  metadataBase: new URL('https://brutfuel.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={montserrat.variable}>
      <body className="bg-white text-brut-black font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
