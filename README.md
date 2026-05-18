# BRUT App

Science-based nutrition tools for endurance athletes — a Next.js 14 app powering two products:

- **BRUT TRAIN** — single-session plan generator (workout structure + pre/during/post nutrition)
- **BRUT RACE** — 12–16 week race plan builder (periodisation + complete fuelling strategy)

This MVP uses **rule-based, deterministic logic** grounded in current sports nutrition literature (Baker LB 2017, Barnes et al. 2019). No AI inference at runtime.

## Stack

- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Supabase (wired but inactive — env vars only)
- Montserrat (weights 200 / 400 / 500 / 600) via `next/font/google`

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase keys when ready
npm run dev
```

Open `http://localhost:3000`.

## Scripts

| Command         | Purpose                  |
| --------------- | ------------------------ |
| `npm run dev`   | Local dev server         |
| `npm run build` | Production build         |
| `npm run start` | Run the production build |
| `npm run lint`  | Lint                     |

## Project structure

```
brut-app/
├── app/
│   ├── layout.tsx            Global layout (Montserrat)
│   ├── page.tsx              Public landing
│   ├── globals.css           Tailwind + reset
│   ├── brut-train/page.tsx   Session plan (placeholder)
│   └── brut-race/page.tsx    Race plan (placeholder)
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ui/                   Reusable primitives (Button, Input)
├── lib/
│   └── supabase.ts           Lazy Supabase client
└── public/                   Static assets
```

## Design system

Strict monochrome palette — no accent colours, no gradients, no decorative shadows.

| Token            | Hex       | Use                        |
| ---------------- | --------- | -------------------------- |
| `brut-black`     | `#0a0a0a` | Primary text, CTAs         |
| `brut-ink`       | `#3a3a3a` | Secondary text             |
| `brut-muted`     | `#8a8a8a` | Labels, captions           |
| `brut-line`      | `#e5e5e5` | Hairlines, borders         |
| `brut-panel`     | `#f4f4f4` | Panels                     |
| `brut-bg-soft`   | `#fafafa` | Soft section backgrounds   |

Typography is Montserrat only — weight 200 for display numbers and headlines, 400 for body, 500–600 for labels and CTAs. All copy is en-GB.

## Conventions

- Server components by default; `"use client"` only where interactivity is required.
- No `localStorage` yet — state is in-memory only.
- Mobile-first.
- Comments in English.

## References

- Baker LB. *Sweating Rate and Sweat Sodium Concentration in Athletes: A Review of Methodology and Intra/Interindividual Variability.* Sports Med, 2017.
- Barnes KR, Hopkins WG, McGuigan MR, Kilding AE. *Effects of Different Uphill Interval-Training Programs on Running Economy and Performance.* Int J Sports Physiol Perform, 2019.
