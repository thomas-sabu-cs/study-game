-- Deduplicate uploads by storing a content hash.

alter table public.study_files
  add column if not exists file_hash text,
  add column if not exists file_size int;

create index if not exists study_files_user_subject_hash
  on public.study_files(user_id, subject_id, file_hash)
  where file_hash is not null;

