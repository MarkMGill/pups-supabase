const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const source = stripTypeScriptTypes(readFileSync('supabase/functions/_shared/checkout.ts', 'utf8')).replace(/export /g, '');
const { parseItems, buildOrderLines, validatePaidOrder } = new Function(source + ';return {parseItems,buildOrderLines,validatePaidOrder};')();
const id = '11111111-1111-4111-8111-111111111111';
test('uses database prices and accounts for quantity', () => {
  const items = parseItems([{ puppyId: id, quantity: 2, price_cents: 1 }]);
  const result = buildOrderLines(items, [{ id, price_cents: 3000000 }]);
  assert.equal(result.total, 6000000);
  assert.equal(result.lines[0].quantity, 2);
});
test('rejects empty, invalid, duplicate, and fractional cart items', () => {
  for (const input of [[], [{ puppyId: 'demo-id', quantity: 1 }], [{ puppyId: id, quantity: 0 }], [{ puppyId: id, quantity: 1.5 }], [{ puppyId: id, quantity: 1 }, { puppyId: id, quantity: 1 }]]) {
    assert.throws(() => parseItems(input));
  }
});
test('rejects deleted puppies and amounts outside Stripe limits', () => {
  const items = parseItems([{ puppyId: id, quantity: 1 }]);
  assert.throws(() => buildOrderLines(items, []));
  assert.throws(() => buildOrderLines(items, [{ id, price_cents: 1 }]));
  assert.throws(() => buildOrderLines(items, [{ id, price_cents: 100000000 }]));
});
const intent = { status: 'succeeded', amount_received: 3000000, currency: 'usd', metadata: { user_id: 'user-1', checkout_id: 'checkout-1' } };
const row = { user_id: 'user-1', checkout_id: 'checkout-1', amount_cents: 3000000, currency: 'usd' };
test('accepts a confirmed matching payment and duplicate confirmation', () => {
  validatePaidOrder(intent, [row]);
  validatePaidOrder(intent, [row]);
});
test('rejects unconfirmed, wrong-owner, wrong-checkout, wrong-currency, and wrong-amount payments', () => {
  assert.throws(() => validatePaidOrder({ ...intent, status: 'processing' }, [row]));
  assert.throws(() => validatePaidOrder(intent, []));
  for (const change of [{ user_id: 'other' }, { checkout_id: 'other' }, { currency: 'eur' }, { amount_cents: 1 }]) {
    assert.throws(() => validatePaidOrder(intent, [{ ...row, ...change }]));
  }
});
