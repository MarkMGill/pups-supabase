-- Only dashboard/SQL administrators can manage this allowlist.
create table public.puppy_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.puppy_admins enable row level security;
revoke all on public.puppy_admins from anon, authenticated;
grant select on public.puppy_admins to authenticated;
create policy "Admins can read their own membership"
  on public.puppy_admins for select to authenticated
  using (user_id = (select auth.uid()));

grant insert on public.puppies to authenticated;
create policy "Admins can add puppies"
  on public.puppies for insert to authenticated
  with check (exists (
    select 1 from public.puppy_admins where user_id = (select auth.uid())
  ));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('puppy-photos', 'puppy-photos', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admins can upload puppy photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'puppy-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.puppy_admins where user_id = (select auth.uid()))
  );

-- Allow admins to remove their own upload if saving the puppy fails.
create policy "Admins can read their own puppy uploads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'puppy-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.puppy_admins where user_id = (select auth.uid()))
  );
create policy "Admins can remove their own puppy uploads"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'puppy-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.puppy_admins where user_id = (select auth.uid()))
  );
