-- Run this in Supabase Dashboard → SQL Editor (or use Supabase CLI: supabase db push)
-- Creates subjects table. RLS is enabled; no policy = anon key cannot access.
-- Server uses SUPABASE_SERVICE_ROLE_KEY to manage subjects (filtered by Clerk user_id).

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;

-- No policy: anon gets no access. App uses service role on server and filters by user_id.
