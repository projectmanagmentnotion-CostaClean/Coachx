create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  program_id uuid null references public.programs (id) on delete set null,
  program_phase_id uuid null references public.program_phases (id) on delete set null,
  week_start_date date not null,
  week_end_date date not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'submitted', 'reviewed')),
  started_at timestamptz null,
  completed_at timestamptz null,
  submitted_at timestamptz null,
  overall_notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, week_start_date)
);

create table if not exists public.weekly_checkin_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  weekly_checkin_id uuid not null references public.weekly_checkins (id) on delete cascade,
  question_key text not null,
  response_type text not null check (response_type in ('scale', 'boolean', 'text', 'single_choice', 'multiple_choice', 'numeric')),
  numeric_value numeric(8, 2) null,
  text_value text null,
  boolean_value boolean null,
  choice_value text null,
  json_value jsonb null,
  answered_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (weekly_checkin_id, question_key)
);

create table if not exists public.weekly_checkin_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  weekly_checkin_id uuid not null unique references public.weekly_checkins (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'needs_attention', 'reviewed', 'acknowledged')),
  review_reason jsonb not null default '{}'::jsonb,
  review_notes text null,
  recommendation_type text null,
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.athlete_profiles (id) on delete cascade,
  master_enabled boolean not null default true,
  workout_reminders_enabled boolean not null default true,
  program_updates_enabled boolean not null default true,
  weekly_check_in_enabled boolean not null default true,
  measurements_enabled boolean not null default true,
  progress_photos_enabled boolean not null default true,
  phase_reviews_enabled boolean not null default true,
  nutrition_reminders_enabled boolean not null default false,
  hydration_enabled boolean not null default true,
  supplements_enabled boolean not null default false,
  sleep_routine_enabled boolean not null default false,
  adaptive_alerts_enabled boolean not null default true,
  reminder_intensity text not null default 'recommended' check (reminder_intensity in ('minimal', 'recommended', 'more-support')),
  quiet_hours_enabled boolean not null default true,
  quiet_hours_start time null,
  quiet_hours_end time null,
  preferred_timezone text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_weekly_checkins_updated_at on public.weekly_checkins;
create trigger set_weekly_checkins_updated_at
before update on public.weekly_checkins
for each row execute function public.set_updated_at();

drop trigger if exists set_weekly_checkin_responses_updated_at on public.weekly_checkin_responses;
create trigger set_weekly_checkin_responses_updated_at
before update on public.weekly_checkin_responses
for each row execute function public.set_updated_at();

drop trigger if exists set_weekly_checkin_reviews_updated_at on public.weekly_checkin_reviews;
create trigger set_weekly_checkin_reviews_updated_at
before update on public.weekly_checkin_reviews
for each row execute function public.set_updated_at();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
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

  insert into public.notification_preferences (
    user_id,
    master_enabled,
    workout_reminders_enabled,
    program_updates_enabled,
    weekly_check_in_enabled,
    measurements_enabled,
    progress_photos_enabled,
    phase_reviews_enabled,
    nutrition_reminders_enabled,
    hydration_enabled,
    supplements_enabled,
    sleep_routine_enabled,
    adaptive_alerts_enabled,
    reminder_intensity,
    quiet_hours_enabled,
    quiet_hours_start,
    quiet_hours_end,
    preferred_timezone
  )
  values (
    new.id,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    false,
    false,
    true,
    'recommended',
    true,
    '22:00'::time,
    '07:00'::time,
    null
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

alter table public.weekly_checkins enable row level security;
alter table public.weekly_checkin_responses enable row level security;
alter table public.weekly_checkin_reviews enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "Athletes can read own weekly check-ins" on public.weekly_checkins;
create policy "Athletes can read own weekly check-ins"
on public.weekly_checkins
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can insert own weekly check-ins" on public.weekly_checkins;
create policy "Athletes can insert own weekly check-ins"
on public.weekly_checkins
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Athletes can update own weekly check-ins" on public.weekly_checkins;
create policy "Athletes can update own weekly check-ins"
on public.weekly_checkins
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Athletes can delete own weekly check-ins" on public.weekly_checkins;
create policy "Athletes can delete own weekly check-ins"
on public.weekly_checkins
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can read own weekly check-in responses" on public.weekly_checkin_responses;
create policy "Athletes can read own weekly check-in responses"
on public.weekly_checkin_responses
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.weekly_checkins
    where weekly_checkins.id = weekly_checkin_responses.weekly_checkin_id
      and weekly_checkins.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own weekly check-in responses" on public.weekly_checkin_responses;
create policy "Athletes can insert own weekly check-in responses"
on public.weekly_checkin_responses
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.weekly_checkins
    where weekly_checkins.id = weekly_checkin_responses.weekly_checkin_id
      and weekly_checkins.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own weekly check-in responses" on public.weekly_checkin_responses;
create policy "Athletes can update own weekly check-in responses"
on public.weekly_checkin_responses
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.weekly_checkins
    where weekly_checkins.id = weekly_checkin_responses.weekly_checkin_id
      and weekly_checkins.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.weekly_checkins
    where weekly_checkins.id = weekly_checkin_responses.weekly_checkin_id
      and weekly_checkins.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can delete own weekly check-in responses" on public.weekly_checkin_responses;
create policy "Athletes can delete own weekly check-in responses"
on public.weekly_checkin_responses
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.weekly_checkins
    where weekly_checkins.id = weekly_checkin_responses.weekly_checkin_id
      and weekly_checkins.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own weekly check-in reviews" on public.weekly_checkin_reviews;
create policy "Athletes can read own weekly check-in reviews"
on public.weekly_checkin_reviews
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.weekly_checkins
    where weekly_checkins.id = weekly_checkin_reviews.weekly_checkin_id
      and weekly_checkins.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can insert own weekly check-in reviews" on public.weekly_checkin_reviews;
create policy "Athletes can insert own weekly check-in reviews"
on public.weekly_checkin_reviews
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.weekly_checkins
    where weekly_checkins.id = weekly_checkin_reviews.weekly_checkin_id
      and weekly_checkins.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can update own weekly check-in reviews" on public.weekly_checkin_reviews;
create policy "Athletes can update own weekly check-in reviews"
on public.weekly_checkin_reviews
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.weekly_checkins
    where weekly_checkins.id = weekly_checkin_reviews.weekly_checkin_id
      and weekly_checkins.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.weekly_checkins
    where weekly_checkins.id = weekly_checkin_reviews.weekly_checkin_id
      and weekly_checkins.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can delete own weekly check-in reviews" on public.weekly_checkin_reviews;
create policy "Athletes can delete own weekly check-in reviews"
on public.weekly_checkin_reviews
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.weekly_checkins
    where weekly_checkins.id = weekly_checkin_reviews.weekly_checkin_id
      and weekly_checkins.user_id = auth.uid()
  )
);

drop policy if exists "Athletes can read own notification preferences" on public.notification_preferences;
create policy "Athletes can read own notification preferences"
on public.notification_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can insert own notification preferences" on public.notification_preferences;
create policy "Athletes can insert own notification preferences"
on public.notification_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Athletes can update own notification preferences" on public.notification_preferences;
create policy "Athletes can update own notification preferences"
on public.notification_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Athletes can delete own notification preferences" on public.notification_preferences;
create policy "Athletes can delete own notification preferences"
on public.notification_preferences
for delete
to authenticated
using (auth.uid() = user_id);
