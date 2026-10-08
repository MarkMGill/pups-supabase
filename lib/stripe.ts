import { currency, supabaseFunctionUrl } from "./config";
import { supabaseAnonKey } from "./config";
import { supabase } from "./supabase";

export type PaymentSheetResponse = {
  paymentIntentClientSecret: string;
};

export async function createPaymentSheet(amountCents: number, email?: string) {
  if (!supabaseFunctionUrl) {
    throw new Error("Add EXPO_PUBLIC_SUPABASE_FUNCTION_URL before enabling Stripe checkout.");
  }

  const { data, error } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null }, error: null };
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error("Please sign in before paying.");

  const response = await fetch(supabaseFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({
      amountCents,
      currency,
      email,
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.error ?? body?.message;
    throw new Error(typeof detail === "string" ? detail : `Unable to prepare payment (HTTP ${response.status}).`);
  }

  if (typeof body?.paymentIntentClientSecret !== "string" || !body.paymentIntentClientSecret) {
    throw new Error("Payment service returned an invalid response.");
  }
  return body as PaymentSheetResponse;
}
