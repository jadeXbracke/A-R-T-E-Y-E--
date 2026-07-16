# ART EYE

*Your eye on the art world.*

A mobile-first iOS app (React Native + Expo) for art lovers in Sydney. It
brings museum and gallery exhibitions together in one editorial agenda and
lets you plan and log your visits:

**browse the curated agenda → save to "Want to see" → mark as seen with a
rating and a short reflection → build a personal record on your Curator
profile.**

## Design system

White `#FFFFFF`, ink `#131211`, grey `#7B766D`, hairline `#E4E1DB`, and a
single red accent `#C22F1E` reserved for the "seen" dot, rating dots,
opening-night tags and active-state underlines. Archivo (letterspaced caps),
Cormorant Garamond italic (titles, reflections), IBM Plex Mono (dates,
venues, labels, buttons). Hairline rules and square corners throughout —
the only curved shapes in the app are the circular dots. Tokens live in
[`src/theme/index.ts`](src/theme/index.ts).

## Run it (iOS)

```bash
npm install
npx expo start --ios        # opens the iOS simulator
```

Or `npx expo start` and press `i`. Requires Xcode + an iOS simulator
(or scan the QR code with Expo Go on an iPhone).

### Demo mode vs Supabase

Out of the box the app runs in **demo mode**: the full experience against a
local, on-device store seeded with 13 real Sydney exhibitions (July 2026).
Accounts, watchlist and visit log persist on the device. Signing up with
`jadebrack@gmail.com` gives the admin role in demo mode too.

To run against a real backend, follow [`supabase/README.md`](supabase/README.md)
(migrations + seed + auth setup), then:

```bash
cp .env.example .env   # fill in EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
npx expo start --ios
```

## Structure

- `src/theme/` — design tokens + font loading
- `src/lib/` — types, date/filter helpers, app state, and the backend
  abstraction (`SupabaseBackend` / seeded `DemoBackend`)
- `src/components/` — shared UI primitives (hairlines, dots, action bars,
  mono text links, list rows, submission form)
- `src/app/` — Expo Router screens: agenda (hero Curator's picks carousel,
  filters, list/grid), exhibition detail, mark-as-seen log flow, want-to-see,
  Curator profile, venue-owner submissions, public submission form, admin
  review queue
- `supabase/` — schema migrations (with RLS), storage bucket, seed data

## Roles & approval flow

- **Curators (users)** browse, save and log. Their watchlist and visits are
  private — RLS-locked to the owning user.
- **Venue owners** submit and edit their own exhibitions; submissions are
  `pending` until an admin approves them. Nothing auto-publishes.
- **Public form** — anyone can propose an exhibition without an account.
- **Admins** review the queue: approve (optionally editing any field first)
  or reject with a one-tap reason (outside Sydney / incomplete / no image /
  other).
