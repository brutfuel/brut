-- ============================================================
-- BRUT — Migration: Race Day Plan
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- Creates `race_day_plans`: one per `race_plans` row (in v1 we
-- do not enforce a UNIQUE on race_plan_id — see the note below).
-- ============================================================

create table public.race_day_plans (
  id uuid default uuid_generate_v4() primary key,
  race_plan_id uuid references public.race_plans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Race profile
  course_profile text,                                 -- "flat", "rolling", "hilly", "mountainous"
  expected_temperature_c integer,
  expected_humidity_pct integer,
  expected_weather text,                               -- "sunny", "rainy", "cold", "hot"
  start_time time,                                     -- race start time

  -- Pacing strategy
  pacing_strategy text check (pacing_strategy in
    ('even', 'negative_split', 'cautious_start', 'aggressive_start')),

  -- Restrictions
  caffeine_ok boolean default true,
  preferred_gels text,                                 -- "SiS", "Maurten", "GU", "real food", etc.

  -- Generated content (JSONB to allow rich structure)
  pre_race_week jsonb,                                 -- daily plan 7 days before
  race_morning jsonb,                                  -- morning protocol
  during_race jsonb,                                   -- segment by segment / hour by hour
  post_race jsonb,                                     -- recovery 48h

  status text default 'draft' check (status in ('draft', 'finalized', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on public.race_day_plans (race_plan_id);
create index on public.race_day_plans (user_id);

alter table public.race_day_plans enable row level security;

create policy "Users manage own race day plans"
  on public.race_day_plans for all using (auth.uid() = user_id);

create trigger race_day_plans_set_updated_at
  before update on public.race_day_plans
  for each row execute procedure public.set_updated_at();
