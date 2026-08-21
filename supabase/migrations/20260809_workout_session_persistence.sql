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

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  scheduled_workout_id uuid null references public.scheduled_workouts (id) on delete set null,
  workout_template_id uuid null references public.workout_templates (id) on delete set null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz null,
  duration_seconds integer null check (duration_seconds >= 0),
  notes text null,
  session_metadata jsonb null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, scheduled_workout_id)
);

create index if not exists workout_sessions_user_id_idx on public.workout_sessions (user_id);
create index if not exists workout_sessions_status_idx on public.workout_sessions (status);
create index if not exists workout_sessions_started_at_idx on public.workout_sessions (started_at desc);
create index if not exists workout_sessions_scheduled_workout_id_idx on public.workout_sessions (scheduled_workout_id);

create table if not exists public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions (id) on delete cascade,
  prescribed_template_exercise_id uuid null references public.workout_template_exercises (id) on delete set null,
  prescribed_exercise_key text not null,
  performed_exercise_key text not null,
  sort_order integer not null check (sort_order >= 0),
  target_sets integer null check (target_sets >= 0),
  rep_min integer null check (rep_min >= 0),
  rep_max integer null check (rep_max >= 0),
  rir_min numeric(4, 2) null check (rir_min >= 0),
  rir_max numeric(4, 2) null check (rir_max >= 0),
  rest_seconds integer null check (rest_seconds >= 0),
  notes text null,
  swap_reason text null,
  status text not null default 'planned' check (status in ('planned', 'completed', 'skipped')),
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workout_session_id, prescribed_template_exercise_id)
);

create index if not exists workout_session_exercises_session_id_idx on public.workout_session_exercises (workout_session_id);
create index if not exists workout_session_exercises_sort_order_idx on public.workout_session_exercises (workout_session_id, sort_order);
create index if not exists workout_session_exercises_performed_key_idx on public.workout_session_exercises (performed_exercise_key);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_session_exercise_id uuid not null references public.workout_session_exercises (id) on delete cascade,
  set_number integer not null check (set_number >= 1),
  status text not null default 'planned' check (status in ('planned', 'completed', 'skipped')),
  weight_kg numeric(8, 2) null check (weight_kg >= 0),
  reps integer null check (reps >= 0),
  rir numeric(4, 2) null check (rir >= 0),
  completed_at timestamptz null,
  notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workout_session_exercise_id, set_number)
);

create index if not exists workout_sets_session_exercise_id_idx on public.workout_sets (workout_session_exercise_id);
create index if not exists workout_sets_status_idx on public.workout_sets (status);

drop trigger if exists set_workout_sessions_updated_at on public.workout_sessions;
create trigger set_workout_sessions_updated_at
before update on public.workout_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_workout_session_exercises_updated_at on public.workout_session_exercises;
create trigger set_workout_session_exercises_updated_at
before update on public.workout_session_exercises
for each row execute function public.set_updated_at();

drop trigger if exists set_workout_sets_updated_at on public.workout_sets;
create trigger set_workout_sets_updated_at
before update on public.workout_sets
for each row execute function public.set_updated_at();

alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.workout_sets enable row level security;

drop policy if exists "Athletes can read own workout sessions" on public.workout_sessions;
create policy "Athletes can read own workout sessions"
on public.workout_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can insert own workout sessions" on public.workout_sessions;
create policy "Athletes can insert own workout sessions"
on public.workout_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Athletes can update own workout sessions" on public.workout_sessions;
create policy "Athletes can update own workout sessions"
on public.workout_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Athletes can read own workout session exercises" on public.workout_session_exercises;
create policy "Athletes can read own workout session exercises"
on public.workout_session_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_exercises.workout_session_id
      and workout_sessions.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own workout session exercises" on public.workout_session_exercises;
create policy "Athletes can insert own workout session exercises"
on public.workout_session_exercises
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_exercises.workout_session_id
      and workout_sessions.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own workout session exercises" on public.workout_session_exercises;
create policy "Athletes can update own workout session exercises"
on public.workout_session_exercises
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_exercises.workout_session_id
      and workout_sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_exercises.workout_session_id
      and workout_sessions.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own workout sets" on public.workout_sets;
create policy "Athletes can read own workout sets"
on public.workout_sets
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_session_exercises
    join public.workout_sessions on workout_sessions.id = workout_session_exercises.workout_session_id
    where workout_session_exercises.id = workout_sets.workout_session_exercise_id
      and workout_sessions.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own workout sets" on public.workout_sets;
create policy "Athletes can insert own workout sets"
on public.workout_sets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_session_exercises
    join public.workout_sessions on workout_sessions.id = workout_session_exercises.workout_session_id
    where workout_session_exercises.id = workout_sets.workout_session_exercise_id
      and workout_sessions.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own workout sets" on public.workout_sets;
create policy "Athletes can update own workout sets"
on public.workout_sets
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_session_exercises
    join public.workout_sessions on workout_sessions.id = workout_session_exercises.workout_session_id
    where workout_session_exercises.id = workout_sets.workout_session_exercise_id
      and workout_sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_session_exercises
    join public.workout_sessions on workout_sessions.id = workout_session_exercises.workout_session_id
    where workout_session_exercises.id = workout_sets.workout_session_exercise_id
      and workout_sessions.user_id = auth.uid()
  )
);

create or replace function public.complete_workout_session(
  p_workout_session_id uuid,
  p_duration_seconds integer default null,
  p_notes text default null
)
returns public.workout_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.workout_sessions;
begin
  update public.workout_sessions
  set
    status = 'completed',
    completed_at = timezone('utc', now()),
    duration_seconds = coalesce(p_duration_seconds, duration_seconds),
    notes = coalesce(p_notes, notes)
  where id = p_workout_session_id
    and user_id = auth.uid()
  returning * into v_session;

  if not found then
    raise exception 'Workout session not found';
  end if;

  if v_session.scheduled_workout_id is not null then
    update public.scheduled_workouts
    set status = 'completed'
    where id = v_session.scheduled_workout_id
      and user_id = auth.uid();
  end if;

  return v_session;
end;
$$;
