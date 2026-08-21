create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  entry_type text not null check (entry_type in ('measurement', 'photo', 'combined', 'checkpoint')),
  weight_kg numeric null check (weight_kg is null or weight_kg > 0),
  notes text null,
  source text not null check (source in ('manual', 'onboarding_baseline', 'phase_review', 'other')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, entry_date, source)
);

create table if not exists public.progress_measurements (
  id uuid primary key default gen_random_uuid(),
  progress_entry_id uuid not null references public.progress_entries(id) on delete cascade,
  measurement_key text not null check (measurement_key in ('waist', 'hips', 'thigh')),
  value_cm numeric not null check (value_cm > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (progress_entry_id, measurement_key)
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_entry_id uuid not null references public.progress_entries(id) on delete cascade,
  pose text not null check (pose in ('front', 'side', 'back')),
  storage_bucket text not null default 'progress-photos',
  storage_path text not null,
  captured_at timestamptz null,
  uploaded_at timestamptz not null default timezone('utc', now()),
  width integer null,
  height integer null,
  mime_type text null,
  file_size_bytes bigint null check (file_size_bytes is null or file_size_bytes >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (progress_entry_id, pose)
);

create index if not exists progress_entries_user_id_entry_date_idx on public.progress_entries (user_id, entry_date desc);
create index if not exists progress_measurements_progress_entry_id_idx on public.progress_measurements (progress_entry_id);
create index if not exists progress_photos_user_id_progress_entry_id_idx on public.progress_photos (user_id, progress_entry_id);

drop trigger if exists set_progress_entries_updated_at on public.progress_entries;
create trigger set_progress_entries_updated_at
before update on public.progress_entries
for each row execute function public.set_updated_at();

drop trigger if exists set_progress_measurements_updated_at on public.progress_measurements;
create trigger set_progress_measurements_updated_at
before update on public.progress_measurements
for each row execute function public.set_updated_at();

drop trigger if exists set_progress_photos_updated_at on public.progress_photos;
create trigger set_progress_photos_updated_at
before update on public.progress_photos
for each row execute function public.set_updated_at();

alter table public.progress_entries enable row level security;
alter table public.progress_measurements enable row level security;
alter table public.progress_photos enable row level security;

drop policy if exists "progress_entries_select_own" on public.progress_entries;
create policy "progress_entries_select_own"
on public.progress_entries
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "progress_entries_insert_own" on public.progress_entries;
create policy "progress_entries_insert_own"
on public.progress_entries
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "progress_entries_update_own" on public.progress_entries;
create policy "progress_entries_update_own"
on public.progress_entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "progress_measurements_select_own" on public.progress_measurements;
create policy "progress_measurements_select_own"
on public.progress_measurements
for select
to authenticated
using (
  exists (
    select 1
    from public.progress_entries entry
    where entry.id = progress_measurements.progress_entry_id
      and entry.user_id = auth.uid()
  )
);

drop policy if exists "progress_measurements_insert_own" on public.progress_measurements;
create policy "progress_measurements_insert_own"
on public.progress_measurements
for insert
to authenticated
with check (
  exists (
    select 1
    from public.progress_entries entry
    where entry.id = progress_measurements.progress_entry_id
      and entry.user_id = auth.uid()
  )
);

drop policy if exists "progress_measurements_update_own" on public.progress_measurements;
create policy "progress_measurements_update_own"
on public.progress_measurements
for update
to authenticated
using (
  exists (
    select 1
    from public.progress_entries entry
    where entry.id = progress_measurements.progress_entry_id
      and entry.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.progress_entries entry
    where entry.id = progress_measurements.progress_entry_id
      and entry.user_id = auth.uid()
  )
);

drop policy if exists "progress_photos_select_own" on public.progress_photos;
create policy "progress_photos_select_own"
on public.progress_photos
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "progress_photos_insert_own" on public.progress_photos;
create policy "progress_photos_insert_own"
on public.progress_photos
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "progress_photos_update_own" on public.progress_photos;
create policy "progress_photos_update_own"
on public.progress_photos
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "progress_photos_delete_own" on public.progress_photos;
create policy "progress_photos_delete_own"
on public.progress_photos
for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "progress_photos_bucket_select_own" on storage.objects;
create policy "progress_photos_bucket_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'progress-photos'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "progress_photos_bucket_insert_own" on storage.objects;
create policy "progress_photos_bucket_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'progress-photos'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "progress_photos_bucket_update_own" on storage.objects;
create policy "progress_photos_bucket_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'progress-photos'
  and auth.uid()::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'progress-photos'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "progress_photos_bucket_delete_own" on storage.objects;
create policy "progress_photos_bucket_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'progress-photos'
  and auth.uid()::text = split_part(name, '/', 1)
);
