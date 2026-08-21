# ART EYE — project notes for Claude Code

## Which version is "the website"? (read this first)

- **`main` is the source of truth.** It was brought level with the deployed
  site in PR #19 (Aug 2026), after drifting 50 commits behind for weeks.
- What is live at https://jadexbracke.github.io/D-I-S-APP-/ is the `docs/`
  export served by GitHub Pages. The Pages setting should point at
  **`main` + `/docs`**; if the live site ever differs from `main`'s `docs/`,
  check Settings → Pages first — it previously pointed at the side branch
  `claude/art-eye-app-updates-bsvrl8` (now retired, do not build on it).
- The Montserrat "rebrand" (PRs #15–17) was **abandoned** and never deployed.
  Do not resurrect its wordmark styling.

## The logo (source of truth)

- The ARTEYE wordmark is **an image asset, not a font**:
  `art-eye/assets/logo-arteye.png` (custom extra-wide letterforms). A copy
  plus 1:1 vectorised SVG variants live in `branding/` (see
  `branding/README.md`). Never re-render the wordmark from Montserrat or any
  other font.
- The SYDNEY subline under the wordmark is Archivo Medium
  (`fonts.monoMedium`), letter-spaced caps.
- Ink `#131211` on white; thin hairlines; no other colours.

## Live mode vs. demo mode (read this before touching `docs/`)

- The app has two backends selected at **build time**:
  `DEMO_MODE = !process.env.EXPO_PUBLIC_SUPABASE_URL` (`art-eye/src/lib/api.ts`).
  Demo mode stores everything in the browser's local storage only — nothing
  survives a cache clear, a different device, or a different browser, and
  nothing here is ever backed up. The site ran in demo mode from its first
  deploy until Aug 2026; a real Supabase project (schema in
  `art-eye/supabase/`, setup steps in `art-eye/README.md`) is now live.
- **`docs/` must never be rebuilt without the Supabase credentials set**, or
  the live site silently reverts to demo mode and every visitor's data (and
  the owner's own account) becomes local-only and disposable again. Don't run
  `npm run build:pages` by hand unless `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set (`art-eye/.env`, gitignored).
- **Prefer not to hand-build at all.** `.github/workflows/deploy-pages.yml`
  rebuilds and commits `docs/` automatically on every push to `main` that
  touches `art-eye/**`; the Supabase URL and publishable key are committed
  right in that workflow (public by design — they ship inside the exported
  JS anyway). Push the source change and let it run rather than exporting
  locally.
- To confirm which mode a build is in without a live check: open the
  Curator tab signed out. Demo mode shows "Demo build — try
  jadebrack@gmail.com…"; live mode shows a small build stamp instead
  (git sha + export date, from `art-eye/app.config.js` → `BuildStamp` in
  `art-eye/src/components/ui.tsx`).

## Venue data: one source, generated SQL

- **`art-eye/src/lib/seed.ts` is the single source of truth** for the venue
  register and the verified exhibitions. Everything under `art-eye/supabase/`
  (`setup_1_schema.sql`, `venues_seed.sql`, `setup_2_venues.sql`,
  `exhibitions_seed.sql`, `setup_all.sql`) is **generated** — never edit those
  by hand. Change `seed.ts`, then run `npm run seed:sql`.
- `npm run check:seed` validates the register (duplicate slugs, exhibitions
  pointing at venues that do not exist, venues missing an address or a link)
  and fails if the SQL is out of date. CI runs it on every push that touches
  `art-eye/**`, and the Pages deploy runs it before exporting.
- A venue that closes or leaves its space is **archived, never deleted**:
  set `status: 'archived'` (or `'pending'` when a closure is unconfirmed) plus
  `archived_reason` and `archived_date`. Only `status: 'active'` venues reach
  the app, in demo and live alike. Keeping the row is what stops the discovery
  pipeline from proposing the venue all over again.
- Before this was set up, the two lists drifted: five venues lived only in
  `seed.ts` and never reached Supabase (silently dropping six exhibitions),
  migrations 0018–0020 were missing from the one-file setup, and six closed
  venues were published as active. See `art-eye/docs/venue-audit-2026-08.md`.

## Repo layout

- `art-eye/` — the Expo app (source).
- `docs/` — the exported web build that GitHub Pages serves. Auto-rebuilt by
  `.github/workflows/deploy-pages.yml` — see above before exporting by hand.
- `branding/` — logo variations (print-ready SVGs), overview page, generator.
