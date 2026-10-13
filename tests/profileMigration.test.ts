import { PGlite } from "npm:@electric-sql/pglite@0.3.14";

Deno.test("migration backfills profiles, creates profiles on signup, and restricts order writes", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb, created_at timestamptz default now());
      create table public.profiles (id uuid primary key references auth.users(id), email text unique not null, name text not null, created_at timestamptz default now());
      create table public.orders (id uuid primary key, user_id uuid, puppy_id uuid, amount_cents integer, stripe_payment_intent_id text, status text default 'pending');
      alter table public.orders enable row level security;
      create policy "Users can create orders" on public.orders for insert with check (true);
      grant insert, update, delete on public.orders to anon, authenticated;
      insert into auth.users (id,email,raw_user_meta_data) values
        ('11111111-1111-4111-8111-111111111111','existing@example.com','{"name":"Existing User"}'),
        ('22222222-2222-4222-8222-222222222222','preserved@example.com','{"name":"Old Name"}');
      insert into profiles (id,email,name) values ('22222222-2222-4222-8222-222222222222','preserved@example.com','Edited Name');
    `);
    await db.exec(await Deno.readTextFile("supabase/migrations/20261009120000_save_profiles_and_orders.sql"));
    await db.exec(`insert into auth.users (id,email,raw_user_meta_data) values
      ('33333333-3333-4333-8333-333333333333','new@example.com','{"name":"New User"}'),
      ('44444444-4444-4444-8444-444444444444','fallback@example.com','{}');`);
    const { rows } = await db.query<{ email: string; name: string }>("select email, name from profiles order by email");
    if (JSON.stringify(rows) !== JSON.stringify([
      { email: "existing@example.com", name: "Existing User" },
      { email: "fallback@example.com", name: "fallback" },
      { email: "new@example.com", name: "New User" },
      { email: "preserved@example.com", name: "Edited Name" },
    ])) throw new Error("Profile backfill or signup trigger failed.");
    const privileges = await db.query<{ can_insert: boolean; can_update: boolean; can_delete: boolean }>(`
      select has_table_privilege('authenticated','orders','INSERT') as can_insert,
             has_table_privilege('authenticated','orders','UPDATE') as can_update,
             has_table_privilege('anon','orders','DELETE') as can_delete`);
    if (Object.values(privileges.rows[0]).some(Boolean)) throw new Error("Clients can still write orders.");
  } finally {
    await db.close();
  }
});
