export type CheckoutItem = { puppyId: string; quantity: number };
export function parseItems(value: unknown): CheckoutItem[] {
  if (!Array.isArray(value) || !value.length || value.length > 50) throw new Error("Choose between 1 and 50 puppies.");
  const ids = new Set<string>();
  return value.map((item) => {
    if (!item || typeof item.puppyId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.puppyId)
      || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 || ids.has(item.puppyId)) throw new Error("Invalid puppy or quantity in cart.");
    ids.add(item.puppyId);
    return { puppyId: item.puppyId, quantity: item.quantity };
  });
}
export function buildOrderLines(items: CheckoutItem[], puppies: { id: string; price_cents: number }[]) {
  const lines = items.map((item) => {
    const puppy = puppies.find((row) => row.id === item.puppyId);
    if (!puppy) throw new Error("A puppy in your cart is no longer available.");
    const amount = puppy.price_cents * item.quantity;
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 2147483647) throw new Error("Invalid puppy price.");
    return { puppy_id: puppy.id, quantity: item.quantity, amount_cents: amount };
  });
  const total = lines.reduce((sum, line) => sum + line.amount_cents, 0);
  if (!Number.isSafeInteger(total) || total < 50 || total > 99999999) throw new Error("Order total must be between $0.50 and $999,999.99.");
  return { lines, total };
}
export function validatePaidOrder(intent: { status: string; amount_received: number; currency: string; metadata: Record<string, string> }, rows: { user_id: string | null; checkout_id: string | null; amount_cents: number; currency: string }[]) {
  if (intent.status !== "succeeded") throw new Error("Payment is not yet confirmed.");
  if (!rows.length || rows.some((row) => row.user_id !== intent.metadata.user_id || row.checkout_id !== intent.metadata.checkout_id || row.currency !== intent.currency)
    || rows.reduce((sum, row) => sum + row.amount_cents, 0) !== intent.amount_received) throw new Error("Payment does not match the saved order.");
}
