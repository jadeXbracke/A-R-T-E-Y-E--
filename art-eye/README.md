# ART EYE

*Your eye on the art world.* A mobile-first iOS app (React Native + Expo) for art lovers in
Sydney: museum and gallery exhibitions in one editorial agenda — browse, save to **Want to
see**, mark as **seen** with a rating and a short reflection, and build your record on your
**Curator** profile.

## Run it

```bash
cd art-eye
npm install
npx expo start --ios        # opens the iOS simulator
```

Requires Node 20+, Xcode + iOS simulator (macOS), Expo Go or a dev build.

### Demo mode (default — zero config)

With no environment variables set, the app runs on a bundled demo backend
(AsyncStorage-persisted, seeded with the July 2026 Sydney agenda). Auth, curation,
submissions and admin approval all work. Demo accounts (password `arteye`):

| Account | Role |
| --- | --- |
| `jadebrack@gmail.com` | admin — sees the Editors' desk |
| `gallery@arteye.demo` | venue owner — Roslyn Oxley9 Gallery |
| `curator@arteye.demo` | regular curator with a small log |

### Live mode (Supabase)

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql` (SQL editor or
   `supabase db push` + `psql -f`).
3. Create `.env` in `art-eye/`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
4. Sign up in the app with `jadebrack@gmail.com`, then promote it to admin (snippet at the
   bottom of `seed.sql`).

## Design system

Tokens live in `src/theme.ts`, extracted from the prototype spec: white `#FFFFFF` ground,
ink `#131211`, grey `#7B766D`, hairline `#E4E1DB`, and a single red accent `#C22F1E`
reserved for the seen-dot, rating dots, opening-night tags and active underlines. Archivo
(letterspaced caps), Cormorant Garamond italic (titles, reflections), IBM Plex Mono (dates,
venues, labels, buttons, tab bar). Square corners everywhere — the only circles are the dots.

## Structure

- `app/` — expo-router screens: agenda (hero carousel + list/grid + filters), exhibition
  detail, mark-as-seen flow, saved list, curator profile, submit, venue-owner submission
  edit, admin review queue.
- `src/lib/` — one `Api` interface, two backends: `demo-store.ts` (local) and
  `supabase-api.ts` (live), switched by env in `api.ts`.
- `supabase/` — schema + RLS migration and the 13-exhibition seed.
- `scripts/gen-placeholders.js` — regenerates the neutral tonal placeholder images used
  until venue press images are cleared (swap via admin → IMAGE URL, or `image_url` column).

## Approval flow

Every submission — from the public form (no account) or a venue owner — is created with
`status = 'pending'` and is invisible in the agenda until an admin approves it. Admins can
edit any field before approving; rejection requires a one-tap reason (outside Sydney /
incomplete / no image / other). Venue-owner edits send the row back to review; RLS prevents
owners from self-approving or self-featuring. Individual watchlist/visit rows are never
readable by venue accounts.
