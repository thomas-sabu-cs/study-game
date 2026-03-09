-- Optional display name for quizzes (user can set when creating; otherwise we show auto name in app).
alter table public.quizzes
  add column if not exists name text;
