# ARTEYE — branding

Logo variations for the ARTEYE (Sydney) identity, built from the **real logo
artwork** the app ships (`art-eye/assets/logo-arteye.png` on the deployed
branch `claude/art-eye-app-updates-bsvrl8` — a copy lives in
`tools/logo-arteye.png`). The wordmark is vectorised 1:1 from that file with
potrace (verified by pixel overlay, IoU 0.90); it is a custom extra-wide
letterform set, **not** a plain font. The SYDNEY subline is Archivo Medium —
the face the deployed app uses for it — at the proportions of the site header.

Ink `#131211` on white; every SVG uses `currentColor` so the colour can be
overridden (e.g. white on dark).

Open `index.html` for the full overview with mockups and usage advice.

| File | Variant |
| --- | --- |
| `logo-primary.svg` | 1 — ARTEYE over SYDNEY (site-header lockup) |
| `logo-wordmark.svg` | 2 — ARTEYE wordmark only |
| `logo-horizontal.svg` | 3 — one-line lockup with hairline divider |
| `monogram-ae.svg` | 4 — A E initials (cut from the wordmark) |
| `monogram-ae-circle.svg` | 5 — A E in hairline circle |
| `monogram-ae-square.svg` | 6 — A E in square (stamp) |
| `sticker-circle.svg` | 7 — full round sticker badge |
| `tile-ae-ink.svg` | 8 — app icon / favicon tile (white on ink) |

Regenerate with `tools/gen_logos.py` (Python + fontTools + Pillow + numpy +
potrace; needs `tools/logo-arteye.png` and an Archivo Medium instance
`A500.ttf` — instanced at wght 500 from google/fonts `Archivo[wdth,wght].ttf`
— next to the script).

Note for future site work: GitHub Pages currently deploys from
`claude/art-eye-app-updates-bsvrl8`, not from `main` — the `docs/` export on
that branch is also older than its `art-eye/` source. Keep that in mind when
comparing "the website" with the repo.
