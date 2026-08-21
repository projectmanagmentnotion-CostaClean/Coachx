begin;

revoke all on function public.coach_create_assignment_invitation(uuid, timestamptz, text) from public, anon;
grant execute on function public.coach_create_assignment_invitation(uuid, timestamptz, text) to authenticated, service_role;

revoke all on function public.coach_accept_assignment_invitation(text) from public, anon;
grant execute on function public.coach_accept_assignment_invitation(text) to authenticated, service_role;

revoke all on function public.get_my_coach_relationship() from public, anon;
grant execute on function public.get_my_coach_relationship() to authenticated, service_role;

commit;
