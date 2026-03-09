-- Soft delete for quizzes: deleted_at set = move to "Recently deleted".
-- Permanently delete = actual row delete (from Recently deleted).

alter table public.quizzes
  add column if not exists deleted_at timestamptz;

create index if not exists quizzes_deleted_at on public.quizzes(deleted_at) where deleted_at is not null;
