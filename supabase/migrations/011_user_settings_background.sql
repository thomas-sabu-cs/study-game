-- Per-user UI settings (e.g. background mode).

create table if not exists public.user_settings (
  user_id text primary key,
  background_mode text not null default 'stars', -- 'stars' | 'perlin'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

