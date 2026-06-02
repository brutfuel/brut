-- ============================================================
-- BRUT — Migration: Race plan generation
-- ============================================================
-- Run this in the Supabase SQL Editor AFTER schema.sql.
-- Adds the generator inputs to race_plans and aligns
-- sessions.session_type with the lib/calculations vocabulary.
-- ============================================================

-- ------------------------------------------------------------
-- 1. race_plans — new generator inputs
-- ------------------------------------------------------------
alter table public.race_plans
  add column if not exists surface text
    check (surface in ('track-road', 'trail', 'road', 'gravel', 'mtb')),
  add column if not exists elevation_gain_m integer,
  add column if not exists experience_level text
    check (experience_level in ('beginner', 'amateur', 'pro'))
    default 'amateur',
  add column if not exists current_weekly_volume_hours numeric(4, 1),
  add column if not exists longest_recent_session_hours numeric(4, 1),
  add column if not exists hr_max integer,
  add column if not exists ftp integer,
  add column if not exists preferred_time text
    check (preferred_time in
      ('early-morning', 'morning', 'afternoon', 'evening', 'night'))
    default 'morning',
  add column if not exists training_days integer[];

-- ------------------------------------------------------------
-- 2. sessions — align session_type with lib/calculations
--    (hyphenated SessionType vocabulary) and add a structured
--    jsonb column for the warm-up / main / cool-down object.
-- ------------------------------------------------------------
alter table public.sessions
  drop constraint if exists sessions_session_type_check;

alter table public.sessions
  add constraint sessions_session_type_check check (session_type in (
    -- running
    'easy-run', 'long-run', 'tempo', 'intervals', 'hill-repeats',
    'recovery', 'race-simulation',
    -- cycling
    'endurance', 'long-ride', 'sweet-spot', 'threshold',
    'hill-repeats-bike', 'recovery-bike', 'race-simulation-bike',
    -- triathlon
    'swim', 'brick', 'long-combined', 'recovery-tri',
    -- shared
    'rest'
  ));

alter table public.sessions
  add column if not exists structure jsonb;
