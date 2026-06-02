# BRUT — Deploy Checklist

End-to-end checklist for taking BRUT to **app.brutfuel.com** on Vercel + Supabase. Tick everything top-to-bottom before flipping the DNS.

---

## 1. Supabase project

- [ ] Create a Production project at <https://app.supabase.com>.
- [ ] Copy these values from **Project Settings → API**:
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon` / `publishable` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` / `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose)

## 2. Database migrations

Open **SQL Editor** and run, in this order, exactly the files committed to the repo:

- [ ] `database/schema.sql`
- [ ] `database/migration-race-plan-generation.sql`
- [ ] `database/migration-profile-extended.sql`
- [ ] `database/migration-session-tracking.sql`
- [ ] `database/migration-race-day-plan.sql`

After each one, verify the new tables / columns appear in **Table Editor**. Every script is idempotent (`add column if not exists`, `create table` first time), so re-running is safe.

## 3. Supabase Auth configuration

- [ ] **Authentication → URL Configuration**
  - Site URL: `https://app.brutfuel.com`
  - Redirect URLs (add both): `https://app.brutfuel.com/**`, `http://localhost:3000/**`
- [ ] **Authentication → Providers → Email**
  - Decide on **Confirm email**:
    - Disabled → the signup → onboarding flow is one continuous experience.
    - Enabled → users hit `/auth/verify` after signup until they click the confirmation link. Both flows are supported.
- [ ] **Authentication → Providers → Google**
  - Enable Google.
  - Paste the **Client ID** and **Client Secret** from Google Cloud Console (see step 4 below).
- [ ] **Authentication → Email Templates**
  - Subject of *Reset Password*: `Reset your Brut password`.
  - Paste the body copy from `lib/email/templates/password-reset.ts` (the Supabase template uses `{{ .ConfirmationURL }}` instead of the literal URL).

## 4. Google OAuth

- [ ] Google Cloud Console → **APIs & Services → Credentials**.
- [ ] Create **OAuth Client ID** of type *Web application*.
- [ ] Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback` (Supabase shows the exact URL on the Google provider page).
- [ ] Copy Client ID + Client Secret back into Supabase **Authentication → Providers → Google**.

## 5. Resend (transactional email)

- [ ] Create a Resend account, verify the **brutfuel.com** sending domain (or the subdomain you choose for `EMAIL_FROM`).
- [ ] Add the DNS records Resend gives you (SPF / DKIM).
- [ ] Generate an API key → `RESEND_API_KEY`.

Without a key the `lib/email/send.ts` adapter falls back to console logs; the UI still completes normally.

## 6. Plausible analytics (optional)

- [ ] Add `app.brutfuel.com` to your Plausible account.
- [ ] Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=app.brutfuel.com` in Vercel.
- [ ] Leave empty to skip — the script is only injected when the variable is set.

## 7. Vercel project

- [ ] Import the GitHub repo in <https://vercel.com>.
- [ ] **Framework**: Next.js (auto-detected).
- [ ] **Install command**: leave the default — Vercel uses its own CA store, the local `NODE_OPTIONS=--use-system-ca` is only needed on the corporate machine.
- [ ] **Environment variables** (Production + Preview):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (Production only is fine)
  - `RESEND_API_KEY`
  - `EMAIL_FROM=hello@brutfuel.com`
  - `EMAIL_FROM_NAME=Brut`
  - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=app.brutfuel.com`

- [ ] Trigger the first build. Watch logs for any missing env or TS issues.

## 8. DNS — app.brutfuel.com

- [ ] In your DNS provider, add a CNAME for `app` pointing to `cname.vercel-dns.com`.
- [ ] Add the domain in Vercel **Project → Domains** as `app.brutfuel.com`.
- [ ] Wait for Vercel to provision the certificate (1–10 min).

## 9. Post-deploy smoke tests

Run these end-to-end on the live URL (use a fresh email for each test account).

- [ ] `/` loads and the editorial landing renders with the new footer.
- [ ] `/register` → email + password → onboarding 4-step → dashboard.
- [ ] Welcome email arrives (Resend logs show 200).
- [ ] `/login` → password sign-in works.
- [ ] `/forgot-password` → enter email → Supabase reset email arrives → link reaches `/reset-password` → setting a new password lands you on the dashboard.
- [ ] `/brut-race` → generate a plan → `/brut-race/[planId]` shows the phase overview + week browser.
- [ ] Mark a session as done → modal saves → row turns grey with the check.
- [ ] Reschedule a session within the same week → date input min/max behave.
- [ ] Postpone race date (<28 days) → all sessions shift forward.
- [ ] Race day setup (when race ≤ 14 days away) → `/brut-race/[planId]/race-day` renders the four blocks.
- [ ] Dashboard:
  - empty state (no plan) shows the Welcome block + Quick tools.
  - active plan shows the countdown + today + this week + nutrition + next sessions.
- [ ] Feedback floating button appears once signed in → sends a message → check the inbox at `hello@brutfuel.com`.
- [ ] `/profile` → edit a field → save → toast confirms → reload preserves change.
- [ ] `/profile` → Danger zone → delete account (use a throwaway user) → home page loads signed-out.
- [ ] `/legal/privacy`, `/legal/terms`, `/legal/cookies`, `/about`, `/contact` render correctly. Footer links work.
- [ ] Cookie banner appears on first visit, disappears after **Got it**, and stays gone on reload.
- [ ] Trigger a deliberate error route (e.g. an invalid plan UUID) → `/brut-race/[planId]/session/<bad-id>` returns the editorial "Session not found" fallback.
- [ ] Hit a non-existent URL → the 404 page renders the BRUT header + footer.
- [ ] Plausible dashboard shows pageviews within ~10 min (if enabled).
- [ ] Lighthouse → Performance ≥ 85 on mobile; A11y ≥ 95; no console errors in production.

## 10. Final checks

- [ ] `Allowed URLs` in Supabase no longer contains `localhost` for production — or keep it only if the team needs preview environments.
- [ ] Resend has the production domain verified, not just sandbox.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not exposed to any client bundle (only used inside `app/profile/actions.ts` `deleteAccount`).
- [ ] All 5 SQL migrations are committed to `database/` and the README points at them in order.
- [ ] CLAUDE.md is up to date with the current state for future sessions.

Ship it.
