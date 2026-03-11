-- Card folders (decks) for organizing notecards. Many-to-many with flashcards.

create table if not exists public.card_folders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

create index if not exists card_folders_user_id on public.card_folders(user_id);

create table if not exists public.card_folder_members (
  card_id uuid not null references public.flashcards(id) on delete cascade,
  folder_id uuid not null references public.card_folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, folder_id)
);

create index if not exists card_folder_members_folder_id on public.card_folder_members(folder_id);

alter table public.card_folders enable row level security;
alter table public.card_folder_members enable row level security;
