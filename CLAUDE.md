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

## Repo layout

- `art-eye/` — the Expo app (source).
- `docs/` — the exported web build that GitHub Pages serves. Auto-rebuilt by
  `.github/workflows/deploy-pages.yml` — see above before exporting by hand.
- `branding/` — logo variations (print-ready SVGs), overview page, generator.
