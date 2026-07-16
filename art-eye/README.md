# ART EYE ●

*Your eye on the art world.* A mobile-first iOS app for art lovers in Sydney: museum and
gallery exhibitions in one editorial agenda — browse the curated agenda, save to **Want to
see**, mark as **seen** with a rating and a short reflection, and build a personal record on
your **Curator** profile.

React Native + Expo (managed workflow) · Expo Router · Supabase (auth, database, storage).

## Run it

```bash
cd art-eye
npm install
npx expo start --ios        # press i for the iOS simulator
```

**The app runs out of the box with no backend**: when `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_ANON_KEY` are not set, a local demo adapter (AsyncStorage) serves the
full experience — seeded catalogue, accounts, watchlist, visit log, submissions and admin
approval — so a fresh checkout is demoable immediately. Signing up with
`jadebrack@gmail.com` (any password) grants the admin role in demo mode.

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (schema, RLS, auth trigger,
   storage bucket).
3. Run `supabase/seed.sql` (8 venues, the 13 real July-2026 Sydney exhibitions; Archibald,
   Murakami and Primavera are flagged `is_featured` for the hero carousel).
4. Create a `.env` file:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
5. Sign up in the app with `jadebrack@gmail.com`, then re-run the last statement of
   `seed.sql` to promote that account to admin (roles can never be self-assigned from the
   client; the signup trigger only allows `user` / `venue_owner`).

## Design system

Tokens live in `src/lib/theme.ts`, extracted from the ART EYE prototype v2:

- **Palette** — white `#FFFFFF`, ink `#131211`, grey `#7B766D`, hairline `#E4E1DB`, and a
  single red accent `#C22F1E` reserved for the seen-dot, rating dots, opening tags and
  active underlines (the gallery convention marking a sold work).
- **Type** — Archivo (letterspaced caps: wordmark, artist names), Cormorant Garamond italic
  (titles, reflections, headings), IBM Plex Mono (dates, venues, labels, filters, buttons,
  tab bar). Loaded via `@expo-google-fonts`.
- **Structure** — hairline rules and square corners everywhere; zero border-radius except
  the circular dots. Filters and toggles are underlined mono text links; action buttons sit
  side-by-side in a single 1px ink-bordered bar.

Users are *curators* throughout the copy: they curate their list, their log is *your
curation*, the featured strip is *The Sydney Edit — curated weekly*.

## Architecture

```
src/
  app/                    Expo Router routes
    (tabs)/               agenda · saved (Want to see) · profile (Curator) · admin (Review)
    exhibition/[id]       detail: cover overlay, mono spec table, action bar
    log/[id]              mark-as-seen: five-dot rating + reflection
    submit                public submission form (no account needed)
    edit-submission/[id]  venue owners edit their own submissions (resubmits for review)
    review/[id]           admin: edit any field, approve, or reject with a one-tap reason
    auth/                 sign-in · sign-up (profile type + curator/venue account)
  components/             ui primitives + exhibition components (carousel, rows, grid, form)
  lib/
    theme.ts              design tokens
    data/                 DataAdapter interface → RemoteAdapter (Supabase) | LocalAdapter (demo)
    seed.ts               13 real Sydney exhibitions + 8 venues
supabase/
  migrations/0001_init.sql  schema + RLS + auth trigger + storage bucket
  seed.sql                  catalogue seed + admin promotion
```

- **Moderation** — every submission (venue-owner or public) is `pending`; only admins can
  set `approved`/`rejected` (enforced by RLS: inserts must be pending and unfeatured;
  non-admin updates return the row to pending). Rejection requires a reason: outside
  Sydney / incomplete / no image / other.
- **Privacy** — watchlist and visit rows are RLS-locked to their owner; venue accounts can
  never read individual user rows. Venue-facing analytics must be aggregate-only.
- **Phase 2 ready** — `guides` / `guide_items` tables are stubbed for user-curated city
  guides; `city` exists on venues and exhibitions from day one, so a second city is a data
  task, not a rebuild. No gamification, no social feed, by design.
- **Images** — venue press images were not redistributable, so the seed catalogue ships
  with neutral bundled placeholder artworks (`assets/art/`, regenerate with
  `npm run generate:art`); set `image_url` on any exhibition to use a real press image.

## Tests

```bash
npx tsc --noEmit                                            # typecheck
npx tsx --tsconfig tsconfig.test.json tools/smoke-test.ts   # data-layer smoke tests
# E2E (web export + headless Chromium):
npx expo export --platform web --output-dir dist-web
(cd dist-web && python3 -m http.server 8765 &) && node tools/e2e.js
```
