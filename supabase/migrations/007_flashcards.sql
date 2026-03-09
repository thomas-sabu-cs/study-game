-- Flashcards / notecards for study.

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  front text not null,
  back text not null,
  source_note_id uuid references public.notes(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists flashcards_user_id on public.flashcards(user_id);

alter table public.flashcards enable row level security;

