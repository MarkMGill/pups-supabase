# Puppy Store

Expo React Native starter for a puppy marketplace with Zustand state management, Supabase backend support, and Stripe checkout wiring.

## What is included

- Register and login screens
- Puppy catalog with pictures and breed details
- Puppy detail screen with age and price
- Cart and checkout flow
- Supabase migration and Stripe Edge Function scaffolding

## Setup needed from you

1. Create a Supabase project and add the values to `.env` from `.env.example`.
2. Configure Stripe and expose the publishable key plus the Supabase Edge Function URL.
3. Deploy the `create-payment-sheet` Supabase function and set `STRIPE_SECRET_KEY` in function secrets.
4. Run the SQL migration in `supabase/migrations/001_init.sql`.

## Local run

1. Install dependencies.
2. Start Expo with `npm run start`.
3. Open the app in Expo Go or a simulator.

## Notes

- The app falls back to local demo auth and seed puppy data if Supabase is not configured yet.
- Stripe checkout requires the Supabase Edge Function to return a PaymentSheet client secret.