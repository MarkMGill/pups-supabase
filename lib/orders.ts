import { supabase } from "./supabase";

export async function recordOrder(payload: {
  userId?: string;
  puppyId: string;
  amountCents: number;
  stripePaymentIntentId?: string;
}) {
  if (!supabase) {
    return;
  }

  await supabase.from("orders").insert({
    user_id: payload.userId ?? null,
    puppy_id: payload.puppyId,
    amount_cents: payload.amountCents,
    stripe_payment_intent_id: payload.stripePaymentIntentId ?? null,
    status: "paid",
  });
}