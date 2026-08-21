create table if not exists public.program_change_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recommendation_id uuid null references public.ai_recommendations (id) on delete set null,
  program_id uuid null references public.programs (id) on delete set null,
  program_phase_id uuid null references public.program_phases (id) on delete set null,
  change_type text not null check (change_type in (
    'exercise_swap',
    'set_adjustment',
    'rep_range_adjustment',
    'load_guidance',
    'volume_adjustment',
    'workout_reschedule',
    'workout_frequency_adjustment',
    'recovery_adjustment',
    'phase_extension',
    'phase_transition'
  )),
  status text not null default 'draft' check (status in ('draft', 'proposed', 'needs_review', 'approved', 'rejected', 'applied', 'failed', 'superseded', 'expired')),
  target_entity_type text not null check (target_entity_type in ('workout_template_exercise', 'scheduled_workout', 'program_phase')),
  target_entity_id uuid null,
  change_command jsonb not null,
  before_snapshot jsonb not null,
  after_snapshot jsonb not null,
  reason text not null,
  validation_result jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  approved_at timestamptz null,
  applied_at timestamptz null,
  rejected_at timestamptz null
);

create unique index if not exists program_change_proposals_recommendation_uidx
  on public.program_change_proposals (recommendation_id);

create index if not exists program_change_proposals_user_created_idx
  on public.program_change_proposals (user_id, created_at desc);

create index if not exists program_change_proposals_user_status_idx
  on public.program_change_proposals (user_id, status, created_at desc);

create index if not exists program_change_proposals_program_idx
  on public.program_change_proposals (program_id, program_phase_id, created_at desc);

drop trigger if exists set_program_change_proposals_updated_at on public.program_change_proposals;
create trigger set_program_change_proposals_updated_at
before update on public.program_change_proposals
for each row execute function public.set_updated_at();

alter table public.program_change_proposals enable row level security;

drop policy if exists "Athletes can read own program change proposals" on public.program_change_proposals;
create policy "Athletes can read own program change proposals"
on public.program_change_proposals
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Athletes can insert own program change proposals" on public.program_change_proposals;
create policy "Athletes can insert own program change proposals"
on public.program_change_proposals
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Athletes can update own program change proposals" on public.program_change_proposals;
create policy "Athletes can update own program change proposals"
on public.program_change_proposals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Athletes can delete own program change proposals" on public.program_change_proposals;
create policy "Athletes can delete own program change proposals"
on public.program_change_proposals
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.program_change_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id uuid null references public.programs (id) on delete set null,
  proposal_id uuid not null references public.program_change_proposals (id) on delete cascade,
  recommendation_id uuid null references public.ai_recommendations (id) on delete set null,
  change_type text not null check (change_type in (
    'exercise_swap',
    'set_adjustment',
    'rep_range_adjustment',
    'load_guidance',
    'volume_adjustment',
    'workout_reschedule',
    'workout_frequency_adjustment',
    'recovery_adjustment',
    'phase_extension',
    'phase_transition'
  )),
  before_snapshot jsonb not null,
  after_snapshot jsonb not null,
  source text not null default 'deterministic' check (source in ('ai', 'deterministic', 'athlete', 'coach')),
  applied_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists program_change_events_proposal_uidx
  on public.program_change_events (proposal_id);

create index if not exists program_change_events_user_created_idx
  on public.program_change_events (user_id, created_at desc);

alter table public.program_change_events enable row level security;

drop policy if exists "Athletes can read own program change events" on public.program_change_events;
create policy "Athletes can read own program change events"
on public.program_change_events
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.apply_program_change_proposal(p_proposal_id uuid)
returns public.program_change_proposals
language plpgsql
security definer
set search_path = public
as $$
declare
  proposal public.program_change_proposals%rowtype;
  template_exercise public.workout_template_exercises%rowtype;
  scheduled_workout public.scheduled_workouts%rowtype;
  phase_row public.program_phases%rowtype;
  updated_proposal public.program_change_proposals%rowtype;
  event_source text := 'deterministic';
  current_now timestamptz := timezone('utc', now());
  current_state_updated_at timestamptz;
begin
  select *
  into proposal
  from public.program_change_proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception 'Program change proposal not found.';
  end if;

  if auth.uid() is null or proposal.user_id <> auth.uid() then
    raise exception 'Not authorized to apply this program change proposal.';
  end if;

  if proposal.status = 'applied' then
    return proposal;
  end if;

  if proposal.status in ('rejected', 'failed', 'expired') then
    raise exception 'This proposal can no longer be applied.';
  end if;

  if coalesce((proposal.validation_result ->> 'status'), 'approved') <> 'approved' then
    raise exception 'This proposal requires review before application.';
  end if;

  case proposal.change_type
    when 'exercise_swap' then
      select pte.*
      into template_exercise
      from public.workout_template_exercises pte
      join public.workout_templates wt on wt.id = pte.workout_template_id
      join public.program_phases ph on ph.id = wt.phase_id
      join public.programs pr on pr.id = ph.program_id
      where pte.id = proposal.target_entity_id
        and pr.user_id = proposal.user_id
      for update of pte;

      if not found then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The target exercise was no longer available.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      current_state_updated_at := template_exercise.updated_at;
      if proposal.source_updated_at is not null and current_state_updated_at <> proposal.source_updated_at then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The exercise changed after the proposal was created.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      update public.workout_template_exercises
      set exercise_key = (proposal.change_command ->> 'toExerciseId'),
          updated_at = current_now
      where id = template_exercise.id
      returning * into template_exercise;

      event_source := case when proposal.recommendation_id is null then 'deterministic' else 'ai' end;

      insert into public.program_change_events (
        user_id,
        program_id,
        proposal_id,
        recommendation_id,
        change_type,
        before_snapshot,
        after_snapshot,
        source,
        applied_at
      ) values (
        proposal.user_id,
        proposal.program_id,
        proposal.id,
        proposal.recommendation_id,
        proposal.change_type,
        proposal.before_snapshot,
        proposal.after_snapshot,
        event_source,
        current_now
      );

    when 'set_adjustment' then
      select pte.*
      into template_exercise
      from public.workout_template_exercises pte
      join public.workout_templates wt on wt.id = pte.workout_template_id
      join public.program_phases ph on ph.id = wt.phase_id
      join public.programs pr on pr.id = ph.program_id
      where pte.id = proposal.target_entity_id
        and pr.user_id = proposal.user_id
      for update of pte;

      if not found then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The target exercise was no longer available.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      current_state_updated_at := template_exercise.updated_at;
      if proposal.source_updated_at is not null and current_state_updated_at <> proposal.source_updated_at then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The exercise changed after the proposal was created.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      update public.workout_template_exercises
      set sets = (proposal.change_command ->> 'proposedSets')::int,
          updated_at = current_now
      where id = template_exercise.id
      returning * into template_exercise;

      event_source := case when proposal.recommendation_id is null then 'deterministic' else 'ai' end;

      insert into public.program_change_events (
        user_id,
        program_id,
        proposal_id,
        recommendation_id,
        change_type,
        before_snapshot,
        after_snapshot,
        source,
        applied_at
      ) values (
        proposal.user_id,
        proposal.program_id,
        proposal.id,
        proposal.recommendation_id,
        proposal.change_type,
        proposal.before_snapshot,
        proposal.after_snapshot,
        event_source,
        current_now
      );

    when 'rep_range_adjustment' then
      select pte.*
      into template_exercise
      from public.workout_template_exercises pte
      join public.workout_templates wt on wt.id = pte.workout_template_id
      join public.program_phases ph on ph.id = wt.phase_id
      join public.programs pr on pr.id = ph.program_id
      where pte.id = proposal.target_entity_id
        and pr.user_id = proposal.user_id
      for update of pte;

      if not found then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The target exercise was no longer available.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      current_state_updated_at := template_exercise.updated_at;
      if proposal.source_updated_at is not null and current_state_updated_at <> proposal.source_updated_at then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The exercise changed after the proposal was created.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      update public.workout_template_exercises
      set rep_min = (proposal.change_command ->> 'proposedMin')::int,
          rep_max = (proposal.change_command ->> 'proposedMax')::int,
          updated_at = current_now
      where id = template_exercise.id
      returning * into template_exercise;

      event_source := case when proposal.recommendation_id is null then 'deterministic' else 'ai' end;

      insert into public.program_change_events (
        user_id,
        program_id,
        proposal_id,
        recommendation_id,
        change_type,
        before_snapshot,
        after_snapshot,
        source,
        applied_at
      ) values (
        proposal.user_id,
        proposal.program_id,
        proposal.id,
        proposal.recommendation_id,
        proposal.change_type,
        proposal.before_snapshot,
        proposal.after_snapshot,
        event_source,
        current_now
      );

    when 'workout_reschedule' then
      select sw.*
      into scheduled_workout
      from public.scheduled_workouts sw
      where sw.id = proposal.target_entity_id
        and sw.user_id = proposal.user_id
      for update of sw;

      if not found then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The scheduled workout was no longer available.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      current_state_updated_at := scheduled_workout.updated_at;
      if proposal.source_updated_at is not null and current_state_updated_at <> proposal.source_updated_at then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The scheduled workout changed after the proposal was created.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      if exists (
        select 1
        from public.scheduled_workouts sw
        where sw.user_id = proposal.user_id
          and sw.id <> scheduled_workout.id
          and sw.scheduled_date = (proposal.change_command ->> 'toDate')
      ) then
        update public.program_change_proposals
        set status = 'failed',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('Another workout already exists on the proposed date.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      update public.scheduled_workouts
      set scheduled_date = (proposal.change_command ->> 'toDate'),
          status = 'rescheduled',
          adjustment_metadata = jsonb_build_object(
            'from_date', proposal.change_command ->> 'fromDate',
            'to_date', proposal.change_command ->> 'toDate',
            'reason', proposal.reason
          ),
          updated_at = current_now
      where id = scheduled_workout.id
      returning * into scheduled_workout;

      event_source := case when proposal.recommendation_id is null then 'deterministic' else 'ai' end;

      insert into public.program_change_events (
        user_id,
        program_id,
        proposal_id,
        recommendation_id,
        change_type,
        before_snapshot,
        after_snapshot,
        source,
        applied_at
      ) values (
        proposal.user_id,
        proposal.program_id,
        proposal.id,
        proposal.recommendation_id,
        proposal.change_type,
        proposal.before_snapshot,
        proposal.after_snapshot,
        event_source,
        current_now
      );

    when 'phase_extension' then
      select ph.*
      into phase_row
      from public.program_phases ph
      join public.programs pr on pr.id = ph.program_id
      where ph.id = proposal.target_entity_id
        and pr.user_id = proposal.user_id
      for update of ph;

      if not found then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The phase was no longer available.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      current_state_updated_at := phase_row.updated_at;
      if proposal.source_updated_at is not null and current_state_updated_at <> proposal.source_updated_at then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The phase changed after the proposal was created.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      update public.program_phases
      set end_date = (proposal.change_command ->> 'proposedEndDate'),
          week_count = week_count + 1,
          updated_at = current_now
      where id = phase_row.id
      returning * into phase_row;

      event_source := case when proposal.recommendation_id is null then 'deterministic' else 'ai' end;

      insert into public.program_change_events (
        user_id,
        program_id,
        proposal_id,
        recommendation_id,
        change_type,
        before_snapshot,
        after_snapshot,
        source,
        applied_at
      ) values (
        proposal.user_id,
        proposal.program_id,
        proposal.id,
        proposal.recommendation_id,
        proposal.change_type,
        proposal.before_snapshot,
        proposal.after_snapshot,
        event_source,
        current_now
      );
  end case;

  update public.program_change_proposals
  set status = 'applied',
      approved_at = coalesce(approved_at, current_now),
      applied_at = current_now,
      updated_at = current_now
  where id = proposal.id
  returning * into updated_proposal;

  if proposal.recommendation_id is not null then
    update public.ai_recommendations
    set application_status = 'applied',
        applied_at = current_now,
        applied_change_summary = jsonb_build_object(
          'proposalId', updated_proposal.id,
          'changeType', updated_proposal.change_type,
          'targetEntityType', updated_proposal.target_entity_type,
          'status', updated_proposal.status
        ),
        updated_at = current_now
    where id = proposal.recommendation_id
      and user_id = proposal.user_id;
  end if;

  return updated_proposal;
end;
$$;
