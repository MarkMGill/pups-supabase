import { currency, supabaseFunctionUrl } from "./config";
import { supabaseAnonKey } from "./config";
import { supabase } from "./supabase";
import { withPaymentTimeout } from "./paymentTimeout";

export type PaymentSheetResponse = {
  paymentIntentClientSecret: string;
};

export async function createPaymentSheet(amountCents: number, email?: string) {
  if (!supabaseFunctionUrl) {
    throw new Error("Add EXPO_PUBLIC_SUPABASE_FUNCTION_URL before enabling Stripe checkout.");
  }

  const { data, error } = supabase
    ? await withPaymentTimeout(supabase.auth.getSession(), "Checking your sign-in timed out. Please sign in again and retry.")
    : { data: { session: null }, error: null };
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error("Please sign in before paying.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(supabaseFunctionUrl, {
      signal: controller.signal,
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
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Payment preparation timed out. Check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
