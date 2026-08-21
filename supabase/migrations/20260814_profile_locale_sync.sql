create or replace function public.normalize_locale(raw_locale text)
returns text
language plpgsql
immutable
as $$
declare
  normalized text;
begin
  normalized := lower(trim(coalesce(raw_locale, '')));

  if normalized like 'es%' then
    return 'es';
  end if;

  if normalized like 'ca%' then
    return 'ca';
  end if;

  if normalized like 'en%' then
    return 'en';
  end if;

  if normalized like 'de%' then
    return 'de';
  end if;

  if normalized in ('es', 'ca', 'en', 'de') then
    return normalized;
  end if;

  return 'es';
end;
$$;

alter table public.athlete_profiles
  add column if not exists locale text not null default 'es';

alter table public.athlete_profiles
  alter column locale set default 'es';

update public.athlete_profiles
set locale = public.normalize_locale(coalesce(locale, 'es'))
where locale is distinct from public.normalize_locale(coalesce(locale, 'es'));

alter table public.athlete_profiles
  alter column locale set not null;

alter table public.athlete_profiles
  drop constraint if exists athlete_profiles_locale_check;

alter table public.athlete_profiles
  add constraint athlete_profiles_locale_check
  check (locale in ('es', 'ca', 'en', 'de'));

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name_value text;
  locale_value text;
begin
  display_name_value :=
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1),
      'Athlete'
    );

  locale_value := public.normalize_locale(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'locale', ''),
      nullif(new.raw_user_meta_data ->> 'language', ''),
      nullif(new.raw_user_meta_data ->> 'lang', ''),
      'es'
    )
  );

  insert into public.athlete_profiles (
    id,
    display_name,
    age_years,
    date_of_birth,
    height_cm,
    weight_kg,
    unit_system,
    locale,
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
    locale_value,
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
