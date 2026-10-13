create or replace function public.create_puppy_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, new.id::text || '@no-email.invalid'),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(new.email, '@', 1), ''), 'Puppy lover'))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_puppy_profile() from public;
create trigger puppy_profile_on_signup after insert on auth.users
  for each row execute function public.create_puppy_profile();

-- Backfill existing accounts without replacing existing profile data.
insert into public.profiles (id, email, name, created_at)
select id, coalesce(email, id::text || '@no-email.invalid'),
  coalesce(nullif(btrim(raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(email, '@', 1), ''), 'Puppy lover'), created_at
from auth.users on conflict (id) do nothing;

alter table public.orders
  add column checkout_id uuid,
  add column quantity integer not null default 1 check (quantity > 0),
  add column currency text not null default 'usd';
create unique index orders_checkout_puppy_unique on public.orders(checkout_id, puppy_id);
create index orders_payment_intent_index on public.orders(stripe_payment_intent_id);
drop policy if exists "Users can create orders" on public.orders;
revoke insert, update, delete on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
