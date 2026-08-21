begin;

create or replace function public.coach_can_access_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.coach_profiles profile
    join public.coach_athlete_assignments assignment
      on assignment.coach_user_id = profile.user_id
    where profile.user_id = auth.uid()
      and profile.status = 'active'
      and assignment.athlete_user_id = target_athlete_id
      and assignment.status = 'active'
  );
$$;

revoke all on function public.coach_can_access_athlete(uuid) from public;
grant execute on function public.coach_can_access_athlete(uuid) to authenticated;

create or replace function public.coach_update_own_profile(
  p_display_name text default null,
  p_business_name text default null,
  p_clear_business_name boolean default false,
  p_avatar_path text default null,
  p_clear_avatar_path boolean default false
)
returns public.coach_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  coach_row public.coach_profiles%rowtype;
  clean_display_name text := nullif(btrim(coalesce(p_display_name, '')), '');
  clean_business_name text := nullif(btrim(coalesce(p_business_name, '')), '');
  clean_avatar_path text := nullif(btrim(coalesce(p_avatar_path, '')), '');
  current_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into coach_row
  from public.coach_profiles
  where user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Coach profile not found.';
  end if;

  if coach_row.status <> 'active' then
    raise exception 'This coach profile is not active.';
  end if;

  update public.coach_profiles
  set display_name = coalesce(clean_display_name, coach_row.display_name),
      business_name = case
        when p_clear_business_name then null
        when p_business_name is null then coach_row.business_name
        else clean_business_name
      end,
      avatar_path = case
        when p_clear_avatar_path then null
        when p_avatar_path is null then coach_row.avatar_path
        else clean_avatar_path
      end,
      updated_at = current_now
  where id = coach_row.id
  returning * into coach_row;

  return coach_row;
end;
$$;

revoke all on function public.coach_update_own_profile(text, text, boolean, text, boolean) from public;
grant execute on function public.coach_update_own_profile(text, text, boolean, text, boolean) to authenticated;

revoke insert, update on public.coach_profiles from anon, authenticated;

drop policy if exists coach_profiles_update_own on public.coach_profiles;

create or replace function public.coach_mark_checkin_reviewed(
  p_weekly_checkin_id uuid,
  p_action text,
  p_note text default null
)
returns public.weekly_checkin_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  checkin_row public.weekly_checkins%rowtype;
  review_row public.weekly_checkin_reviews%rowtype;
  clean_note text := nullif(btrim(coalesce(p_note, '')), '');
  normalized_action text := lower(coalesce(p_action, ''));
  current_now timestamptz := timezone('utc', now());
  event_action text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if normalized_action not in ('reviewed', 'acknowledged', 'needs_followup') then
    raise exception 'Unsupported coach check-in action.';
  end if;

  select *
  into checkin_row
  from public.weekly_checkins
  where id = p_weekly_checkin_id
  for update;

  if not found then
    raise exception 'Weekly check-in not found.';
  end if;

  if not public.coach_can_access_athlete(checkin_row.user_id) then
    raise exception 'Not authorized to review this check-in.';
  end if;

  select *
  into review_row
  from public.weekly_checkin_reviews
  where weekly_checkin_id = p_weekly_checkin_id
  for update;

  if not found then
    raise exception 'Weekly check-in review not found.';
  end if;

  update public.weekly_checkin_reviews
  set status = case
        when normalized_action = 'acknowledged' then 'acknowledged'
        when normalized_action = 'needs_followup' then 'needs_attention'
        else 'reviewed'
      end,
      reviewed_at = current_now,
      updated_at = current_now
  where id = review_row.id
  returning * into review_row;

  if clean_note is not null then
    insert into public.coach_review_notes (
      coach_user_id,
      athlete_user_id,
      weekly_checkin_id,
      note,
      created_at,
      updated_at
    ) values (
      auth.uid(),
      checkin_row.user_id,
      p_weekly_checkin_id,
      clean_note,
      current_now,
      current_now
    );
  end if;

  event_action := case
    when normalized_action = 'acknowledged' then 'checkin_acknowledged'
    when normalized_action = 'needs_followup' then 'followup_requested'
    else 'checkin_reviewed'
  end;

  insert into public.coach_action_events (
    coach_user_id,
    athlete_user_id,
    action_type,
    target_type,
    target_id,
    metadata,
    created_at
  ) values (
    auth.uid(),
    checkin_row.user_id,
    event_action,
    'weekly_checkin',
    p_weekly_checkin_id,
    jsonb_build_object(
      'action', normalized_action,
      'note', clean_note
    ),
    current_now
  );

  return review_row;
end;
$$;

create or replace function public.coach_decide_recommendation(
  p_recommendation_id uuid,
  p_decision text
)
returns public.ai_recommendations
language plpgsql
security definer
set search_path = public
as $$
declare
  recommendation_row public.ai_recommendations%rowtype;
  normalized_decision text := lower(coalesce(p_decision, ''));
  current_now timestamptz := timezone('utc', now());
  event_action text;
  next_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if normalized_decision not in ('approve', 'reject') then
    raise exception 'Unsupported recommendation decision.';
  end if;

  select *
  into recommendation_row
  from public.ai_recommendations
  where id = p_recommendation_id
  for update;

  if not found then
    raise exception 'Recommendation not found.';
  end if;

  if not public.coach_can_access_athlete(recommendation_row.user_id) then
    raise exception 'Not authorized to decide this recommendation.';
  end if;

  if recommendation_row.application_status = 'applied' then
    raise exception 'This recommendation can no longer be changed.';
  end if;

  if recommendation_row.application_status = 'recommended' then
    next_status := case
      when normalized_decision = 'reject' then 'rejected'
      else 'reviewing'
    end;
  elsif recommendation_row.application_status = 'reviewing' then
    next_status := case
      when normalized_decision = 'reject' then 'rejected'
      else 'reviewing'
    end;
  elsif recommendation_row.application_status = 'rejected' then
    if normalized_decision = 'approve' then
      raise exception 'Rejected recommendations cannot be approved.';
    end if;

    next_status := 'rejected';
  else
    raise exception 'This recommendation can no longer be changed.';
  end if;

  update public.ai_recommendations
  set application_status = next_status,
      updated_at = current_now
  where id = recommendation_row.id
  returning * into recommendation_row;

  event_action := case
    when normalized_decision = 'reject' then 'recommendation_rejected'
    else 'recommendation_approved'
  end;

  insert into public.coach_action_events (
    coach_user_id,
    athlete_user_id,
    action_type,
    target_type,
    target_id,
    metadata,
    created_at
  ) values (
    auth.uid(),
    recommendation_row.user_id,
    event_action,
    'recommendation',
    p_recommendation_id,
    jsonb_build_object(
      'decision', normalized_decision,
      'applicationStatus', recommendation_row.application_status
    ),
    current_now
  );

  return recommendation_row;
end;
$$;

create or replace function public.coach_decide_program_change_proposal(
  p_proposal_id uuid,
  p_decision text
)
returns public.program_change_proposals
language plpgsql
security definer
set search_path = public
as $$
declare
  proposal_row public.program_change_proposals%rowtype;
  normalized_decision text := lower(coalesce(p_decision, ''));
  current_now timestamptz := timezone('utc', now());
  event_action text;
  next_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if normalized_decision not in ('approve', 'reject') then
    raise exception 'Unsupported proposal decision.';
  end if;

  select *
  into proposal_row
  from public.program_change_proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception 'Program change proposal not found.';
  end if;

  if not public.coach_can_access_athlete(proposal_row.user_id) then
    raise exception 'Not authorized to decide this proposal.';
  end if;

  if proposal_row.status in ('applied', 'failed', 'superseded', 'expired') then
    raise exception 'This proposal can no longer be changed.';
  end if;

  if normalized_decision = 'approve' then
    if proposal_row.status in ('proposed', 'needs_review') then
      next_status := 'approved';
    elsif proposal_row.status = 'approved' then
      next_status := 'approved';
    else
      raise exception 'This proposal cannot be approved in its current state.';
    end if;
  else
    if proposal_row.status in ('proposed', 'needs_review', 'approved') then
      next_status := 'rejected';
    elsif proposal_row.status = 'rejected' then
      next_status := 'rejected';
    else
      raise exception 'This proposal cannot be rejected in its current state.';
    end if;
  end if;

  update public.program_change_proposals
  set status = next_status,
      approved_at = case
        when next_status = 'approved' then coalesce(approved_at, current_now)
        else approved_at
      end,
      rejected_at = case
        when next_status = 'rejected' then coalesce(rejected_at, current_now)
        else rejected_at
      end,
      updated_at = current_now
  where id = proposal_row.id
  returning * into proposal_row;

  event_action := case
    when normalized_decision = 'reject' then 'proposal_rejected'
    else 'proposal_approved'
  end;

  insert into public.coach_action_events (
    coach_user_id,
    athlete_user_id,
    action_type,
    target_type,
    target_id,
    metadata,
    created_at
  ) values (
    auth.uid(),
    proposal_row.user_id,
    event_action,
    'proposal',
    p_proposal_id,
    jsonb_build_object(
      'decision', normalized_decision,
      'proposalStatus', proposal_row.status
    ),
    current_now
  );

  return proposal_row;
end;
$$;

revoke all on function public.coach_mark_checkin_reviewed(uuid, text, text) from public;
grant execute on function public.coach_mark_checkin_reviewed(uuid, text, text) to authenticated;

revoke all on function public.coach_decide_recommendation(uuid, text) from public;
grant execute on function public.coach_decide_recommendation(uuid, text) to authenticated;

revoke all on function public.coach_decide_program_change_proposal(uuid, text) from public;
grant execute on function public.coach_decide_program_change_proposal(uuid, text) to authenticated;

revoke all on function public.apply_program_change_proposal(uuid) from public;
grant execute on function public.apply_program_change_proposal(uuid) to authenticated;

drop policy if exists coach_profiles_insert_own on public.coach_profiles;

drop policy if exists coach_review_notes_insert on public.coach_review_notes;

drop policy if exists coach_action_events_insert on public.coach_action_events;

drop policy if exists weekly_checkin_reviews_coach_update on public.weekly_checkin_reviews;

drop policy if exists ai_recommendations_coach_update on public.ai_recommendations;

drop policy if exists program_change_proposals_coach_update on public.program_change_proposals;

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

  if proposal.status not in ('proposed', 'approved') then
    raise exception 'Only proposed or approved changes can be applied.';
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

      if phase_row.end_date <> (proposal.change_command ->> 'currentEndDate')::date then
        update public.program_change_proposals
        set status = 'superseded',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('The phase end date changed after the proposal was created.')),
            updated_at = current_now
        where id = proposal.id
        returning * into updated_proposal;
        return updated_proposal;
      end if;

      if (proposal.change_command ->> 'proposedEndDate')::date <> ((proposal.change_command ->> 'currentEndDate')::date + 7) then
        update public.program_change_proposals
        set status = 'failed',
            validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('Phase extensions are limited to exactly one week.')),
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

    else
      update public.program_change_proposals
      set status = 'failed',
          validation_result = jsonb_build_object('status', 'needs_review', 'messages', jsonb_build_array('Unsupported change type.')),
          updated_at = current_now
      where id = proposal.id
      returning * into updated_proposal;

      return updated_proposal;
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

revoke all on function public.apply_program_change_proposal(uuid) from public;
grant execute on function public.apply_program_change_proposal(uuid) to authenticated;

commit;
