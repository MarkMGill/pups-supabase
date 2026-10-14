/** One database row represents one puppy line, including its purchased quantity. */
export type OrderRow = {
  id: string;
  checkout_id: string | null;
  amount_cents: number;
  quantity: number;
  currency: string;
  status: string;
  created_at: string;
  // The relation can be null when a puppy listing has been deleted.
  puppies: { name: string } | null;
};
/** The screen displays one card per checkout, containing all of its puppy lines. */
export type OrderSummary = {
  id: string;
  createdAt: string;
  amountCents: number;
  currency: string;
  status: string;
  items: { id: string; name: string; quantity: number; amountCents: number }[];
};

/** Group rows without changing the original data or writing anything to Supabase. */
export function groupOrderHistory(rows: OrderRow[]): OrderSummary[] {
  // A Map lets us look up the checkout card as each line is processed.
  const groups = new Map<string, OrderSummary>();
  for (const row of rows) {
    // Older rows may have no checkout_id. Keep each one as its own purchase rather
    // than combining all of those unrelated historical orders into a single card.
    const key = row.checkout_id ?? row.id;
    const existing = groups.get(key);
    const item = { id: row.id, name: row.puppies?.name ?? "Puppy no longer listed", quantity: row.quantity, amountCents: row.amount_cents };
    if (existing) {
      existing.items.push(item);
      // amount_cents already includes quantity; multiplying again would overstate the total.
      existing.amountCents += row.amount_cents;
      // Mixed statuses must not present the entire checkout as paid. "updating" is
      // only a display label; it is not written back as a database status.
      if (existing.status !== row.status) existing.status = "updating";
      if (row.created_at > existing.createdAt) existing.createdAt = row.created_at;
    } else {
      groups.set(key, { id: key, createdAt: row.created_at, amountCents: row.amount_cents, currency: row.currency, status: row.status, items: [item] });
    }
  }
  // Supabase timestamps are ISO strings, so these timestamps can be sorted as text.
  return [...groups.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Convert stored statuses into readable labels, retaining unfamiliar future statuses. */
export function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    paid: "Paid", pending: "Pending payment", updating: "Payment status updating",
    refunded: "Refunded", canceled: "Canceled", cancelled: "Canceled", failed: "Payment failed",
  };
  return labels[status] ?? status.replace(/_/g, " ");
}

/** Current checkout uses USD: convert integer cents to a formatted currency amount. */
export function formatOrderAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}
