import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import Stripe from "npm:stripe@16.12.0";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    return Response.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  const { amountCents, currency = "usd" } = await req.json();
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amountCents),
    currency,
    automatic_payment_methods: { enabled: true },
  });

  return Response.json({ paymentIntentClientSecret: paymentIntent.client_secret });
});