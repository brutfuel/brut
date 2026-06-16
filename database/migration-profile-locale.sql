-- ============================================================
-- BRUT — Migration: Profile locale
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- Adds a per-athlete language preference to `profiles`. The column
-- is the source of truth for the locale used by the LocaleSwitcher,
-- by `completeOnboarding` (to pick the welcome-email language) and
-- by the coherence redirect (route locale vs profile locale).
--
-- Idempotent: re-running is safe.
-- ============================================================

alter table public.profiles
  add column if not exists locale text
    check (locale in ('en', 'ca', 'es'))
    default 'en';
