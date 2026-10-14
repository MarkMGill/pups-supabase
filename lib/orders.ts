import { supabase } from "./supabase";
import { withPaymentTimeout } from "./paymentTimeout";
import { groupOrderHistory, type OrderRow } from "./orderHistory";

/**
 * Load the current buyer's order history, then turn database rows into checkout cards.
 * This only reads orders; Stripe confirmation and webhooks handle payment updates.
 */
export async function loadMyOrders() {
  if (!supabase) throw new Error("Order history requires a Supabase account. Please sign in.");
  const client = supabase;
  // Bound both authentication and the database query so the screen cannot wait forever.
  // This helper stops waiting on timeout; it does not cancel the underlying requests.
  return withPaymentTimeout((async () => {
    // getUser asks Supabase Auth to verify the session and return the real account ID.
    // Local demo users cannot use this ID to access another buyer's history.
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user) throw new Error("Please sign in to view your orders.");
    // puppies(name) follows orders.puppy_id's foreign key to retrieve the puppy name.
    // eq limits this query to the buyer. Supabase's RLS policy separately enforces
    // access on the server, even if someone removes this filter from the app.
    const { data, error } = await client.from("orders")
      .select("id, checkout_id, amount_cents, quantity, currency, status, created_at, puppies(name)")
      .eq("user_id", auth.user.id).order("created_at", { ascending: false });
    if (error) throw new Error(`Unable to load orders: ${error.message}`);
    // The untyped Supabase client cannot infer the shape of the joined puppy here.
    // OrderRow describes the selected columns; this assertion is not runtime validation.
    return groupOrderHistory((data ?? []) as unknown as OrderRow[]);
  })(), "Loading orders timed out. Check your connection and try again.");
}

export async function confirmOrder(paymentIntentId: string): Promise<boolean> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await withPaymentTimeout(supabase.functions.invoke("confirm-order", {
    body: { paymentIntentId },
  }), "Order confirmation is taking longer than expected.");
  // supabase.functions.invoke uses the configured project and current authenticated session.
  if (error) throw error;
  return data?.status === "paid";
}
