create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.puppies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed text not null,
  age_months integer not null check (age_months >= 0),
  price_cents integer not null check (price_cents >= 0),
  image_url text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  puppy_id uuid references public.puppies(id) on delete set null,
  amount_cents integer not null,
  stripe_payment_intent_id text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.puppies enable row level security;

create policy "Public can read puppies"
  on public.puppies for select
  using (true);

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id or user_id is null);

insert into public.puppies (name, breed, age_months, price_cents, image_url, description)
values
  ('Goldie', 'Golden Retriever', 4, 180000, 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80', 'A calm, affectionate puppy who loves fetch, soft blankets, and family time.'),
  ('Milo', 'French Bulldog', 5, 220000, 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=900&q=80', 'Playful, compact, and perfect for apartment life with a big personality.'),
  ('Poppy', 'Corgi', 3, 195000, 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80', 'A bright little herder with a big grin and nonstop curiosity.')
on conflict do nothing;