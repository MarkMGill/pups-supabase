const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
// Load the TypeScript helpers in Node without adding a test runner dependency.
const historySource = stripTypeScriptTypes(readFileSync('lib/orderHistory.ts', 'utf8')).replace(/export /g, '');
const { groupOrderHistory } = new Function(historySource + ';return {groupOrderHistory};')();
const row = { id: 'line-1', checkout_id: 'checkout-1', amount_cents: 30000, quantity: 2, currency: 'usd', status: 'paid', created_at: '2026-10-13T12:00:00Z', puppies: { name: 'Dave' } };

test('groups checkout lines and sums line totals without multiplying quantities twice', () => {
  const result = groupOrderHistory([row, { ...row, id: 'line-2', amount_cents: 10000, puppies: { name: 'Milo' } }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].amountCents, 40000);
  assert.equal(result[0].items[0].quantity, 2);
  assert.equal(result[0].status, 'paid');
});
test('keeps historical orders separate and handles deleted puppies', () => {
  const result = groupOrderHistory([{ ...row, checkout_id: null, puppies: null }, { ...row, id: 'line-2', checkout_id: null }]);
  assert.equal(result.length, 2);
  assert.equal(result[0].items[0].name, 'Puppy no longer listed');
});
test('sorts newest first and does not label a partially updated checkout paid', () => {
  const result = groupOrderHistory([row, { ...row, id: 'line-2', status: 'pending' }, { ...row, id: 'line-3', checkout_id: 'checkout-2', created_at: '2026-10-14T12:00:00Z' }]);
  assert.equal(result[0].id, 'checkout-2');
  assert.equal(result[1].status, 'updating');
});

// Inject a fake Supabase client to check account filtering without a real database.
// These tests do not prove RLS enforcement; RLS must also be checked in Supabase.
const ordersSource = stripTypeScriptTypes(readFileSync('lib/orders.ts', 'utf8'))
  .replace(/^import .*;$/gm, '').replace(/export /g, '');
function loader(client) {
  return new Function('supabase', 'withPaymentTimeout', 'groupOrderHistory', ordersSource + ';return loadMyOrders;')(client, (operation) => operation, groupOrderHistory);
}
test('filters orders using the verified Supabase account ID', async () => {
  const query = {
    select: () => query,
    eq: (column, id) => { assert.equal(column, 'user_id'); assert.equal(id, 'verified-user'); return query; },
    order: async () => ({ data: [row], error: null }),
  };
  const result = await loader({ auth: { getUser: async () => ({ data: { user: { id: 'verified-user' } }, error: null }) }, from: (table) => { assert.equal(table, 'orders'); return query; } })();
  assert.equal(result.length, 1);
});
test('rejects signed-out users before querying orders', async () => {
  await assert.rejects(loader({ auth: { getUser: async () => ({ data: { user: null }, error: null }) } })(), /sign in/);
  await assert.rejects(loader(null)(), /Supabase account/);
});
