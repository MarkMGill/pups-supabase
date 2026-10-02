export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseFunctionUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL ?? "";
export const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
export const currency = process.env.EXPO_PUBLIC_CURRENCY ?? "usd";

export const hasSupabaseConfig = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
export const hasStripeConfig = stripePublishableKey.length > 0 && supabaseFunctionUrl.length > 0;