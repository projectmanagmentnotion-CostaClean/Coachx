begin;

create extension if not exists pgcrypto;

create table if not exists public.coach_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  business_name text null,
  avatar_path text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_athlete_assignments (
  id uuid primary key default gen_random_uuid(),
  coach_user_id uuid not null references auth.users(id) on delete cascade,
  athlete_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  assigned_at timestamptz not null default now(),
  ended_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coach_athlete_assignments_unique unique (coach_user_id, athlete_user_id)
);

create table if not exists public.coach_review_notes (
  id uuid primary key default gen_random_uuid(),
  coach_user_id uuid not null references auth.users(id) on delete cascade,
  athlete_user_id uuid not null references auth.users(id) on delete cascade,
  weekly_checkin_id uuid not null references public.weekly_checkins(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_action_events (
  id uuid primary key default gen_random_uuid(),
  coach_user_id uuid not null references auth.users(id) on delete cascade,
  athlete_user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('checkin_reviewed', 'checkin_acknowledged', 'followup_requested', 'recommendation_approved', 'recommendation_rejected', 'proposal_approved', 'proposal_rejected', 'note_added')),
  target_type text not null check (target_type in ('weekly_checkin', 'recommendation', 'proposal', 'athlete')),
  target_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists coach_profiles_user_id_idx on public.coach_profiles (user_id);
create index if not exists coach_assignments_coach_idx on public.coach_athlete_assignments (coach_user_id, status);
create index if not exists coach_assignments_athlete_idx on public.coach_athlete_assignments (athlete_user_id, status);
create index if not exists coach_review_notes_athlete_idx on public.coach_review_notes (athlete_user_id, weekly_checkin_id);
create index if not exists coach_action_events_coach_idx on public.coach_action_events (coach_user_id, created_at desc);
create index if not exists coach_action_events_athlete_idx on public.coach_action_events (athlete_user_id, created_at desc);

create or replace function public.coach_can_access_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.coach_athlete_assignments assignment
    where assignment.coach_user_id = auth.uid()
      and assignment.athlete_user_id = target_athlete_id
      and assignment.status = 'active'
  );
$$;

alter table public.coach_profiles enable row level security;
alter table public.coach_athlete_assignments enable row level security;
alter table public.coach_review_notes enable row level security;
alter table public.coach_action_events enable row level security;

alter table public.athlete_profiles enable row level security;
alter table public.athlete_preferences enable row level security;
alter table public.programs enable row level security;
alter table public.program_phases enable row level security;
alter table public.scheduled_workouts enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.nutrition_days enable row level security;
alter table public.nutrition_day_selections enable row level security;
alter table public.nutrition_hydration_logs enable row level security;
alter table public.nutrition_supplement_logs enable row level security;
alter table public.progress_entries enable row level security;
alter table public.progress_measurements enable row level security;
alter table public.weekly_checkins enable row level security;
alter table public.weekly_checkin_responses enable row level security;
alter table public.weekly_checkin_reviews enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.program_change_proposals enable row level security;
alter table public.program_change_events enable row level security;
alter table public.nutrition_meal_slots enable row level security;
alter table public.nutrition_meal_options enable row level security;

drop policy if exists coach_profiles_select_own on public.coach_profiles;
create policy coach_profiles_select_own on public.coach_profiles
  for select
  using (user_id = auth.uid());

drop policy if exists coach_profiles_insert_own on public.coach_profiles;
create policy coach_profiles_insert_own on public.coach_profiles
  for insert
  with check (user_id = auth.uid());

drop policy if exists coach_profiles_update_own on public.coach_profiles;
create policy coach_profiles_update_own on public.coach_profiles
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists coach_assignments_select_own on public.coach_athlete_assignments;
create policy coach_assignments_select_own on public.coach_athlete_assignments
  for select
  using (coach_user_id = auth.uid());

drop policy if exists coach_review_notes_select on public.coach_review_notes;
create policy coach_review_notes_select on public.coach_review_notes
  for select
  using (coach_user_id = auth.uid() or public.coach_can_access_athlete(athlete_user_id));

drop policy if exists coach_review_notes_insert on public.coach_review_notes;
create policy coach_review_notes_insert on public.coach_review_notes
  for insert
  with check (coach_user_id = auth.uid() and public.coach_can_access_athlete(athlete_user_id));

drop policy if exists coach_action_events_select on public.coach_action_events;
create policy coach_action_events_select on public.coach_action_events
  for select
  using (coach_user_id = auth.uid() or public.coach_can_access_athlete(athlete_user_id));

drop policy if exists coach_action_events_insert on public.coach_action_events;
create policy coach_action_events_insert on public.coach_action_events
  for insert
  with check (coach_user_id = auth.uid() and public.coach_can_access_athlete(athlete_user_id));

drop policy if exists athlete_profiles_coach_select on public.athlete_profiles;
create policy athlete_profiles_coach_select on public.athlete_profiles
  for select
  using (coach_can_access_athlete(id));

drop policy if exists athlete_preferences_coach_select on public.athlete_preferences;
create policy athlete_preferences_coach_select on public.athlete_preferences
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists programs_coach_select on public.programs;
create policy programs_coach_select on public.programs
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists program_phases_coach_select on public.program_phases;
create policy program_phases_coach_select on public.program_phases
  for select
  using (
    exists (
      select 1
      from public.programs program
      where program.id = program_phases.program_id
        and public.coach_can_access_athlete(program.user_id)
    )
  );

drop policy if exists scheduled_workouts_coach_select on public.scheduled_workouts;
create policy scheduled_workouts_coach_select on public.scheduled_workouts
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists workout_sessions_coach_select on public.workout_sessions;
create policy workout_sessions_coach_select on public.workout_sessions
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists workout_session_exercises_coach_select on public.workout_session_exercises;
create policy workout_session_exercises_coach_select on public.workout_session_exercises
  for select
  using (
    exists (
      select 1
      from public.workout_sessions session
      where session.id = workout_session_exercises.workout_session_id
        and public.coach_can_access_athlete(session.user_id)
    )
  );

drop policy if exists workout_sets_coach_select on public.workout_sets;
create policy workout_sets_coach_select on public.workout_sets
  for select
  using (
    exists (
      select 1
      from public.workout_session_exercises exercise
      join public.workout_sessions session on session.id = exercise.workout_session_id
      where exercise.id = workout_sets.workout_session_exercise_id
        and public.coach_can_access_athlete(session.user_id)
    )
  );

drop policy if exists nutrition_plans_coach_select on public.nutrition_plans;
create policy nutrition_plans_coach_select on public.nutrition_plans
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists nutrition_days_coach_select on public.nutrition_days;
create policy nutrition_days_coach_select on public.nutrition_days
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists nutrition_day_selections_coach_select on public.nutrition_day_selections;
create policy nutrition_day_selections_coach_select on public.nutrition_day_selections
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists nutrition_hydration_logs_coach_select on public.nutrition_hydration_logs;
create policy nutrition_hydration_logs_coach_select on public.nutrition_hydration_logs
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists nutrition_supplement_logs_coach_select on public.nutrition_supplement_logs;
create policy nutrition_supplement_logs_coach_select on public.nutrition_supplement_logs
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists nutrition_meal_slots_coach_select on public.nutrition_meal_slots;
create policy nutrition_meal_slots_coach_select on public.nutrition_meal_slots
  for select
  using (
    exists (
      select 1
      from public.nutrition_days day
      where day.id = nutrition_meal_slots.nutrition_day_id
        and public.coach_can_access_athlete(day.user_id)
    )
  );

drop policy if exists nutrition_meal_options_coach_select on public.nutrition_meal_options;
create policy nutrition_meal_options_coach_select on public.nutrition_meal_options
  for select
  using (
    exists (
      select 1
      from public.nutrition_meal_slots slot
      join public.nutrition_days day on day.id = slot.nutrition_day_id
      where slot.id = nutrition_meal_options.meal_slot_id
        and public.coach_can_access_athlete(day.user_id)
    )
  );

drop policy if exists progress_entries_coach_select on public.progress_entries;
create policy progress_entries_coach_select on public.progress_entries
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists progress_measurements_coach_select on public.progress_measurements;
create policy progress_measurements_coach_select on public.progress_measurements
  for select
  using (
    exists (
      select 1
      from public.progress_entries entry
      where entry.id = progress_measurements.progress_entry_id
        and public.coach_can_access_athlete(entry.user_id)
    )
  );

drop policy if exists weekly_checkins_coach_select on public.weekly_checkins;
create policy weekly_checkins_coach_select on public.weekly_checkins
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists weekly_checkin_responses_coach_select on public.weekly_checkin_responses;
create policy weekly_checkin_responses_coach_select on public.weekly_checkin_responses
  for select
  using (
    exists (
      select 1
      from public.weekly_checkins checkin
      where checkin.id = weekly_checkin_responses.weekly_checkin_id
        and public.coach_can_access_athlete(checkin.user_id)
    )
  );

drop policy if exists weekly_checkin_reviews_coach_select on public.weekly_checkin_reviews;
create policy weekly_checkin_reviews_coach_select on public.weekly_checkin_reviews
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists weekly_checkin_reviews_coach_update on public.weekly_checkin_reviews;
create policy weekly_checkin_reviews_coach_update on public.weekly_checkin_reviews
  for update
  using (coach_can_access_athlete(user_id))
  with check (coach_can_access_athlete(user_id));

drop policy if exists ai_recommendations_coach_select on public.ai_recommendations;
create policy ai_recommendations_coach_select on public.ai_recommendations
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists ai_recommendations_coach_update on public.ai_recommendations;
create policy ai_recommendations_coach_update on public.ai_recommendations
  for update
  using (coach_can_access_athlete(user_id))
  with check (coach_can_access_athlete(user_id));

drop policy if exists program_change_proposals_coach_select on public.program_change_proposals;
create policy program_change_proposals_coach_select on public.program_change_proposals
  for select
  using (coach_can_access_athlete(user_id));

drop policy if exists program_change_proposals_coach_update on public.program_change_proposals;
create policy program_change_proposals_coach_update on public.program_change_proposals
  for update
  using (coach_can_access_athlete(user_id))
  with check (coach_can_access_athlete(user_id));

drop policy if exists program_change_events_coach_select on public.program_change_events;
create policy program_change_events_coach_select on public.program_change_events
  for select
  using (coach_can_access_athlete(user_id));

commit;

