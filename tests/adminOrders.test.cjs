const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const history = stripTypeScriptTypes(readFileSync('lib/orderHistory.ts', 'utf8')).replace(/export /g, '');
const group = new Function(history + ';return groupOrderHistory;')();
const source = stripTypeScriptTypes(readFileSync('lib/adminOrders.ts', 'utf8')).replace(/^import .*;$/gm, '').replace(/export /g, '');
function load(client) { return new Function('supabase','withPaymentTimeout','groupOrderHistory', source + ';return loadAdminOrders;')(client, (operation) => operation, group); }
test('normal buyers are rejected before the full order query', async () => {
  const client = { auth: { getUser: async () => ({ data: { user: { id: 'buyer' } }, error: null }) }, from: (table) => {
    assert.equal(table, 'puppy_admins');
    return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
  } };
  await assert.rejects(load(client)(), /Only admins/);
});
test('admin sees other buyers and missing/deleted profiles without losing orders', async () => {
  const base = { checkout_id: null, amount_cents: 10000, quantity: 1, currency: 'usd', status: 'paid', created_at: '2026-10-14T12:00:00Z', puppies: { name: 'Dave' }, stripe_payment_intent_id: 'pi_test' };
  const client = { auth: { getUser: async () => ({ data: { user: { id: 'admin' } }, error: null }) }, from: (table) => ({ select: () => {
    if (table === 'puppy_admins') return { eq: () => ({ maybeSingle: async () => ({ data: { user_id: 'admin' }, error: null }) }) };
    if (table === 'orders') return { order: async () => ({ data: [{ ...base, id: 'a', user_id: 'buyer' }, { ...base, id: 'b', user_id: null }], error: null }) };
    return { in: async (column, ids) => { assert.deepEqual(ids, ['buyer']); return { data: [{ id: 'buyer', name: 'Buyer', email: 'buyer@example.com' }], error: null }; } };
  } }) };
  const result = await load(client)();
  assert.equal(result.length, 2);
  assert.equal(result[0].buyerEmail, 'buyer@example.com');
  assert.equal(result[1].buyerName, 'Deleted account');
});
