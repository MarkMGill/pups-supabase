// Run locally with Node 22+. Never import this server-key script into the app.
const { existsSync } = require('node:fs');
const { createClient } = require('@supabase/supabase-js');
for (const file of ['.env', '.env.seed']) if (existsSync(file)) process.loadEnvFile(file);

const password = 'PuppiesTest!2026';
const marker = 'puppies-test-buyers-v1';
const fixtures = [
  { email: 'puppies.buyer1@example.com', name: 'Test Buyer One', checkouts: ['a1010101-1111-4111-8111-111111111111', 'a1010101-1111-4111-8111-222222222222'] },
  { email: 'puppies.buyer2@example.com', name: 'Test Buyer Two', checkouts: ['b2020202-2222-4222-8222-111111111111', 'b2020202-2222-4222-8222-222222222222'] },
];
function checked(result, action) {
  if (result.error) throw new Error(`${action}: ${result.error.message}`);
  return result.data;
}

async function main() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !publicKey) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY in .env.seed; keep the public Supabase URL/key in .env.');
  if (!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')) throw new Error('This fixture script requires the app to use a Stripe test key.');
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, key, options);
  // Validate prerequisites before creating any accounts.
  checked(await admin.from('orders').select('id, checkout_id, quantity, currency').limit(1), 'Apply the orders migration first');
  checked(await admin.from('puppy_admins').select('user_id').limit(1), 'Check admin table');
  const puppies = checked(await admin.from('puppies').select('id, price_cents').order('created_at').limit(2), 'Load puppy fixtures');
  if (!puppies.length) throw new Error('Add a puppy before seeding test orders.');
  const existingUsers = [];
  for (let page = 1; ; page++) {
    const data = checked(await admin.auth.admin.listUsers({ page, perPage: 100 }), 'List test accounts');
    existingUsers.push(...data.users);
    if (data.users.length < 100) break;
  }
  for (const fixture of fixtures) {
    const existing = existingUsers.find((user) => user.email?.toLowerCase() === fixture.email);
    if (existing && existing.app_metadata?.test_fixture !== marker) throw new Error(`Refusing to modify an unrelated existing account: ${fixture.email}`);
  }
  const checkoutIds = fixtures.flatMap((fixture) => fixture.checkouts);
  const currentOrders = checked(await admin.from('orders').select('user_id, checkout_id, stripe_payment_intent_id').in('checkout_id', checkoutIds), 'Check fixture collisions');
  for (const row of currentOrders) {
    const fixture = fixtures.find((entry) => entry.checkouts.includes(row.checkout_id));
    const owner = existingUsers.find((user) => user.email === fixture.email);
    if (!owner || row.user_id !== owner.id || row.stripe_payment_intent_id) throw new Error('Fixture checkout IDs conflict with existing orders; no accounts were modified.');
  }
  for (const fixture of fixtures) {
    let user = existingUsers.find((entry) => entry.email?.toLowerCase() === fixture.email);
    if (!user) {
      user = checked(await admin.auth.admin.createUser({ email: fixture.email, password, email_confirm: true,
        user_metadata: { name: fixture.name }, app_metadata: { test_fixture: marker } }), 'Create test buyer').user;
    }
    const membership = checked(await admin.from('puppy_admins').select('user_id').eq('user_id', user.id).maybeSingle(), 'Verify non-admin membership');
    if (membership) throw new Error(`${fixture.email} is an admin; refusing to alter its permissions.`);
    const profile = checked(await admin.from('profiles').select('id').eq('id', user.id).maybeSingle(), 'Verify profile trigger');
    if (!profile) throw new Error('Profile trigger is missing. Apply the profiles migration before retrying.');
    const lines = fixture.checkouts.map((checkout_id, index) => {
      const puppy = puppies[index % puppies.length];
      return { checkout_id, user_id: user.id, puppy_id: puppy.id, quantity: 1,
        amount_cents: puppy.price_cents, currency: 'usd', status: index === 0 ? 'paid' : 'pending', stripe_payment_intent_id: null };
    });
    // These are UI fixtures, not Stripe payments. Null payment IDs prevent confusing
    // synthetic paid orders with real payments that could be refunded later.
    checked(await admin.from('orders').upsert(lines, { onConflict: 'checkout_id,puppy_id' }), 'Save sample orders');
    const buyer = createClient(url, publicKey, options);
    checked(await buyer.auth.signInWithPassword({ email: fixture.email, password }), 'Verify buyer login');
    const visible = checked(await buyer.from('orders').select('user_id, checkout_id').in('checkout_id', checkoutIds), 'Verify order isolation');
    if (visible.length !== 2 || visible.some((row) => row.user_id !== user.id)) throw new Error('Buyer order visibility check failed. Review the RLS policies.');
    await buyer.auth.signOut();
    console.log(`${fixture.email}: verified non-admin account with 1 sample paid order and 1 pending order.`);
  }
  console.log(`Test password for both accounts: ${password}`);
  console.log('Sample orders do not represent Stripe charges.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
