begin;

with coach_user as (
  select id
  from auth.users
  where email = 'athlexforce.coach.test.20260810@example.com'
  limit 1
)
insert into public.coach_profiles (
  user_id,
  display_name,
  status,
  business_name,
  avatar_path,
  created_at,
  updated_at
)
select
  coach_user.id,
  'Coach Test',
  'active',
  'AthlexForce Test',
  null,
  timezone('utc', now()),
  timezone('utc', now())
from coach_user
on conflict (user_id) do update
set display_name = excluded.display_name,
    status = 'active',
    business_name = excluded.business_name,
    avatar_path = excluded.avatar_path,
    updated_at = excluded.updated_at;

with coach_user as (
  select id
  from auth.users
  where email = 'athlexforce.coach.test.20260810@example.com'
  limit 1
),
athlete_user as (
  select id
  from auth.users
  where email = 'athlexforce.final.20260810122007.1@example.com'
  limit 1
)
insert into public.coach_athlete_assignments (
  coach_user_id,
  athlete_user_id,
  status,
  assigned_at,
  ended_at,
  created_at,
  updated_at
)
select
  coach_user.id,
  athlete_user.id,
  'active',
  timezone('utc', now()),
  null,
  timezone('utc', now()),
  timezone('utc', now())
from coach_user
cross join athlete_user
on conflict (coach_user_id, athlete_user_id) do update
set status = 'active',
    ended_at = null,
    updated_at = excluded.updated_at;

with coach_user as (
  select id
  from auth.users
  where email = 'athlexforce.coach.other.20260810@example.com'
  limit 1
)
insert into public.coach_profiles (
  user_id,
  display_name,
  status,
  business_name,
  avatar_path,
  created_at,
  updated_at
)
select
  coach_user.id,
  'Coach Other',
  'active',
  'AthlexForce Test',
  null,
  timezone('utc', now()),
  timezone('utc', now())
from coach_user
on conflict (user_id) do update
set display_name = excluded.display_name,
    status = 'active',
    business_name = excluded.business_name,
    avatar_path = excluded.avatar_path,
    updated_at = excluded.updated_at;

commit;
