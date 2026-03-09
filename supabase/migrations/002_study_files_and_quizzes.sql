-- Run in Supabase Dashboard → SQL Editor (after 001_subjects.sql)
-- Creates study_files and quizzes tables.
-- Storage: create a bucket named "study-files" in Dashboard → Storage → New bucket (private).

create table if not exists public.study_files (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  user_id text not null,
  name text not null,
  storage_path text not null,
  extracted_text text,
  created_at timestamptz not null default now()
);

create index if not exists study_files_subject_id on public.study_files(subject_id);
create index if not exists study_files_user_id on public.study_files(user_id);

alter table public.study_files enable row level security;

-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.study_files(id) on delete cascade,
  user_id text not null,
  questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists quizzes_user_id on public.quizzes(user_id);

alter table public.quizzes enable row level security;
