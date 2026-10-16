-- Buyer policies still allow only their own rows. These additional SELECT
-- policies allow approved admins to view all purchases and their buyers.
create policy "Admins can read all orders"
  on public.orders for select to authenticated
  using (exists (
    select 1 from public.puppy_admins where user_id = (select auth.uid())
  ));
create policy "Admins can read buyer profiles"
  on public.profiles for select to authenticated
  using (exists (
    select 1 from public.puppy_admins where user_id = (select auth.uid())
  ));
grant select on public.profiles to authenticated;
