import { PGlite } from "npm:@electric-sql/pglite@0.3.14";

Deno.test("admin SELECT policies expose all orders only to approved admins", async () => {
  const db = new PGlite();
  const buyer = "11111111-1111-4111-8111-111111111111";
  const admin = "22222222-2222-4222-8222-222222222222";
  try {
    await db.exec(`
      create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      create table puppy_admins (user_id uuid primary key);
      create table orders (id integer, user_id uuid);
      create table profiles (id uuid, name text);
      alter table puppy_admins enable row level security;
      alter table orders enable row level security;
      alter table profiles enable row level security;
      grant select on puppy_admins, orders, profiles to authenticated;
      create policy membership on puppy_admins for select to authenticated using (user_id = auth.uid());
      create policy own_orders on orders for select to authenticated using (user_id = auth.uid());
      create policy own_profile on profiles for select to authenticated using (id = auth.uid());
      insert into puppy_admins values ('${admin}');
      insert into orders values (1, '${buyer}'), (2, '${admin}');
      insert into profiles values ('${buyer}', 'Buyer'), ('${admin}', 'Admin');
    `);
    await db.exec(await Deno.readTextFile("supabase/migrations/20261014120000_admin_order_list.sql"));
    await db.exec("set role authenticated");
    for (const [id, expected] of [[buyer, 1], [admin, 2]] as const) {
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      for (const table of ["orders", "profiles"]) {
        const result = await db.query<{ count: number }>(`select count(*)::int as count from ${table}`);
        if (result.rows[0].count !== expected) throw new Error(`Incorrect ${table} visibility for ${id}`);
      }
    }
    const access = await db.query<{ allowed: boolean }>("select has_table_privilege('authenticated','orders','UPDATE') as allowed");
    if (access.rows[0].allowed) throw new Error("Admin listing unexpectedly enables order updates");
  } finally { await db.close(); }
});
