import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@16.12.0";
import { validatePaidOrder } from "./checkout.ts";
export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export function json(body: unknown, status = 200) { return Response.json(body, { status, headers: cors }); }
export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase server configuration.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function stripeClient() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY.");
  return new Stripe(key, { apiVersion: "2024-06-20", httpClient: Stripe.createFetchHttpClient(), timeout: 20000 });
}
export async function requestUser(req: Request, db: ReturnType<typeof adminClient>) {
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
}
export async function savePaidOrder(db: ReturnType<typeof adminClient>, intent: Stripe.PaymentIntent) {
  const { data, error } = await db.from("orders").select("user_id, checkout_id, amount_cents, currency").eq("stripe_payment_intent_id", intent.id);
  if (error) throw error;
  validatePaidOrder(intent, data ?? []);
  const { error: updateError } = await db.from("orders").update({ status: "paid" }).eq("stripe_payment_intent_id", intent.id).eq("status", "pending");
  if (updateError) throw updateError;
}
