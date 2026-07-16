# ART EYE ●

*Your eye on the art world.* A mobile-first iOS app (React Native + Expo) that brings Sydney's
museum and gallery exhibitions together in one editorial agenda — browse the curated agenda,
save to **Want to see**, mark as **seen** with a rating and a short reflection, and build a
personal record on your **Curator** profile.

## Run it

```bash
npm install
npm run ios        # opens the iOS simulator via Expo
```

Requires Node 20+, Xcode + iOS simulator, and the Expo CLI (bundled — no global install needed).

### Two backends, zero configuration to demo

- **Demo mode (default)** — with no environment variables set, the app runs against an
  on-device, seeded backend (AsyncStorage): all 13 exhibitions, full auth, watchlist, log,
  submissions and the admin approval flow work end-to-end. Sign in as
  `jadebrack@gmail.com` (any password) to get the admin account.
- **Supabase mode** — copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL`
  and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Then, in your Supabase project:
  1. Run `supabase/migrations/0001_schema.sql` (tables, RLS, storage bucket).
  2. Run `supabase/seed.sql` (8 venues, the 13 July-2026 Sydney exhibitions).
  3. Sign up in the app with `jadebrack@gmail.com`, then run the final `update` statement
     in `seed.sql` to promote that account to admin.

The app selects the backend at startup (`src/lib/store.tsx`); both implement the same
interface (`src/lib/backend.ts`), so switching is only an `.env` change.

## Design system

The visual spec (prototype v2) is codified in `src/theme.ts`: white `#FFFFFF` ground, ink
`#131211`, grey `#7B766D`, hairline `#E4E1DB`, and a single red `#C22F1E` used only for the
seen dot, rating dots, opening-night tags and active underlines. Archivo for the wordmark and
artist names (letterspaced caps), Cormorant Garamond italic for titles and reflections,
IBM Plex Mono for dates, venues, labels, filters, buttons and the tab bar. Hairline rules,
square corners, underlined mono text links — no pills, chips, shadows or rounded buttons.

Exhibitions without a press image render a neutral tonal plate (deterministic muted tone with
an inset hairline frame). To use real venue press images, set `image_url` in
`src/lib/seed.ts` / `supabase/seed.sql` or upload via the storage bucket.

## What's inside

- **Agenda** — Curator's picks hero carousel (featured flag), The Sydney Edit kicker,
  mono filters (ALL / OPENING SOON / CLOSING SOON / MUSEUMS / GALLERIES), On now with
  List/Grid toggle, public submission entry point.
- **Exhibition detail** — full-bleed cover with caps artist + italic title, mono spec table
  (VENUE / TYPE / DATES / OPENING), serif description, square action bar
  (WANT TO SEE | MARK AS SEEN).
- **Log flow** — five red rating dots, "What stayed with you?", full-width ink save bar.
- **Curator profile** — profile type label, Seen / Want to see / Avg stat line, diary-style log.
- **Venue accounts** — submit and edit exhibitions for their venue; everything enters
  *pending* and appears publicly only after admin approval.
- **Public submission form** — no account needed; also creates a pending row.
- **Admin review desk** — pending list; edit any field before approving; rejecting requires a
  one-tap reason (outside Sydney / incomplete / no image / other).
- **Phase-2-ready schema** — `guides` + `guide_items` stub tables and a `city` column on
  venues/exhibitions from day one.

## Tests

```bash
npm run typecheck   # strict TypeScript
npm test            # data-layer smoke test: seed integrity, date logic,
                    # validation, auth, watchlist, visits, approval flow
```
