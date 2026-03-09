-- Run in Supabase Dashboard → SQL Editor (after 003).
-- Multi-file quiz support and attempt timing.

-- Quizzes can be based on multiple files (source_file_ids). file_id remains first file for compatibility.
alter table public.quizzes
  add column if not exists source_file_ids jsonb not null default '[]';

update public.quizzes
  set source_file_ids = jsonb_build_array(file_id::text)
  where source_file_ids = '[]' or (source_file_ids is null and file_id is not null);

-- Quiz attempts store total time and per-question time (seconds).
alter table public.quiz_attempts
  add column if not exists time_seconds int not null default 0;

alter table public.quiz_attempts
  add column if not exists question_seconds jsonb not null default '[]';
