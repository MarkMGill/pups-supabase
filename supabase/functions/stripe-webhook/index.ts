import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@16.12.0";
import { adminClient, stripeClient, savePaidOrder } from "../_shared/server.ts";
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");
  if (!secret) return new Response("Webhook not configured", { status: 500 });
  if (!signature) return new Response("Missing signature", { status: 400 });
  let event: Stripe.Event;
  try {
    event = await stripeClient().webhooks.constructEventAsync(await req.text(), signature, secret, undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  if (event.type !== "payment_intent.succeeded") return Response.json({ received: true });
  const intent = event.data.object as Stripe.PaymentIntent;
  if (!intent.metadata.checkout_id || !intent.metadata.user_id) return Response.json({ received: true });
  try {
    await savePaidOrder(adminClient(), intent);
    return Response.json({ received: true });
  } catch (error) {
    console.error("Saving paid order failed", error);
    return new Response("Order update failed; retry delivery", { status: 500 });
  }
});
