begin;

alter table public.athlete_profiles
  add column if not exists avatar_path text null;

commit;
