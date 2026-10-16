import { supabase } from "./supabase";
import { withPaymentTimeout } from "./paymentTimeout";
import { groupOrderHistory, type OrderRow, type OrderSummary } from "./orderHistory";

export type AdminOrder = OrderSummary & {
  buyerName: string;
  buyerEmail: string | null;
  buyerId: string | null;
  paymentIntentId: string | null;
};
type AdminRow = OrderRow & { user_id: string | null; stripe_payment_intent_id: string | null };
type Buyer = { id: string; name: string; email: string };

/** Read-only admin query. RLS enforces the same admin permission in the database. */
export async function loadAdminOrders(): Promise<AdminOrder[]> {
  if (!supabase) throw new Error("Please sign in with a Supabase admin account.");
  const client = supabase;
  return withPaymentTimeout((async () => {
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user) throw new Error("Please sign in with an admin account.");
    // Check membership first so a normal user's direct route visit is rejected,
    // rather than displaying their own orders as if they were the full admin list.
    const { data: membership, error: membershipError } = await client.from("puppy_admins")
      .select("user_id").eq("user_id", auth.user.id).maybeSingle();
    if (membershipError) throw new Error("Unable to check admin access.");
    if (!membership) throw new Error("Only admins can view all orders.");
    const { data, error } = await client.from("orders")
      .select("id, user_id, checkout_id, stripe_payment_intent_id, amount_cents, quantity, currency, status, created_at, puppies(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Unable to load admin orders: ${error.message}`);
    const rows = (data ?? []) as unknown as AdminRow[];
    const buyerIds = [...new Set(rows.flatMap((row) => row.user_id ? [row.user_id] : []))];
    let buyers: Buyer[] = [];
    // orders.user_id references auth.users, not profiles, so fetch profiles separately.
    if (buyerIds.length) {
      const { data: profiles, error: profileError } = await client.from("profiles")
        .select("id, name, email").in("id", buyerIds);
      if (profileError) throw new Error(`Unable to load buyer profiles: ${profileError.message}`);
      buyers = profiles ?? [];
    }
    const sourceRows = new Map(rows.map((row) => [row.checkout_id ?? row.id, row]));
    const profiles = new Map(buyers.map((buyer) => [buyer.id, buyer]));
    return groupOrderHistory(rows).map((order) => {
      const row = sourceRows.get(order.id)!;
      const buyer = row.user_id ? profiles.get(row.user_id) : undefined;
      return { ...order, buyerId: row.user_id, buyerName: buyer?.name ?? (row.user_id ? "Buyer profile unavailable" : "Deleted account"),
        buyerEmail: buyer?.email ?? null, paymentIntentId: row.stripe_payment_intent_id };
    });
  })(), "Loading admin orders timed out. Check your connection and try again.");
}
