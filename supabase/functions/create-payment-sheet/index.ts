import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { parseItems, buildOrderLines } from "../_shared/checkout.ts";
import { adminClient, stripeClient, requestUser, cors, json } from "../_shared/server.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const db = adminClient();
    const user = await requestUser(req, db);
    if (!user) return json({ error: "Please sign in before paying." }, 401);
    const body = await req.json();
    let items;
    try { items = parseItems(body.items); } catch (error) { return json({ error: (error as Error).message }, 400); }
    const { data: puppies, error } = await db.from("puppies").select("id, price_cents").in("id", items.map((item) => item.puppyId));
    if (error) throw error;
    let order;
    try { order = buildOrderLines(items, puppies ?? []); } catch (error) { return json({ error: (error as Error).message }, 400); }
    const stripe = stripeClient();
    const checkoutId = crypto.randomUUID();
    const { error: insertError } = await db.from("orders").insert(order.lines.map((line) => ({
      ...line, user_id: user.id, checkout_id: checkoutId, currency: "usd", status: "pending",
    })));
    if (insertError) throw insertError;
    const intent = await stripe.paymentIntents.create({
      amount: order.total, currency: "usd", receipt_email: user.email,
      automatic_payment_methods: { enabled: true },
      metadata: { checkout_id: checkoutId, user_id: user.id },
    }, { idempotencyKey: checkoutId });
    const { error: linkError } = await db.from("orders").update({ stripe_payment_intent_id: intent.id }).eq("checkout_id", checkoutId);
    if (linkError) {
      await stripe.paymentIntents.cancel(intent.id);
      throw linkError;
    }
    return json({ paymentIntentClientSecret: intent.client_secret, paymentIntentId: intent.id, amountCents: order.total });
  } catch (error) {
    console.error("Payment preparation failed", error);
    return json({ error: "Unable to prepare and save your order. Please try again." }, 500);
  }
});
