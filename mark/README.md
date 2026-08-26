# MARK

Consistency and identity tracker. Every check-in is a *mark*: a small piece
of evidence of who you are becoming. See `PROJECTPLAN.md` for the full plan
(data model, screens, circle concept).

## Run

```bash
cd mark
npm install
npm run web      # or: npm start (Expo Go)
```

Without configuration the app runs in **demo mode**: all data stays in local
storage on the device/browser.

## Live mode (Supabase)

1. Create a Supabase project **in an EU region** (this cannot be changed
   later — see `docs/privacy-compliance.md`) and run
   `supabase/setup_1_schema.sql` followed by `supabase/setup_2_account.sql`
   in the SQL editor.
2. Put in `mark/.env` (gitignored):

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
   ```

3. Restart Expo. The mode is chosen at build time
   (`DEMO_MODE = !EXPO_PUBLIC_SUPABASE_URL`), just like ART EYE.

Cycle data is never written to Supabase, even in live mode — it stays on the
device (see PROJECTPLAN.md, Privacy).

## Typecheck

```bash
npm run typecheck
```
