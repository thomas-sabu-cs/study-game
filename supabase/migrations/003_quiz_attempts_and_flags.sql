-- Run in Supabase Dashboard → SQL Editor (after 002).
-- Saves quiz attempts and question flags/reports for review.

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id text not null,
  score int not null,
  total int not null,
  answers jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_quiz_id on public.quiz_attempts(quiz_id);
create index if not exists quiz_attempts_user_id on public.quiz_attempts(user_id);

alter table public.quiz_attempts enable row level security;

-- ---------------------------------------------------------------------------
create table if not exists public.question_flags (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_id text not null,
  flag_type text not null check (flag_type in ('review', 'report')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists question_flags_user_id on public.question_flags(user_id);
create index if not exists question_flags_quiz_id on public.question_flags(quiz_id);

alter table public.question_flags enable row level security;
