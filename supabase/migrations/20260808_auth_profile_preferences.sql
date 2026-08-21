create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.athlete_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Athlete',
  age_years integer null,
  date_of_birth date null,
  height_cm numeric(5,2) null,
  weight_kg numeric(5,2) null,
  unit_system text not null default 'metric' check (unit_system in ('metric', 'imperial')),
  onboarding_status text not null default 'not_started' check (onboarding_status in ('not_started', 'in_progress', 'completed')),
  onboarding_completed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.athlete_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.athlete_profiles (id) on delete cascade,
  goals jsonb not null default '{}'::jsonb,
  training_preferences jsonb not null default '{}'::jsonb,
  schedule_lifestyle jsonb not null default '{}'::jsonb,
  health_limitations jsonb not null default '{}'::jsonb,
  nutrition_preferences jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_athlete_profiles_updated_at on public.athlete_profiles;
create trigger set_athlete_profiles_updated_at
before update on public.athlete_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_athlete_preferences_updated_at on public.athlete_preferences;
create trigger set_athlete_preferences_updated_at
before update on public.athlete_preferences
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name_value text;
begin
  display_name_value :=
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1),
      'Athlete'
    );

  insert into public.athlete_profiles (
    id,
    display_name,
    age_years,
    date_of_birth,
    height_cm,
    weight_kg,
    unit_system,
    onboarding_status,
    onboarding_completed_at
  )
  values (
    new.id,
    display_name_value,
    null,
    null,
    null,
    null,
    coalesce(nullif(new.raw_user_meta_data ->> 'unit_system', ''), 'metric'),
    'not_started',
    null
  )
  on conflict (id) do nothing;

  insert into public.athlete_preferences (
    user_id,
    goals,
    training_preferences,
    schedule_lifestyle,
    health_limitations,
    nutrition_preferences,
    version
  )
  values (
    new.id,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    1
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.athlete_profiles enable row level security;
alter table public.athlete_preferences enable row level security;

drop policy if exists "Athletes can read own profile" on public.athlete_profiles;
create policy "Athletes can read own profile"
on public.athlete_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Athletes can insert own profile" on public.athlete_profiles;
create policy "Athletes can insert own profile"
on public.athlete_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Athletes can update own profile" on public.athlete_profiles;
create policy "Athletes can update own profile"
on public.athlete_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Athletes can read own preferences" on public.athlete_preferences;
create policy "Athletes can read own preferences"
on public.athlete_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can insert own preferences" on public.athlete_preferences;
create policy "Athletes can insert own preferences"
on public.athlete_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Athletes can update own preferences" on public.athlete_preferences;
create policy "Athletes can update own preferences"
on public.athlete_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
