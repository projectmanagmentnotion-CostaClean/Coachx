create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  status text not null default 'proposed' check (status in ('proposed', 'active', 'completed', 'archived')),
  name text not null,
  goal text not null,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists programs_one_active_per_user
  on public.programs (user_id)
  where status = 'active';

create table if not exists public.program_phases (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  name text not null,
  phase_number integer not null check (phase_number >= 1),
  goal text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed', 'archived')),
  week_count integer not null check (week_count >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (program_id, phase_number)
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.program_phases (id) on delete cascade,
  name text not null,
  code text not null,
  focus text not null,
  estimated_duration_minutes integer not null check (estimated_duration_minutes > 0),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (phase_id, code)
);

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references public.workout_templates (id) on delete cascade,
  exercise_key text not null,
  sort_order integer not null check (sort_order >= 0),
  sets integer not null check (sets > 0),
  rep_min integer not null check (rep_min > 0),
  rep_max integer not null check (rep_max >= rep_min),
  rir_min integer not null check (rir_min >= 0),
  rir_max integer not null check (rir_max >= rir_min),
  rest_seconds integer not null check (rest_seconds > 0),
  notes text null,
  prescription_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.scheduled_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  program_phase_id uuid not null references public.program_phases (id) on delete cascade,
  workout_template_id uuid not null references public.workout_templates (id) on delete cascade,
  scheduled_date date not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'skipped', 'rescheduled', 'cancelled')),
  planned_duration_minutes integer not null check (planned_duration_minutes > 0),
  adjustment_metadata jsonb null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, scheduled_date)
);

drop trigger if exists set_programs_updated_at on public.programs;
create trigger set_programs_updated_at
before update on public.programs
for each row execute function public.set_updated_at();

drop trigger if exists set_program_phases_updated_at on public.program_phases;
create trigger set_program_phases_updated_at
before update on public.program_phases
for each row execute function public.set_updated_at();

drop trigger if exists set_workout_templates_updated_at on public.workout_templates;
create trigger set_workout_templates_updated_at
before update on public.workout_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_workout_template_exercises_updated_at on public.workout_template_exercises;
create trigger set_workout_template_exercises_updated_at
before update on public.workout_template_exercises
for each row execute function public.set_updated_at();

drop trigger if exists set_scheduled_workouts_updated_at on public.scheduled_workouts;
create trigger set_scheduled_workouts_updated_at
before update on public.scheduled_workouts
for each row execute function public.set_updated_at();

alter table public.programs enable row level security;
alter table public.program_phases enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.scheduled_workouts enable row level security;

drop policy if exists "Athletes can read own programs" on public.programs;
create policy "Athletes can read own programs"
on public.programs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can insert own programs" on public.programs;
create policy "Athletes can insert own programs"
on public.programs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Athletes can update own programs" on public.programs;
create policy "Athletes can update own programs"
on public.programs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Athletes can read own phases" on public.program_phases;
create policy "Athletes can read own phases"
on public.program_phases
for select
to authenticated
using (
  exists (
    select 1
    from public.programs
    where programs.id = program_phases.program_id
      and programs.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own phases" on public.program_phases;
create policy "Athletes can insert own phases"
on public.program_phases
for insert
to authenticated
with check (
  exists (
    select 1
    from public.programs
    where programs.id = program_phases.program_id
      and programs.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own phases" on public.program_phases;
create policy "Athletes can update own phases"
on public.program_phases
for update
to authenticated
using (
  exists (
    select 1
    from public.programs
    where programs.id = program_phases.program_id
      and programs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.programs
    where programs.id = program_phases.program_id
      and programs.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own workout templates" on public.workout_templates;
create policy "Athletes can read own workout templates"
on public.workout_templates
for select
to authenticated
using (
  exists (
    select 1
    from public.program_phases
    join public.programs on programs.id = program_phases.program_id
    where program_phases.id = workout_templates.phase_id
      and programs.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own workout templates" on public.workout_templates;
create policy "Athletes can insert own workout templates"
on public.workout_templates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.program_phases
    join public.programs on programs.id = program_phases.program_id
    where program_phases.id = workout_templates.phase_id
      and programs.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own workout templates" on public.workout_templates;
create policy "Athletes can update own workout templates"
on public.workout_templates
for update
to authenticated
using (
  exists (
    select 1
    from public.program_phases
    join public.programs on programs.id = program_phases.program_id
    where program_phases.id = workout_templates.phase_id
      and programs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.program_phases
    join public.programs on programs.id = program_phases.program_id
    where program_phases.id = workout_templates.phase_id
      and programs.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own template exercises" on public.workout_template_exercises;
create policy "Athletes can read own template exercises"
on public.workout_template_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_templates
    join public.program_phases on program_phases.id = workout_templates.phase_id
    join public.programs on programs.id = program_phases.program_id
    where workout_templates.id = workout_template_exercises.workout_template_id
      and programs.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own template exercises" on public.workout_template_exercises;
create policy "Athletes can insert own template exercises"
on public.workout_template_exercises
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_templates
    join public.program_phases on program_phases.id = workout_templates.phase_id
    join public.programs on programs.id = program_phases.program_id
    where workout_templates.id = workout_template_exercises.workout_template_id
      and programs.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own template exercises" on public.workout_template_exercises;
create policy "Athletes can update own template exercises"
on public.workout_template_exercises
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_templates
    join public.program_phases on program_phases.id = workout_templates.phase_id
    join public.programs on programs.id = program_phases.program_id
    where workout_templates.id = workout_template_exercises.workout_template_id
      and programs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_templates
    join public.program_phases on program_phases.id = workout_templates.phase_id
    join public.programs on programs.id = program_phases.program_id
    where workout_templates.id = workout_template_exercises.workout_template_id
      and programs.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own scheduled workouts" on public.scheduled_workouts;
create policy "Athletes can read own scheduled workouts"
on public.scheduled_workouts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can insert own scheduled workouts" on public.scheduled_workouts;
create policy "Athletes can insert own scheduled workouts"
on public.scheduled_workouts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Athletes can update own scheduled workouts" on public.scheduled_workouts;
create policy "Athletes can update own scheduled workouts"
on public.scheduled_workouts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
