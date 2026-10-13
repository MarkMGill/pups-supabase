# Profiles and orders

## Deploy

1. Review `npx supabase db push --dry-run`, then run `npx supabase db push`.
   The new migration automatically creates missing profiles for existing Auth
   accounts, preserving their IDs and admin membership. New signups get profiles
   through a database trigger. Existing profiles are left intact.
2. Deploy the three functions:

   ```powershell
   npx supabase functions deploy create-payment-sheet
   npx supabase functions deploy confirm-order
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   ```

3. In the Stripe Dashboard, in the same test/live environment as your keys,
   create a webhook destination for `payment_intent.succeeded`:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```

4. Copy that endpoint's signing secret (`whsec_...`) into Supabase Dashboard >
   Edge Functions > Secrets as `STRIPE_WEBHOOK_SECRET`. Keep the existing
   `STRIPE_SECRET_KEY`. Supabase provides `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` to hosted functions; don't put a service-role key
   in the Expo environment.
5. Restart/reload Expo and test a purchase. Deploy server changes and reload
   the app together: the payment endpoint now expects cart items, not a total.

## What gets saved

One `orders` row per puppy in a checkout, with `quantity`, the line's total
`amount_cents`, user ID, and a shared checkout/payment ID. Prices are read from
the database by the server. Orders start as `pending` before the payment form
opens. After payment, `confirm-order` checks the actual Stripe PaymentIntent;
the signed webhook provides a second path if the app closes or confirmation
fails. Repeated confirmation only updates existing pending rows; it does not
insert duplicate paid orders. Cancelled/abandoned checkouts remain pending;
this change does not add inventory reservations or fulfillment automation.

Normal clients can read their own orders but cannot write payment status.
The profile trigger uses Auth user IDs and name metadata, with an email-prefix
fallback. This covers existing and new users, not synchronization of later
profile/email edits.

## Existing payments

Old payments cannot be automatically converted into orders because the previous
endpoint stored no puppy IDs, checkout ID, or user ID in Stripe metadata.
Do not pay again to recreate a record. For any historical payment that matters,
verify its successful PaymentIntent in Stripe and reconcile it manually in the
SQL Editor using the correct user, puppy, amount, and payment ID. The profile
backfill requires no manual user recreation.

## Verify

- `npm run typecheck`
- `node --test tests/checkout.test.cjs tests/puppyAdmin.test.cjs`
- `deno test --no-config --allow-read tests/profileMigration.test.ts` checks
  the migration against an isolated PostgreSQL instance in memory.
- After migration, confirm existing users have profiles. Sign up with a new
  test account and confirm its profile ID matches Authentication > Users.
- Use Stripe's `4242 4242 4242 4242` in test mode. Check one order row per cart
  puppy, the correct quantities/totals, and `paid` after confirmation.
- Redeliver the same webhook event; the row count must remain unchanged.
- Cancel the payment form: no order should be marked paid.
- A normal user's direct insert/update/delete request against orders must fail.

Automated tests cover cart validation and payment/order matching. Trigger, RLS,
signature verification, and real payment integration need deployed/local
Supabase and Stripe testing.
