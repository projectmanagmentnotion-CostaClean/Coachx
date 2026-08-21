begin;

alter table public.coach_athlete_assignments
  add column if not exists invitation_token_hash text null,
  add column if not exists invitation_expires_at timestamptz null,
  add column if not exists invitation_created_at timestamptz null,
  add column if not exists invitation_accepted_at timestamptz null,
  add column if not exists invitation_revoked_at timestamptz null,
  add column if not exists invitation_note text null;

alter table public.coach_athlete_assignments
  drop constraint if exists coach_athlete_assignments_status_check;

alter table public.coach_athlete_assignments
  add constraint coach_athlete_assignments_status_check
  check (status in ('invited', 'pending', 'active', 'paused', 'ended', 'revoked'));

create unique index if not exists coach_athlete_assignments_invitation_token_hash_key
  on public.coach_athlete_assignments (invitation_token_hash)
  where invitation_token_hash is not null;

create or replace function public.coach_create_assignment_invitation(
  p_athlete_user_id uuid,
  p_expires_at timestamptz default null,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  coach_profile public.coach_profiles%rowtype;
  assignment_row public.coach_athlete_assignments%rowtype;
  invitation_token text;
  token_hash text;
  current_now timestamptz := timezone('utc', now());
  expiry_at timestamptz := coalesce(p_expires_at, timezone('utc', now()) + interval '7 days');
  clean_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if p_athlete_user_id is null then
    raise exception 'An athlete id is required.';
  end if;

  if p_athlete_user_id = auth.uid() then
    raise exception 'A coach invitation cannot target the authenticated coach.';
  end if;

  select *
  into coach_profile
  from public.coach_profiles
  where user_id = auth.uid()
    and status = 'active'
  for update;

  if not found then
    raise exception 'Coach profile is not active.';
  end if;

  select *
  into assignment_row
  from public.coach_athlete_assignments
  where coach_user_id = auth.uid()
    and athlete_user_id = p_athlete_user_id
  for update;

  if found and assignment_row.status = 'active' then
    raise exception 'This athlete is already actively assigned.';
  end if;

  invitation_token := encode(gen_random_bytes(32), 'hex');
  token_hash := encode(digest(invitation_token, 'sha256'), 'hex');

  insert into public.coach_athlete_assignments (
    coach_user_id,
    athlete_user_id,
    status,
    assigned_at,
    ended_at,
    invitation_token_hash,
    invitation_expires_at,
    invitation_created_at,
    invitation_accepted_at,
    invitation_revoked_at,
    invitation_note,
    created_at,
    updated_at
  ) values (
    auth.uid(),
    p_athlete_user_id,
    'invited',
    current_now,
    null,
    token_hash,
    expiry_at,
    current_now,
    null,
    null,
    clean_note,
    current_now,
    current_now
  )
  on conflict (coach_user_id, athlete_user_id) do update
  set status = 'invited',
      assigned_at = excluded.assigned_at,
      ended_at = null,
      invitation_token_hash = excluded.invitation_token_hash,
      invitation_expires_at = excluded.invitation_expires_at,
      invitation_created_at = excluded.invitation_created_at,
      invitation_accepted_at = null,
      invitation_revoked_at = null,
      invitation_note = excluded.invitation_note,
      updated_at = excluded.updated_at;

  return invitation_token;
end;
$$;

create or replace function public.coach_accept_assignment_invitation(
  p_token text
)
returns public.coach_athlete_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  current_now timestamptz := timezone('utc', now());
  token_hash text := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  assignment_row public.coach_athlete_assignments%rowtype;
  coach_profile public.coach_profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if nullif(btrim(coalesce(p_token, '')), '') is null then
    raise exception 'An invitation token is required.';
  end if;

  select *
  into assignment_row
  from public.coach_athlete_assignments
  where invitation_token_hash = token_hash
    and athlete_user_id = auth.uid()
    and status in ('invited', 'pending')
  for update;

  if not found then
    raise exception 'Invalid or expired invitation token.';
  end if;

  if assignment_row.invitation_expires_at is not null and assignment_row.invitation_expires_at < current_now then
    raise exception 'This invitation has expired.';
  end if;

  select *
  into coach_profile
  from public.coach_profiles
  where user_id = assignment_row.coach_user_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'This coach is not active.';
  end if;

  update public.coach_athlete_assignments
  set status = 'active',
      assigned_at = coalesce(assigned_at, current_now),
      ended_at = null,
      invitation_token_hash = null,
      invitation_expires_at = null,
      invitation_accepted_at = current_now,
      invitation_revoked_at = null,
      updated_at = current_now
  where id = assignment_row.id
  returning * into assignment_row;

  return assignment_row;
end;
$$;

create or replace function public.get_my_coach_relationship()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'coachUserId', assignment.coach_user_id,
        'coachDisplayName', profile.display_name,
        'coachAvatarPath', profile.avatar_path,
        'assignmentStatus', assignment.status,
        'managementMode', case when assignment.status = 'active' then 'coach_managed' else 'self_managed' end,
        'assignedAt', assignment.assigned_at,
        'acceptedAt', assignment.invitation_accepted_at,
        'endedAt', assignment.ended_at
      )
      from public.coach_athlete_assignments assignment
      join public.coach_profiles profile
        on profile.user_id = assignment.coach_user_id
      where assignment.athlete_user_id = auth.uid()
        and assignment.status = 'active'
        and profile.status = 'active'
      order by assignment.updated_at desc
      limit 1
    ),
    'null'::jsonb
  );
$$;

revoke all on function public.coach_create_assignment_invitation(uuid, timestamptz, text) from public;
grant execute on function public.coach_create_assignment_invitation(uuid, timestamptz, text) to authenticated;

revoke all on function public.coach_accept_assignment_invitation(text) from public;
grant execute on function public.coach_accept_assignment_invitation(text) to authenticated;

revoke all on function public.get_my_coach_relationship() from public;
grant execute on function public.get_my_coach_relationship() to authenticated;

commit;
