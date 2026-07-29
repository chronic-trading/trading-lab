-- ── Trading Lab · Supabase Schema ────────────────────────────────────────────
-- Run this in the Supabase SQL editor (supabase.com → project → SQL Editor)

-- Builds
create table if not exists builds (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  instrument  text not null,
  concept_ids text[]  default '{}',
  notes       text    default '',
  created_at  timestamptz default now()
);

-- Journal entries
create table if not exists journal_entries (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        text not null,
  instrument  text not null,
  direction   text not null,
  result      text not null,
  mode        text default 'live',
  killzone    text,
  concept_ids text[]  default '{}',
  points      float,
  notes       text    default '',
  created_at  timestamptz default now(),
  -- Trade Grader result this trade was taken on (null = ungraded).
  grade_letter text,
  grade_score  int
);

-- Safe to re-run on a database created before the grade columns existed.
alter table journal_entries add column if not exists grade_letter text;
alter table journal_entries add column if not exists grade_score  int;

-- Session plans
create table if not exists plans (
  id         text primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  data       jsonb not null,
  created_at timestamptz default now()
);

-- Single-row per user: mastery, notes, bookmarks, settings, rules, key_levels, session_notes
create table if not exists user_data (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  mastery       jsonb default '{}',
  review        jsonb default '{}',  -- spaced-repetition card states + daily log
  concept_notes jsonb default '{}',
  rules         jsonb default '[]',
  settings      jsonb default '{}',
  bookmarks     jsonb default '[]',
  key_levels    jsonb default '{}',
  session_notes text  default '',
  cross_site    jsonb default '{}'   -- Phase 3: shared progress from ict-replay + ict-glossary
);

-- Additive, idempotent — safe to run against the existing live table to enable
-- cross-site progress sync (ict-replay scores/trades/streak, glossary learned terms).
alter table user_data add column if not exists cross_site jsonb default '{}';

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table builds         enable row level security;
alter table journal_entries enable row level security;
alter table plans           enable row level security;
alter table user_data       enable row level security;

create policy "users own builds"          on builds          for all using (auth.uid() = user_id);
create policy "users own journal_entries" on journal_entries for all using (auth.uid() = user_id);
create policy "users own plans"           on plans           for all using (auth.uid() = user_id);
create policy "users own user_data"       on user_data       for all using (auth.uid() = user_id);
