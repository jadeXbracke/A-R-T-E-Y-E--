# ART EYE — project notes for Claude Code

## Which version is "the website"? (read this first)

- **GitHub Pages deploys from the branch `claude/art-eye-app-updates-bsvrl8`,
  NOT from `main`.** What is live at https://jadexbracke.github.io/D-I-S-APP-/
  is that branch's `docs/` export. Before making any statement about "the
  website" (its logo, header, fonts, features), fetch and inspect that branch —
  `main` may be far behind it.
- `main` last ended at the Montserrat "rebrand" (PRs #15–17), which was
  **abandoned** and never deployed. Do not treat `main`'s wordmark styling as
  the brand.

## The logo (source of truth)

- The ARTEYE wordmark is **an image asset, not a font**:
  `art-eye/assets/logo-arteye.png` on the deployed branch (custom extra-wide
  letterforms). A copy plus 1:1 vectorised SVG variants live in `branding/`
  (see `branding/README.md`). Never re-render the wordmark from Montserrat or
  any other font.
- The SYDNEY subline under the wordmark is Archivo Medium (`fonts.monoMedium`
  on the deployed branch), letter-spaced caps.
- Ink `#131211` on white; thin hairlines; no other colours.

## Repo layout

- `art-eye/` — the Expo app (source).
- `docs/` — the exported web build that GitHub Pages serves. It is a build
  artifact: re-export it after app changes or the live site silently lags
  behind the source.
- `branding/` — logo variations (print-ready SVGs), overview page, generator.
