create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  program_id uuid null references public.programs (id) on delete set null,
  status text not null default 'proposed' check (status in ('proposed', 'active', 'completed', 'archived')),
  name text not null,
  daily_calorie_target integer not null check (daily_calorie_target > 0),
  protein_target_g numeric(8, 1) not null check (protein_target_g >= 0),
  carb_target_g numeric(8, 1) not null check (carb_target_g >= 0),
  fat_target_g numeric(8, 1) not null check (fat_target_g >= 0),
  fiber_target_g numeric(8, 1) null check (fiber_target_g >= 0),
  water_target_ml integer null check (water_target_ml >= 0),
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz null,
  plan_metadata jsonb null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists nutrition_plans_one_active_per_user
  on public.nutrition_plans (user_id)
  where status = 'active';

create table if not exists public.nutrition_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  nutrition_plan_id uuid not null references public.nutrition_plans (id) on delete cascade,
  program_phase_id uuid null references public.program_phases (id) on delete set null,
  scheduled_workout_id uuid null references public.scheduled_workouts (id) on delete set null,
  calendar_date date not null,
  day_type text not null default 'training' check (day_type in ('training', 'rest', 'custom')),
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed')),
  calorie_target integer not null check (calorie_target > 0),
  protein_target_g numeric(8, 1) not null check (protein_target_g >= 0),
  carb_target_g numeric(8, 1) not null check (carb_target_g >= 0),
  fat_target_g numeric(8, 1) not null check (fat_target_g >= 0),
  water_target_ml integer null check (water_target_ml >= 0),
  day_metadata jsonb null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, calendar_date)
);

create table if not exists public.nutrition_meal_slots (
  id uuid primary key default gen_random_uuid(),
  nutrition_day_id uuid not null references public.nutrition_days (id) on delete cascade,
  slot_key text not null,
  name text not null,
  sort_order integer not null check (sort_order >= 0),
  target_calories integer not null check (target_calories > 0),
  target_protein_g numeric(8, 1) not null check (target_protein_g >= 0),
  target_carb_g numeric(8, 1) not null check (target_carb_g >= 0),
  target_fat_g numeric(8, 1) not null check (target_fat_g >= 0),
  notes text null,
  slot_metadata jsonb null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (nutrition_day_id, slot_key)
);

create table if not exists public.nutrition_meal_options (
  id uuid primary key default gen_random_uuid(),
  meal_slot_id uuid not null references public.nutrition_meal_slots (id) on delete cascade,
  option_key text not null,
  name text not null,
  description text not null,
  ingredients jsonb not null default '[]'::jsonb,
  calories integer not null check (calories > 0),
  protein_g numeric(8, 1) not null check (protein_g >= 0),
  carb_g numeric(8, 1) not null check (carb_g >= 0),
  fat_g numeric(8, 1) not null check (fat_g >= 0),
  portion_notes text null,
  measurement_basis text not null default 'serving' check (measurement_basis in ('raw', 'cooked', 'prepared', 'serving', 'unit')),
  allergen_metadata jsonb null,
  restriction_metadata jsonb null,
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (meal_slot_id, option_key)
);

create table if not exists public.nutrition_day_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  nutrition_day_id uuid not null references public.nutrition_days (id) on delete cascade,
  meal_slot_id uuid not null references public.nutrition_meal_slots (id) on delete cascade,
  meal_option_id uuid not null references public.nutrition_meal_options (id) on delete restrict,
  status text not null default 'selected' check (status in ('selected', 'eaten', 'skipped')),
  selected_at timestamptz not null default timezone('utc', now()),
  eaten_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (nutrition_day_id, meal_slot_id)
);

create table if not exists public.nutrition_hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  nutrition_day_id uuid not null references public.nutrition_days (id) on delete cascade,
  amount_ml integer not null check (amount_ml > 0),
  logged_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.nutrition_supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  nutrition_day_id uuid not null references public.nutrition_days (id) on delete cascade,
  supplement_key text not null,
  label text not null,
  dosage text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  completed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (nutrition_day_id, supplement_key)
);

drop trigger if exists set_nutrition_plans_updated_at on public.nutrition_plans;
create trigger set_nutrition_plans_updated_at
before update on public.nutrition_plans
for each row execute function public.set_updated_at();

drop trigger if exists set_nutrition_days_updated_at on public.nutrition_days;
create trigger set_nutrition_days_updated_at
before update on public.nutrition_days
for each row execute function public.set_updated_at();

drop trigger if exists set_nutrition_meal_slots_updated_at on public.nutrition_meal_slots;
create trigger set_nutrition_meal_slots_updated_at
before update on public.nutrition_meal_slots
for each row execute function public.set_updated_at();

drop trigger if exists set_nutrition_meal_options_updated_at on public.nutrition_meal_options;
create trigger set_nutrition_meal_options_updated_at
before update on public.nutrition_meal_options
for each row execute function public.set_updated_at();

drop trigger if exists set_nutrition_day_selections_updated_at on public.nutrition_day_selections;
create trigger set_nutrition_day_selections_updated_at
before update on public.nutrition_day_selections
for each row execute function public.set_updated_at();

drop trigger if exists set_nutrition_hydration_logs_updated_at on public.nutrition_hydration_logs;
create trigger set_nutrition_hydration_logs_updated_at
before update on public.nutrition_hydration_logs
for each row execute function public.set_updated_at();

drop trigger if exists set_nutrition_supplement_logs_updated_at on public.nutrition_supplement_logs;
create trigger set_nutrition_supplement_logs_updated_at
before update on public.nutrition_supplement_logs
for each row execute function public.set_updated_at();

alter table public.nutrition_plans enable row level security;
alter table public.nutrition_days enable row level security;
alter table public.nutrition_meal_slots enable row level security;
alter table public.nutrition_meal_options enable row level security;
alter table public.nutrition_day_selections enable row level security;
alter table public.nutrition_hydration_logs enable row level security;
alter table public.nutrition_supplement_logs enable row level security;

drop policy if exists "Athletes can read own nutrition plans" on public.nutrition_plans;
create policy "Athletes can read own nutrition plans"
on public.nutrition_plans
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can insert own nutrition plans" on public.nutrition_plans;
create policy "Athletes can insert own nutrition plans"
on public.nutrition_plans
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Athletes can update own nutrition plans" on public.nutrition_plans;
create policy "Athletes can update own nutrition plans"
on public.nutrition_plans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Athletes can delete own nutrition plans" on public.nutrition_plans;
create policy "Athletes can delete own nutrition plans"
on public.nutrition_plans
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can read own nutrition days" on public.nutrition_days;
create policy "Athletes can read own nutrition days"
on public.nutrition_days
for select
to authenticated
using (
  exists (
    select 1
    from public.nutrition_plans
    where nutrition_plans.id = nutrition_days.nutrition_plan_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own nutrition days" on public.nutrition_days;
create policy "Athletes can insert own nutrition days"
on public.nutrition_days
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_plans
    where nutrition_plans.id = nutrition_days.nutrition_plan_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own nutrition days" on public.nutrition_days;
create policy "Athletes can update own nutrition days"
on public.nutrition_days
for update
to authenticated
using (
  exists (
    select 1
    from public.nutrition_plans
    where nutrition_plans.id = nutrition_days.nutrition_plan_id
      and nutrition_plans.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_plans
    where nutrition_plans.id = nutrition_days.nutrition_plan_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can delete own nutrition days" on public.nutrition_days;
create policy "Athletes can delete own nutrition days"
on public.nutrition_days
for delete
to authenticated
using (
  exists (
    select 1
    from public.nutrition_plans
    where nutrition_plans.id = nutrition_days.nutrition_plan_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own meal slots" on public.nutrition_meal_slots;
create policy "Athletes can read own meal slots"
on public.nutrition_meal_slots
for select
to authenticated
using (
  exists (
    select 1
    from public.nutrition_days
    join public.nutrition_plans on nutrition_plans.id = nutrition_days.nutrition_plan_id
    where nutrition_days.id = nutrition_meal_slots.nutrition_day_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own meal slots" on public.nutrition_meal_slots;
create policy "Athletes can insert own meal slots"
on public.nutrition_meal_slots
for insert
to authenticated
with check (
  exists (
    select 1
    from public.nutrition_days
    join public.nutrition_plans on nutrition_plans.id = nutrition_days.nutrition_plan_id
    where nutrition_days.id = nutrition_meal_slots.nutrition_day_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own meal slots" on public.nutrition_meal_slots;
create policy "Athletes can update own meal slots"
on public.nutrition_meal_slots
for update
to authenticated
using (
  exists (
    select 1
    from public.nutrition_days
    join public.nutrition_plans on nutrition_plans.id = nutrition_days.nutrition_plan_id
    where nutrition_days.id = nutrition_meal_slots.nutrition_day_id
      and nutrition_plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.nutrition_days
    join public.nutrition_plans on nutrition_plans.id = nutrition_days.nutrition_plan_id
    where nutrition_days.id = nutrition_meal_slots.nutrition_day_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can delete own meal slots" on public.nutrition_meal_slots;
create policy "Athletes can delete own meal slots"
on public.nutrition_meal_slots
for delete
to authenticated
using (
  exists (
    select 1
    from public.nutrition_days
    join public.nutrition_plans on nutrition_plans.id = nutrition_days.nutrition_plan_id
    where nutrition_days.id = nutrition_meal_slots.nutrition_day_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own meal options" on public.nutrition_meal_options;
create policy "Athletes can read own meal options"
on public.nutrition_meal_options
for select
to authenticated
using (
  exists (
    select 1
    from public.nutrition_meal_slots
    join public.nutrition_days on nutrition_days.id = nutrition_meal_slots.nutrition_day_id
    join public.nutrition_plans on nutrition_plans.id = nutrition_days.nutrition_plan_id
    where nutrition_meal_slots.id = nutrition_meal_options.meal_slot_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own meal options" on public.nutrition_meal_options;
create policy "Athletes can insert own meal options"
on public.nutrition_meal_options
for insert
to authenticated
with check (
  exists (
    select 1
    from public.nutrition_meal_slots
    join public.nutrition_days on nutrition_days.id = nutrition_meal_slots.nutrition_day_id
    join public.nutrition_plans on nutrition_plans.id = nutrition_days.nutrition_plan_id
    where nutrition_meal_slots.id = nutrition_meal_options.meal_slot_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own meal options" on public.nutrition_meal_options;
create policy "Athletes can update own meal options"
on public.nutrition_meal_options
for update
to authenticated
using (
  exists (
    select 1
    from public.nutrition_meal_slots
    join public.nutrition_days on nutrition_days.id = nutrition_meal_slots.nutrition_day_id
    join public.nutrition_plans on nutrition_plans.id = nutrition_days.nutrition_plan_id
    where nutrition_meal_slots.id = nutrition_meal_options.meal_slot_id
      and nutrition_plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.nutrition_meal_slots
    join public.nutrition_days on nutrition_days.id = nutrition_meal_slots.nutrition_day_id
    join public.nutrition_plans on nutrition_plans.id = nutrition_days.nutrition_plan_id
    where nutrition_meal_slots.id = nutrition_meal_options.meal_slot_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can delete own meal options" on public.nutrition_meal_options;
create policy "Athletes can delete own meal options"
on public.nutrition_meal_options
for delete
to authenticated
using (
  exists (
    select 1
    from public.nutrition_meal_slots
    join public.nutrition_days on nutrition_days.id = nutrition_meal_slots.nutrition_day_id
    join public.nutrition_plans on nutrition_plans.id = nutrition_days.nutrition_plan_id
    where nutrition_meal_slots.id = nutrition_meal_options.meal_slot_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own meal selections" on public.nutrition_day_selections;
create policy "Athletes can read own meal selections"
on public.nutrition_day_selections
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_day_selections.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own meal selections" on public.nutrition_day_selections;
create policy "Athletes can insert own meal selections"
on public.nutrition_day_selections
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_day_selections.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own meal selections" on public.nutrition_day_selections;
create policy "Athletes can update own meal selections"
on public.nutrition_day_selections
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_day_selections.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_day_selections.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can delete own meal selections" on public.nutrition_day_selections;
create policy "Athletes can delete own meal selections"
on public.nutrition_day_selections
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_day_selections.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own hydration logs" on public.nutrition_hydration_logs;
create policy "Athletes can read own hydration logs"
on public.nutrition_hydration_logs
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_hydration_logs.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own hydration logs" on public.nutrition_hydration_logs;
create policy "Athletes can insert own hydration logs"
on public.nutrition_hydration_logs
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_hydration_logs.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own hydration logs" on public.nutrition_hydration_logs;
create policy "Athletes can update own hydration logs"
on public.nutrition_hydration_logs
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_hydration_logs.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_hydration_logs.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can delete own hydration logs" on public.nutrition_hydration_logs;
create policy "Athletes can delete own hydration logs"
on public.nutrition_hydration_logs
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_hydration_logs.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own supplement logs" on public.nutrition_supplement_logs;
create policy "Athletes can read own supplement logs"
on public.nutrition_supplement_logs
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_supplement_logs.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own supplement logs" on public.nutrition_supplement_logs;
create policy "Athletes can insert own supplement logs"
on public.nutrition_supplement_logs
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_supplement_logs.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own supplement logs" on public.nutrition_supplement_logs;
create policy "Athletes can update own supplement logs"
on public.nutrition_supplement_logs
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_supplement_logs.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_supplement_logs.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can delete own supplement logs" on public.nutrition_supplement_logs;
create policy "Athletes can delete own supplement logs"
on public.nutrition_supplement_logs
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.nutrition_days
    where nutrition_days.id = nutrition_supplement_logs.nutrition_day_id
      and nutrition_days.user_id = auth.uid()
  )
);
