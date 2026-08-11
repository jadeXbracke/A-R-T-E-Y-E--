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

## Repo layout

- `art-eye/` — the Expo app (source).
- `docs/` — the exported web build that GitHub Pages serves. It is a build
  artifact: re-export it after app changes or the live site silently lags
  behind the source.
- `branding/` — logo variations (print-ready SVGs), overview page, generator.
