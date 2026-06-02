# BRUT App

Science-based nutrition tools for endurance athletes — a Next.js 14 app powering three products:

- **BRUT TRAIN** — single-session plan generator (workout structure + pre/during/post nutrition + capsule schedule)
- **BRUT RACE** — 8–24 week race plan builder (periodisation + per-phase nutrition + per-session fuelling)
- **BRUT RACE DAY** — full race-day strategy (pre-race week, race morning, segment-by-segment fuelling, post-race recovery)

All calculations are **deterministic, rule-based** logic grounded in current sports nutrition literature (Baker LB 2017, Barnes 2019, Seiler 2010, ACSM 2007). No AI inference at runtime.

## Stack

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS + Montserrat (weights 200 / 400 / 500 / 600) via `next/font/google`
- Supabase (Postgres + Auth, `@supabase/ssr`)
- React Hook Form + Zod for every form
- Resend for transactional email (optional in dev — falls back to logs)
- Plausible for privacy-friendly analytics (optional)

## Getting started

```bash
# 1. Install dependencies — the project needs the system CA store
NODE_OPTIONS=--use-system-ca npm install

# 2. Copy the env template and fill in the keys
cp .env.local.example .env.local

# 3. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

> The `dev` and `build` scripts already bake in `NODE_OPTIONS=--use-system-ca`. Only direct `npm install`, `npx tsc`, etc. need the prefix.

## Environment variables

See `.env.local.example` for the full list. Summary:

| Variable                          | Required | Used for                                              |
| --------------------------------- | -------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | yes      | Browser + server Supabase clients                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | yes      | Browser + server clients (anon / publishable)         |
| `SUPABASE_SERVICE_ROLE_KEY`       | yes      | Server-only — used by `deleteAccount` admin call      |
| `RESEND_API_KEY`                  | no       | Transactional email. Empty → log to console in dev    |
| `EMAIL_FROM`                      | no       | Sender email (default `hello@brutfuel.com`)           |
| `EMAIL_FROM_NAME`                 | no       | Sender display name (default `Brut`)                  |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`    | no       | When set, the Plausible script is injected            |

## Database migrations

SQL lives in `database/` and is applied **manually** in the Supabase SQL Editor. Apply in this order on a fresh project:

1. `database/schema.sql` — base schema (profiles + race_plans + phases + sessions + nutrition_phases + strava placeholders)
2. `database/migration-race-plan-generation.sql` — race plan generator inputs + `sessions.session_type` vocabulary alignment + `sessions.structure jsonb`
3. `database/migration-profile-extended.sql` — extended profile fields (identity, capacity, PRs JSONB, physiology, health, hydration, logistics)
4. `database/migration-session-tracking.sql` — `sessions.felt` + `sessions.capsules_taken`
5. `database/migration-race-day-plan.sql` — `race_day_plans` table + RLS + trigger

Every migration is `add column if not exists` / `create table` so re-running is safe.

## Scripts

| Command         | Purpose                                |
| --------------- | -------------------------------------- |
| `npm run dev`   | Local dev server with hot reload       |
| `npm run build` | Production build                       |
| `npm run start` | Run the production build               |
| `npm run lint`  | Lint                                   |

## Project structure

```
brut-app/
├── app/                          Next.js App Router
│   ├── (auth pages)              login, register, forgot/reset-password, verify
│   ├── dashboard/                Athlete dashboard with countdown + week + nutrition
│   ├── brut-train/               Single-session planner
│   ├── brut-race/                Race plan builder + week browser + race day
│   ├── profile/                  Editable profile + Danger zone
│   ├── legal/                    Privacy / Terms / Cookies
│   ├── about/, contact/          Brand pages
│   └── error.tsx, not-found.tsx  Editorial error / 404 fallbacks
├── components/
│   ├── auth/                     LoginForm, RegisterForm, OnboardingFlow, etc.
│   ├── brut-race/                PlanWeekBrowser, SessionModals, RaceDaySetupForm
│   ├── brut-train/               SessionForm, SessionResult, SessionTable
│   ├── dashboard/                CountdownBanner
│   ├── ui/                       Modal, Segmented, Slider, Toggle, Input, …
│   ├── CookieBanner.tsx, FeedbackButton.tsx
│   ├── Header.tsx, Footer.tsx
├── lib/
│   ├── calculations/             Pure domain logic — sweat, nutrition, generators
│   ├── dashboard/metrics.ts      Dashboard pure helpers
│   ├── email/                    Email send adapter + templates
│   ├── supabase/                 client / server / middleware
│   ├── types/db.ts               Database row types
│   ├── utils/dates.ts            Shared date helpers
│   └── validation/               Zod schemas
└── database/                     SQL migrations
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

Montserrat only — 200 for display, 400 for body, 500–600 for labels and CTAs. All copy is en-GB.

## Conventions

- Server Components by default; `"use client"` only where interactivity is required.
- Zod at every Server Action boundary; no `any`.
- No emojis in user-facing copy.
- Mobile-first; breakpoints at 380 / 640 / 980 px.
- Mutating actions revalidate the affected route via `revalidatePath`.

## Deploy

See [DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md) for the full sequence (Supabase config, env vars, Vercel, DNS, post-deploy tests).

## References

- Baker LB. *Sweating Rate and Sweat Sodium Concentration in Athletes: A Review.* Sports Med, 2017.
- Barnes KA et al. *Sweat Rates and Sweat Sodium Concentrations During Endurance Exercise.* J Sports Sci, 2019.
- Seiler S. *What is Best Practice for Training Intensity and Duration Distribution in Endurance Athletes?* Int J Sports Physiol Perform, 2010.
- ACSM. *Exercise and Fluid Replacement Position Stand.* 2007.
