import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, stripeClient, requestUser, savePaidOrder, cors, json } from "../_shared/server.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const db = adminClient();
    const user = await requestUser(req, db);
    if (!user) return json({ error: "Please sign in." }, 401);
    const { paymentIntentId } = await req.json();
    if (typeof paymentIntentId !== "string" || !/^pi_[a-zA-Z0-9]+$/.test(paymentIntentId)) return json({ error: "Invalid payment ID." }, 400);
    const { data, error } = await db.from("orders").select("id").eq("user_id", user.id).eq("stripe_payment_intent_id", paymentIntentId).limit(1);
    if (error) throw error;
    if (!data?.length) return json({ error: "Order not found." }, 404);
    const intent = await stripeClient().paymentIntents.retrieve(paymentIntentId);
    if (intent.metadata.user_id !== user.id) return json({ error: "Order not found." }, 404);
    if (intent.status !== "succeeded") return json({ status: "pending" }, 202);
    await savePaidOrder(db, intent);
    return json({ status: "paid" });
  } catch (error) {
    console.error("Order confirmation failed", error);
    return json({ error: "Unable to confirm your order yet." }, 500);
  }
});
