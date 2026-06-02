# BRUT — Project Context (brut-app)

This file gives Claude Code persistent context about the BRUT app. Read this first when starting any session in this project.

---

## 🎯 What BRUT is

BRUT is a sports nutrition brand for endurance athletes (runners, cyclists, triathletes). The flagship product is **electrolyte capsules (211mg sodium each)**.

This app (`brut-app`) is the **digital companion** of the brand: a web platform that gives athletes personalised training plans, nutrition guidelines, and race-day strategies — naturally integrating BRUT capsule usage where scientifically appropriate.

The brand voice is **science-based, minimalist, no-fluff**. Editorial, not motivational. Think Tracksmith, ON Running, Aesop — never Gatorade or GU.

---

## 🏗️ Project structure

```
brut-app/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing
│   ├── brut-train/               # Session Plan (single workout)
│   ├── brut-race/                # Race Plan (12-16 week programmes)
│   ├── dashboard/                # User dashboard (authenticated)
│   ├── login/                    # Auth pages
│   ├── register/
│   └── profile/                  # Profile settings
├── components/
│   ├── brut-train/
│   ├── brut-race/
│   ├── auth/
│   └── ui/                       # Reusable components
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── calculations/             # Sweat, nutrition, training logic
│   │   ├── sweat.ts
│   │   ├── nutrition.ts
│   │   ├── session-structure.ts
│   │   ├── race-plan-generator.ts
│   │   └── nutrition-plan-generator.ts
│   └── strava/                   # Strava integration (Phase B)
└── public/
```

---

## 🎨 Design system

### Typography
- **Family:** Montserrat (Google Fonts)
- **Weights used:** 200, 400, 500, 600
- **Display (huge numbers/titles):** 200 (thin)
- **UI/body:** 400
- **Labels/CTAs:** 500-600

### Colours
- `--brut-black: #0a0a0a` (primary text, buttons)
- `--brut-ink: #3a3a3a` (secondary text)
- `--brut-muted: #8a8a8a` (tertiary text, captions)
- `--brut-line: #e5e5e5` (borders, dividers)
- `--brut-panel: #f4f4f4` (subtle backgrounds, cards)
- `--brut-bg-soft: #fafafa` (page section backgrounds)
- `--brut-white: #ffffff` (main background)

No accent colours. No gradients. No shadows.

### Spacing
8px grid: 8, 16, 24, 32, 48, 64, 96px. Max container width: 1280px.

### Iconography
Almost none. When needed, thin line icons (Lucide). Never emojis in UI.

### Layout patterns
- Desktop: 2-column (form left 1fr, result right ~380px sticky)
- Mobile: stack vertical at 980px, with adjustments at 640px and 380px
- Editorial numbering: "01 / 09" style (uppercase, tracking-wider)

---

## 🎯 Product overview

### 1. BRUT TRAIN (Session Plan) — Already built
Single-session planner: workout structure + nutrition (pre/during/post) + BRUT capsules.

### 2. BRUT RACE (Race Plan) — Current focus
User configures a race goal and gets 4 connected plans:

**A. Training Plan** (12-16 weeks)
- Polarized 80/20 methodology
- Phases: Base → Build → Peak → Taper
- Adapted to: sport, distance, target time, days/week available, level

**B. General Nutrition Plan** (guidelines per phase, not recipes)
- Daily macro targets per phase
- Carb periodisation
- Hydration baseline
- General principles (timing, food categories)

**C. Per-Session Nutrition Plan**
- Each training has its own pre/during/post fuelling
- BRUT capsules integrated naturally

**D. Race Day Plan** (Phase B)

### 3. Dashboard — Phase B
Active race plan summary, today's session, etc.

---

## 🔧 Tech stack

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS
- Supabase (Postgres + Auth, using `@supabase/ssr`)
- Google Fonts Montserrat (via next/font)
- React Hook Form + Zod
- Deployment: Vercel
- Server Components by default

---

## 📐 Training methodology

Polarized 80/20 (Seiler):
- 80% volume in Zone 1-2 (easy/endurance)
- 20% in Zone 4-5 (threshold/VO2max)
- Minimal Zone 3 ("grey zone")

### Phases (16-week marathon example)
1. **Base** (weeks 1-4): aerobic foundation, max Z2
2. **Build** (weeks 5-9): threshold and tempo work
3. **Peak** (weeks 10-13): race-specific intensity
4. **Taper** (weeks 14-16): reduce volume, maintain sharpness

### Weekly progression
- +5-10% volume per week
- Recovery week every 3-4 weeks: -25% volume

---

## 🥗 Nutrition methodology

### General plan (guidelines per phase)
- **Base:** 4-6 g/kg/day carbs
- **Build:** 5-7 g/kg/day carbs
- **Peak:** 6-8 g/kg/day carbs on heavy days
- **Taper:** maintain carbs, slight kcal reduction
- **Protein:** 1.4-1.8 g/kg/day all phases
- **Hydration baseline:** 30-35 ml/kg/day + replacement

### Per-session (Brut Train logic)
- Pre: time-of-day + last-meal + intensity
- During: water + carbs + BRUT capsules from sweat rate
- Post: 20-30g protein + 0.8-1.2 g/kg carbs + 150% fluid replacement

---

## 🔑 Authentication & user model

### Sign-up flow
1. User clicks "Sign up"
2. Choose: Google OAuth or Email/Password
3. Onboarding (3 steps): Name → Primary sport → Body weight
4. Land on dashboard

### Profile fields
`id`, `full_name`, `weight_kg`, `primary_sport`, `level`, `fcmax`, `ftp`, `acclimated`, `sodium_diet`, `created_at`, `updated_at`

---

## ✍️ Working preferences

1. Preserve visual style. No new colours, no gradients, no playful copy.
2. English UK for user-facing text. Code comments in English.
3. Mobile first mentality, desktop is reference layout.
4. Cite science when generating plan logic (Baker, Barnes, Seiler, ACSM).
5. Server Components by default, "use client" only when interactive.
6. Type everything. No `any`. Use Zod at API boundaries.
7. Modular logic. Pure functions in `lib/calculations/`.
8. Don't over-engineer. This is an MVP.
9. Tell me before big changes. If "make this better", suggest 2-3 directions first.

---

## 🗺️ Roadmap

- **Phase A (current):** Auth, Race setup form, 4-plan generator, visualisation, persistence
- **Phase B:** Strava OAuth, activity sync, plan calibration, race day plan, auto-tracking
- **Phase C:** Claude API adaptive adjustments, fatigue detection, Plan B scenarios
- **Phase D:** Stripe, subscriptions, custom domain, analytics

---

## 📚 References

- Baker LB. Sports Med 2017;47(Suppl 1):111-128
- Barnes KA et al. J Sports Sci 2019;37(20):2356-2366
- Seiler S. Int J Sports Physiol Perform 2010 (Polarized training)
- ACSM Position Stand on Hydration 2007

---

## 💬 Communication style

- Direct, no fluff
- Show actual code snippets
- Push back if my idea is wrong
- I speak Catalan/Spanish; reply in either, but all code/comments/UI strings stay in English UK.
