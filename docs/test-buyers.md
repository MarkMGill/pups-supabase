# Two non-admin test buyers

Create `.env.seed` from `.env.seed.example`, then set your server-only
`SUPABASE_SERVICE_ROLE_KEY`. This file is ignored by Git. Do not paste the key
into chat or put it in an Expo public variable.

Run from the project root:

```powershell
node scripts/seed-test-buyers.cjs
```

The script creates confirmed accounts using Supabase Auth's admin API, verifies
their profiles and absence from `puppy_admins`, then creates sample orders using
existing puppy listings. It signs in as each buyer to check order isolation.
Existing fixture accounts are reused; unrelated accounts and orders are not
overwritten. Re-running refreshes fixture order statuses, not account passwords.

| Email | Password |
| --- | --- |
| puppies.buyer1@example.com | PuppiesTest!2026 |
| puppies.buyer2@example.com | PuppiesTest!2026 |

Each account gets one sample `paid` checkout and one `pending` checkout. These
are synthetic UI fixtures with no Stripe payment IDs or actual charges. They
can test order lists, account isolation, and admin visibility, but not refunds.
For refund testing later, make a real Stripe test-mode payment with either user.

Apply the profile/order/admin-list migrations first. As either buyer, My Orders
should show only their orders and Admin orders should be inaccessible. As an
admin, Admin orders should show both buyers after refreshing.
