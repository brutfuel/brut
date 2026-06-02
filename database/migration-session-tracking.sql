-- ============================================================
-- BRUT — Migration: Session tracking
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- Adds the two columns used when an athlete marks a session as
-- done from the BRUT RACE plan view.
-- The columns `status`, `completed_at` and `user_notes` already
-- exist in the base `sessions` table — no change needed.
-- ============================================================

alter table public.sessions
  add column if not exists felt text
    check (felt in ('easy', 'right', 'hard')),
  add column if not exists capsules_taken integer;
