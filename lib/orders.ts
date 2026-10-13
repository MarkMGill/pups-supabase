import { supabase } from "./supabase";
import { withPaymentTimeout } from "./paymentTimeout";

export async function confirmOrder(paymentIntentId: string): Promise<boolean> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await withPaymentTimeout(supabase.functions.invoke("confirm-order", {
    body: { paymentIntentId },
  }), "Order confirmation is taking longer than expected.");
  // supabase.functions.invoke uses the configured project and current authenticated session.
  if (error) throw error;
  return data?.status === "paid";
}
