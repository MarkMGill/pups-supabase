import { currency, supabaseFunctionUrl } from "./config";

export type PaymentSheetResponse = {
  paymentIntentClientSecret: string;
};

export async function createPaymentSheet(amountCents: number, email?: string) {
  if (!supabaseFunctionUrl) {
    throw new Error("Add EXPO_PUBLIC_SUPABASE_FUNCTION_URL before enabling Stripe checkout.");
  }

  const response = await fetch(supabaseFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amountCents,
      currency,
      email,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to prepare the payment sheet.");
  }

  return (await response.json()) as PaymentSheetResponse;
}