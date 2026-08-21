drop policy if exists "progress_photos_select_own" on public.progress_photos;
create policy "progress_photos_select_own"
on public.progress_photos
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.progress_entries entry
    where entry.id = progress_entry_id
      and entry.user_id = auth.uid()
  )
);

drop policy if exists "progress_photos_insert_own" on public.progress_photos;
create policy "progress_photos_insert_own"
on public.progress_photos
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.progress_entries entry
    where entry.id = progress_entry_id
      and entry.user_id = auth.uid()
  )
);

drop policy if exists "progress_photos_update_own" on public.progress_photos;
create policy "progress_photos_update_own"
on public.progress_photos
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.progress_entries entry
    where entry.id = progress_entry_id
      and entry.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.progress_entries entry
    where entry.id = progress_entry_id
      and entry.user_id = auth.uid()
  )
);

drop policy if exists "progress_photos_delete_own" on public.progress_photos;
create policy "progress_photos_delete_own"
on public.progress_photos
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.progress_entries entry
    where entry.id = progress_entry_id
      and entry.user_id = auth.uid()
  )
);
