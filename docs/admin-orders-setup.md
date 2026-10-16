# Stage 2: Admin orders

1. Run `npx supabase db push --dry-run`, review the new admin-order migration,
   then run `npx supabase db push`.
2. Reload Expo and sign in with an account already listed in `puppy_admins`.
3. Tap **Admin orders** on the catalog. The screen shows all buyers' grouped
   checkouts, buyer name/email, puppy quantities, totals, dates, and statuses.
   Pull down to refresh; tapping an order does not start a refund.

This migration only adds SELECT policies. Normal buyers still see their own
orders and profiles; approved admins can read all orders and buyer profiles.
Clients cannot change order payment status. The loader explicitly checks admin
membership before querying, and RLS independently enforces access in Supabase.
No new Edge Functions or Stripe configuration are needed for this stage.

Missing profiles and deleted buyer accounts have fallback labels. Puppy names
come from current listings, not a historical snapshot. Large catalogs may need
server pagination later; this first version fetches the rows allowed by your
Supabase API row limit.

Checks: `npm run typecheck`, `node --test tests/adminOrders.test.cjs`, and
`deno test --no-config --allow-read tests/adminOrderPolicies.test.ts`.
The policy test runs in isolated PostgreSQL memory, without touching hosted data.
After deployment, verify two different buyers' orders are visible to an admin,
and a normal buyer opening `/admin-orders` gets an access error.
