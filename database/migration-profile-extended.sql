-- ============================================================
-- BRUT — Migration: Profile extended fields
-- ============================================================
-- Run this in the Supabase SQL Editor AFTER schema.sql and the
-- earlier migrations. Adds identity, capacity, PRs, physiology,
-- health, hydration and logistics columns to `profiles`.
-- Existing columns (full_name, weight_kg, primary_sport, level,
-- fcmax, ftp, acclimated, sodium_diet) are left untouched.
-- ============================================================

-- ------------------------------------------------------------
-- Identity
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists age integer
    check (age is null or (age between 14 and 90)),
  add column if not exists gender text
    check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  add column if not exists height_cm numeric(5, 2);

-- ------------------------------------------------------------
-- Capacity
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists years_training integer,
  add column if not exists weekly_volume_hours numeric(4, 1),
  add column if not exists longest_recent_session_km numeric(5, 2);

-- ------------------------------------------------------------
-- Personal records (PRs) — flexible JSONB
-- Expected shape:
--   {
--     "5k_minutes": 22.5,
--     "10k_minutes": 47,
--     "half_minutes": 105,
--     "marathon_minutes": 230,
--     "ftp_watts": 250,
--     "twenty_min_watts": 270,
--     "olympic_swim_minutes": 24,
--     "sprint_bike_minutes": 38
--   }
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists prs jsonb default '{}'::jsonb;

-- ------------------------------------------------------------
-- Physiology
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists fcrest integer,
  add column if not exists vo2max numeric(4, 1);

-- ------------------------------------------------------------
-- Health
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists injuries text,
  add column if not exists dietary_restrictions text[],
  add column if not exists medically_cleared boolean default false;

-- ------------------------------------------------------------
-- Hydration profile (BRUT-specific)
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists known_sweat_rate_lh numeric(3, 2);

-- ------------------------------------------------------------
-- Logistics
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists typical_training_time text
    check (typical_training_time in
      ('early_morning', 'morning', 'afternoon', 'evening', 'night')),
  add column if not exists typical_terrain text[];
