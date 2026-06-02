-- ============================================================
-- BRUT — Database Schema
-- ============================================================
-- Run this in Supabase SQL Editor to create all tables.
-- Designed for Phase A (no Strava) but ready for Phase B.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  weight_kg numeric(5,2),
  primary_sport text check (primary_sport in ('running', 'cycling', 'triathlon')),
  level text check (level in ('beginner', 'amateur', 'pro')) default 'amateur',
  fcmax integer,
  ftp integer,
  acclimated boolean default false,
  sodium_diet text check (sodium_diet in ('low', 'normal', 'high')) default 'normal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. RACE_PLANS
-- ============================================================

create table public.race_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  sport text not null check (sport in ('running', 'cycling', 'triathlon')),
  distance_km numeric(6,2) not null,
  target_time_minutes integer,
  race_date date not null,
  race_name text,
  weeks_total integer not null,
  days_per_week integer not null check (days_per_week between 3 and 7),
  hours_per_week numeric(4,1),
  methodology text default 'polarized_80_20',
  status text default 'active' check (status in ('active', 'completed', 'archived', 'paused')),
  current_week integer default 1,
  generated_at timestamptz default now(),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on public.race_plans (user_id);
create index on public.race_plans (status);

alter table public.race_plans enable row level security;

create policy "Users can view own race plans"
  on public.race_plans for select using (auth.uid() = user_id);
create policy "Users can insert own race plans"
  on public.race_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own race plans"
  on public.race_plans for update using (auth.uid() = user_id);
create policy "Users can delete own race plans"
  on public.race_plans for delete using (auth.uid() = user_id);


-- ============================================================
-- 3. PHASES
-- ============================================================

create table public.phases (
  id uuid default uuid_generate_v4() primary key,
  race_plan_id uuid references public.race_plans(id) on delete cascade not null,
  name text not null check (name in ('base', 'build', 'peak', 'taper')),
  order_index integer not null,
  week_start integer not null,
  week_end integer not null,
  focus_description text,
  created_at timestamptz default now()
);

create index on public.phases (race_plan_id);

alter table public.phases enable row level security;

create policy "Users can view phases of own race plans"
  on public.phases for select using (
    exists (select 1 from public.race_plans where id = phases.race_plan_id and user_id = auth.uid())
  );
create policy "Users can manage phases of own race plans"
  on public.phases for all using (
    exists (select 1 from public.race_plans where id = phases.race_plan_id and user_id = auth.uid())
  );


-- ============================================================
-- 4. SESSIONS
-- ============================================================

create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  race_plan_id uuid references public.race_plans(id) on delete cascade not null,
  phase_id uuid references public.phases(id) on delete cascade,
  user_id uuid references auth.users(id),
  week_number integer not null,
  day_of_week integer not null check (day_of_week between 1 and 7),
  scheduled_date date,
  session_type text not null check (session_type in (
    'easy_run', 'long_run', 'tempo', 'intervals', 'hill_repeats',
    'recovery', 'race_simulation',
    'easy_ride', 'long_ride', 'sweet_spot', 'threshold',
    'swim', 'brick',
    'rest', 'cross_training', 'strength'
  )),
  duration_minutes integer not null,
  distance_km numeric(6,2),
  target_zone text,
  structure_text text,
  notes text,
  pre_session_nutrition jsonb,
  during_nutrition jsonb,
  post_session_nutrition jsonb,
  status text default 'planned' check (status in ('planned', 'completed', 'skipped', 'modified')),
  completed_at timestamptz,
  user_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on public.sessions (race_plan_id, week_number);
create index on public.sessions (scheduled_date);
create index on public.sessions (status);

alter table public.sessions enable row level security;

create policy "Users can view sessions of own race plans"
  on public.sessions for select using (
    exists (select 1 from public.race_plans where id = sessions.race_plan_id and user_id = auth.uid())
  );
create policy "Users can manage sessions of own race plans"
  on public.sessions for all using (
    exists (select 1 from public.race_plans where id = sessions.race_plan_id and user_id = auth.uid())
  );


-- ============================================================
-- 5. NUTRITION_PHASES
-- ============================================================

create table public.nutrition_phases (
  id uuid default uuid_generate_v4() primary key,
  phase_id uuid references public.phases(id) on delete cascade not null,
  carbs_g_per_kg_min numeric(4,1),
  carbs_g_per_kg_max numeric(4,1),
  protein_g_per_kg_min numeric(4,1) default 1.4,
  protein_g_per_kg_max numeric(4,1) default 1.8,
  fat_pct_of_kcal_min integer default 20,
  fat_pct_of_kcal_max integer default 35,
  hydration_ml_per_kg integer default 32,
  carb_periodisation_note text,
  timing_guidelines text,
  food_focus text,
  things_to_avoid text,
  created_at timestamptz default now()
);

alter table public.nutrition_phases enable row level security;

create policy "Users can view nutrition phases of own plans"
  on public.nutrition_phases for select using (
    exists (
      select 1 from public.phases p
      join public.race_plans rp on rp.id = p.race_plan_id
      where p.id = nutrition_phases.phase_id and rp.user_id = auth.uid()
    )
  );
create policy "Users can manage nutrition phases of own plans"
  on public.nutrition_phases for all using (
    exists (
      select 1 from public.phases p
      join public.race_plans rp on rp.id = p.race_plan_id
      where p.id = nutrition_phases.phase_id and rp.user_id = auth.uid()
    )
  );


-- ============================================================
-- 6. STRAVA (Phase B placeholder)
-- ============================================================

create table public.strava_tokens (
  user_id uuid references auth.users(id) on delete cascade primary key,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  athlete_id bigint,
  scope text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.strava_tokens enable row level security;

create policy "Users can view own strava tokens"
  on public.strava_tokens for select using (auth.uid() = user_id);
create policy "Users can manage own strava tokens"
  on public.strava_tokens for all using (auth.uid() = user_id);


create table public.strava_activities (
  id bigint primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  type text,
  sport_type text,
  start_date timestamptz,
  elapsed_time_seconds integer,
  moving_time_seconds integer,
  distance_meters numeric(10,2),
  total_elevation_gain_meters numeric(8,2),
  average_speed_ms numeric(6,3),
  average_heartrate integer,
  max_heartrate integer,
  average_watts integer,
  weighted_average_watts integer,
  linked_session_id uuid references public.sessions(id) on delete set null,
  raw_data jsonb,
  created_at timestamptz default now()
);

create index on public.strava_activities (user_id, start_date desc);

alter table public.strava_activities enable row level security;

create policy "Users can view own activities"
  on public.strava_activities for select using (auth.uid() = user_id);
create policy "Users can manage own activities"
  on public.strava_activities for all using (auth.uid() = user_id);


-- ============================================================
-- 7. Triggers for updated_at
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger race_plans_set_updated_at
  before update on public.race_plans
  for each row execute procedure public.set_updated_at();

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute procedure public.set_updated_at();

create trigger strava_tokens_set_updated_at
  before update on public.strava_tokens
  for each row execute procedure public.set_updated_at();
