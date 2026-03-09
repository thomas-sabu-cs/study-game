-- Label quiz_attempts by game type: 'quiz', 'match', or 'flip' (default 'quiz').

alter table public.quiz_attempts
  add column if not exists game_type text not null default 'quiz';

create index if not exists quiz_attempts_user_game_type
  on public.quiz_attempts(user_id, game_type, created_at desc);

