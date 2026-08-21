begin;

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "profile_avatars_select_own" on storage.objects;
create policy "profile_avatars_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "profile_avatars_select_coach" on storage.objects;
create policy "profile_avatars_select_coach"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and exists (
    select 1
    from public.coach_athlete_assignments assignment
    where assignment.coach_user_id = auth.uid()
      and assignment.athlete_user_id = split_part(name, '/', 1)::uuid
      and assignment.status = 'active'
  )
);

drop policy if exists "profile_avatars_insert_own" on storage.objects;
create policy "profile_avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "profile_avatars_update_own" on storage.objects;
create policy "profile_avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "profile_avatars_delete_own" on storage.objects;
create policy "profile_avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

commit;

