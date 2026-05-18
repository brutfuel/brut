import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brut-black': '#0a0a0a',
        'brut-ink': '#3a3a3a',
        'brut-muted': '#8a8a8a',
        'brut-line': '#e5e5e5',
        'brut-panel': '#f4f4f4',
        'brut-bg-soft': '#fafafa',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        thin: '200',
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      letterSpacing: {
        brut: '0.02em',
        'brut-wide': '0.08em',
      },
    },
  },
  plugins: [],
};

export default config;
