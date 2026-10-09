# Add Puppy setup

The app now has an admin-only Add Puppy screen with photo upload. Editing and
availability tracking are later stages.

1. Run `npx supabase db push --dry-run` from this repository. Review the pending
   migrations, then run `npx supabase db push`. The health migration must be
   applied before the admin form can save. If the initial migration is unexpectedly
   pending, resolve the migration history before pushing it.
2. Sign up/sign in to the app using a real Supabase account. Confirm the email
   if confirmation is enabled.
3. In your project's Supabase SQL Editor, replace the email below with the same
   email used to sign in. Run this once to authorize that account:

   ```sql
   insert into public.puppy_admins (user_id)
   select id from auth.users where lower(email) = lower('YOUR_EMAIL_HERE')
   on conflict (user_id) do nothing;
   ```

   Verify that the account appears in `puppy_admins`. If no row was inserted,
   check that the account exists under Authentication > Users and the email matches.
4. Restart Expo (`npm run android`, or `npm run web` for a browser), then sign
   in again. The catalog shows an Add Puppy button for authorized accounts.
5. Add a puppy using a JPEG, PNG, or WebP photo up to 5 MB. Enter USD prices in
   dollars; the app converts them to integer cents.

The migration creates a public `puppy-photos` bucket. Photos are publicly
viewable, while uploads require an admin account and a folder matching that
account's ID. Admin membership can only be changed through privileged database
access. No service role key is needed in the app.

## Verification

- Run `npm run typecheck` and `node --test tests/puppyAdmin.test.cjs` (Node 22+).
- As an admin, save one puppy and confirm the row and photo in Supabase.
- As a normal account, confirm Add Puppy is hidden and opening `/add-puppy`
  displays an access message.
- Verify database enforcement in a local/staging project: a normal user's
  authenticated API request to insert a puppy or a storage object must fail,
  and requests to insert/update/delete `puppy_admins` must fail even for admins.

The automated checks cover input validation and application permission checks;
the RLS and native photo picker checks require a running Supabase database and
an emulator/browser.
