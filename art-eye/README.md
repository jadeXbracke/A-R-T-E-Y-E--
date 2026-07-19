# ART EYE

*Your eye on the art world.* A mobile-first iOS app (React Native + Expo) for
art lovers in Sydney: museum and gallery exhibitions in one editorial agenda —
browse, save to **Want to see**, mark as **seen** with a rating and a short
reflection, and build a personal record on your Curator profile.

## Run it

```bash
cd art-eye
npm install
npm run ios        # opens the iOS simulator via Expo
# or: npx expo start   and press i
```

No configuration needed for a demo: without Supabase credentials the app runs
on a bundled local store (persisted in AsyncStorage) seeded with the July 2026
Sydney agenda — 13 real exhibitions across 8 venues. Auth, watchlist, visit
log, submissions and the admin queue all work locally.

### Demo accounts

Accounts are created in-app (Profile → Create an account). Signing up with
**jadebrack@gmail.com** makes the account an **admin** (mirrors the Supabase
trigger); choosing **VENUE** at sign-up makes a **venue owner** and links or
creates the named venue.

## Connect Supabase (production)

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`
   (SQL editor or `supabase db push`).
3. `cp .env.example .env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`; restart Expo.

The app auto-detects the env vars and switches from the local store to
Supabase — same `DataClient` interface (`src/lib/api.ts`), two backends
(`src/lib/localClient.ts`, `src/lib/supabaseClient.ts`).

Schema highlights: `users` (role, profile_type, city), `venues`,
`exhibitions` (status pending/approved/rejected, rejection_reason,
is_featured, city), `user_watchlist`, `user_visits`, and phase-2 stubs
`guides` / `guide_items`. RLS keeps individual watchlist/visit rows private
to their owner — venue accounts can never see user-level data. All
submissions (public form included) go through the `submit_exhibition()`
function, which forces `status = 'pending'`; nothing publishes without
admin approval. The `city` field on venues and exhibitions makes a second
city a data task, not a rebuild.

## Design system

`src/theme.ts` holds the tokens extracted from the prototype: white ground,
ink `#131211`, grey `#7B766D`, hairline `#E4E1DB`, and a single red accent
`#C22F1E` reserved for the seen-dot, rating dots, opening-night tags and
active underlines. Type: Archivo (letterspaced caps), Cormorant Garamond
italic (titles, reflections), IBM Plex Mono (dates, venues, labels, buttons,
tab bar). Hairline rules, square corners everywhere — the only circles are
the dots. Seed image URLs use bundled neutral placeholders
(`asset:<key>` → `assets/placeholders/`); swap in venue press image URLs in
`supabase/seed.sql` / `src/data/seed.ts` as they are cleared.
