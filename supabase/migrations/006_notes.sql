-- Notes: AI-generated digestible notes from uploaded documents.
-- Each note is tied to one or more study_files (source_file_ids).

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  source_file_ids jsonb not null default '[]',
  title text,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_user_id on public.notes(user_id);

alter table public.notes enable row level security;
