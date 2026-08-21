alter table public.notification_preferences
  add column if not exists workout_enabled boolean null,
  add column if not exists meals_enabled boolean null,
  add column if not exists checkin_enabled boolean null,
  add column if not exists sleep_enabled boolean null,
  add column if not exists workout_lead_minutes smallint null,
  add column if not exists hydration_interval_minutes smallint null,
  add column if not exists in_app_enabled boolean null,
  add column if not exists quiet_start time null,
  add column if not exists quiet_end time null,
  add column if not exists timezone text null;

update public.notification_preferences
set
  workout_enabled = coalesce(workout_enabled, workout_reminders_enabled, true),
  meals_enabled = coalesce(meals_enabled, nutrition_reminders_enabled, true),
  checkin_enabled = coalesce(checkin_enabled, weekly_check_in_enabled, true),
  sleep_enabled = coalesce(sleep_enabled, sleep_routine_enabled, false),
  workout_lead_minutes = coalesce(workout_lead_minutes, 30),
  hydration_interval_minutes = coalesce(hydration_interval_minutes, 120),
  in_app_enabled = coalesce(in_app_enabled, true),
  quiet_start = coalesce(quiet_start, quiet_hours_start),
  quiet_end = coalesce(quiet_end, quiet_hours_end),
  timezone = coalesce(timezone, preferred_timezone)
where true;

alter table public.notification_preferences
  alter column workout_enabled set default true,
  alter column meals_enabled set default true,
  alter column checkin_enabled set default true,
  alter column sleep_enabled set default false,
  alter column workout_lead_minutes set default 30,
  alter column hydration_interval_minutes set default 120,
  alter column in_app_enabled set default true;

alter table public.notification_preferences
  alter column workout_enabled set not null,
  alter column meals_enabled set not null,
  alter column checkin_enabled set not null,
  alter column sleep_enabled set not null,
  alter column workout_lead_minutes set not null,
  alter column hydration_interval_minutes set not null,
  alter column in_app_enabled set not null;

alter table public.notification_preferences
  add constraint notification_preferences_workout_lead_minutes_check
  check (workout_lead_minutes in (15, 30, 60));

alter table public.notification_preferences
  add constraint notification_preferences_hydration_interval_minutes_check
  check (hydration_interval_minutes in (0, 120, 180));

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  expiration_time timestamptz null,
  active boolean not null default true,
  last_success_at timestamptz null,
  failure_count integer not null default 0 check (failure_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  category text not null check (category in ('workout', 'meals', 'hydration', 'supplements', 'check-in', 'sleep')),
  source_table text null,
  source_id text null,
  source_reference text null,
  destination_path text not null,
  title text not null,
  body text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'ready', 'processing', 'sent', 'delivered', 'clicked', 'dismissed', 'snoozed', 'failed', 'expired', 'cancelled')),
  scheduled_for timestamptz not null,
  sent_at timestamptz null,
  delivered_at timestamptz null,
  clicked_at timestamptz null,
  dismissed_at timestamptz null,
  snoozed_until timestamptz null,
  dedupe_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  notification_reminder_id uuid not null references public.notification_reminders (id) on delete cascade,
  user_id uuid not null references public.athlete_profiles (id) on delete cascade,
  push_subscription_id uuid null references public.push_subscriptions (id) on delete set null,
  attempted_at timestamptz not null default timezone('utc', now()),
  result text not null check (result in ('sent', 'delivered', 'expired', 'gone', 'failed', 'ignored')),
  status_code integer null,
  error_code text null,
  error_detail text null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists push_subscriptions_user_id_active_idx
  on public.push_subscriptions (user_id, active);

create index if not exists notification_reminders_status_scheduled_for_idx
  on public.notification_reminders (status, scheduled_for);

create index if not exists notification_reminders_user_id_status_idx
  on public.notification_reminders (user_id, status);

create index if not exists notification_delivery_attempts_notification_reminder_id_idx
  on public.notification_delivery_attempts (notification_reminder_id);

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_notification_reminders_updated_at on public.notification_reminders;
create trigger set_notification_reminders_updated_at
before update on public.notification_reminders
for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;
alter table public.notification_reminders enable row level security;
alter table public.notification_delivery_attempts enable row level security;

drop policy if exists "Athletes can read own push subscriptions" on public.push_subscriptions;
create policy "Athletes can read own push subscriptions"
on public.push_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can insert own push subscriptions" on public.push_subscriptions;
create policy "Athletes can insert own push subscriptions"
on public.push_subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Athletes can update own push subscriptions" on public.push_subscriptions;
create policy "Athletes can update own push subscriptions"
on public.push_subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Athletes can delete own push subscriptions" on public.push_subscriptions;
create policy "Athletes can delete own push subscriptions"
on public.push_subscriptions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can read own notification reminders" on public.notification_reminders;
create policy "Athletes can read own notification reminders"
on public.notification_reminders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can update own notification reminders" on public.notification_reminders;
create policy "Athletes can update own notification reminders"
on public.notification_reminders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Athletes can delete own notification reminders" on public.notification_reminders;
create policy "Athletes can delete own notification reminders"
on public.notification_reminders
for delete
to authenticated
using (auth.uid() = user_id);

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
    workout_enabled,
    meals_enabled,
    hydration_enabled,
    supplements_enabled,
    checkin_enabled,
    sleep_enabled,
    workout_lead_minutes,
    hydration_interval_minutes,
    quiet_hours_enabled,
    quiet_start,
    quiet_end,
    timezone,
    in_app_enabled,
    reminder_intensity,
    workout_reminders_enabled,
    nutrition_reminders_enabled,
    weekly_check_in_enabled,
    sleep_routine_enabled,
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
    false,
    true,
    false,
    30,
    120,
    true,
    '22:00'::time,
    '07:00'::time,
    null,
    true,
    'recommended',
    true,
    true,
    true,
    false,
    '22:00'::time,
    '07:00'::time,
    null
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;
