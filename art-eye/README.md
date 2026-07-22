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
2. Run the migrations in order, then the seeds (SQL editor, or `supabase db push` + `psql -f`):
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_venue_type_ari.sql`
   - `supabase/migrations/0003_venue_register.sql`
   - `supabase/seed.sql` — the 8 venues + 13 July-2026 exhibitions
   - `supabase/venues_seed.sql` — the managed venue register (add your ~50 Sydney venues here)
3. Create `.env` in `art-eye/`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
4. Sign up in the app with `jadebrack@gmail.com`, then promote it to admin (snippet at the
   bottom of `seed.sql`).

### Managing the venue register

- **Add / edit venues:** edit `supabase/venues_seed.sql` (clearly-marked block, one line per
  venue: name, type `gallery`/`museum`/`ari`, address, suburb, website, instagram, lat/long) and
  re-run it. Rows are matched on `slug`, so re-running updates instead of duplicating.
- **Hide test data:** rows you created while trying the app (e.g. `lalala`) live in the DB, not in
  any seed file. List them in `supabase/maintenance/flag_fixture_data.sql` and run it — they get
  `is_fixture = true` and disappear from the public agenda/directory (enforced in RLS), without
  being deleted. Real venues such as *Cassandra Bird* are untouched.

### Host control (in the app)

The host is the account with `role = 'admin'` (that role can only be set in the database — signup
can never grant it). Signed in as the host, the **HOST CONTROL** link on the curator tab opens a
desk where you fully own what the app shows, with no SQL needed:

- **Venue register** — add, edit and delete venues (name, type gallery/museum/ari, address, suburb,
  website, instagram, lat/long) and hide any venue from the public feed. Deleting a venue also
  removes its exhibitions.
- **Exhibitions** — add a show that publishes straight to the agenda, edit any show, mark it a
  curator’s pick, hide/show it, or delete it.
- **Submissions in review** — approve or decline what venue accounts submit.

Every one of these actions is gated twice: the screens only appear for the host, and Postgres RLS
(`supabase/migrations/0004_host_controls.sql`) only lets an admin execute them — so control stays
with the host account and nowhere else.

### Venue pages & photos

- **Venue accounts** get a *Manage your venue* screen (link on the Submit tab) to upload a photo of
  the space and set their website / Instagram / address. RLS lets an owner edit only their own venue.
- **Photos** are picked from the library and uploaded to the `exhibition-images` bucket (or kept as
  local URIs in demo mode), the same path exhibition images use.
- **The exhibition information page** shows the venue’s photo and tappable **Website** / **Instagram**
  links when set — filled in by the venue account or the host.

### Moving backgrounds (Ken Burns + optional video)

- Every hero cover — the opening carousel, the exhibition page, the venue page — moves. By default
  the editorial photo gets a very slow **Ken Burns** zoom-and-drift loop (direction varies per
  item), so the app opens with motion without needing any video assets.
- Venues and exhibitions also take an optional **`video_url`** (migration
  `0008_video_urls.sql`): a link to a short clip that plays as a **muted, looping,
  control-less background** via `expo-video`, replacing the still. The host sets it in the venue /
  exhibition editors; a claimed venue account sets its own under *Manage your venue*. Only the
  active carousel slide plays, so multiple clips never run at once.
- No footage is ever scraped or hotlinked automatically — clips are supplied by the host or the
  venue itself, same honest-sourcing rule as photos.

### Search

A dedicated search screen (`/search`) covers the whole register and agenda in one box: exhibition
titles, artists, venue names, suburbs, categories and districts, accent-insensitive, results
grouped into EXHIBITIONS and VENUES. Entry points: a full-width search bar right above the show
list on the Agenda tab (below the hero carousel and the curated strip) and at the top of the
Venues tab. The host also gets a search box directly in **Host Control → Venue register** and
**→ Exhibitions**, filtering the management list by name/suburb/artist/status for faster edits.

### More links, and one‑tap directions

- **Website/Instagram completion pass** (2026-07-21): a link-discovery sweep filled in whichever
  of the two was missing across the register — 126 of 142 venues now have a website, 112 an
  Instagram handle. Only genuinely unfindable venues (mostly small commercial galleries with no
  web presence) are left blank; the pipeline or the host can fill the rest over time.
- **Instagram Reel / TikTok links.** Venues and exhibitions take an optional `reel_url` — a link
  to a Reel or TikTok the venue or gallery already posted. Where set, a **▶ WATCH THE REEL /
  WATCH ON TIKTOK** button appears on the venue and exhibition pages and opens the actual post.
  Nothing is embedded or scraped — it's the same one-tap-out pattern as Website/Instagram, just
  for short-form video. Editable everywhere image/video links are (host editors, claimed venue
  accounts, submissions). Migration `0011_reel_links.sql`.
- **Google Maps directions.** Every venue address is tappable and opens Google Maps with the
  route already started (`google.com/maps/dir/?api=1&destination=…`, using lat/long when known).
  Appears on the venue page, the exhibition page's address row, and the "THE SPACE" block.

### Imagery rules

- **Exhibition covers show the show, never the building.** An exhibition renders its own press
  image, else its per-show tonal placeholder — no venue-photo fallback, so several shows at one
  venue never repeat the same facade.
- **Venue pages show the space.** Venue photos (freely licensed, Wikimedia Commons, or uploaded
  by the venue/host) appear only there.
- **Press images arrive via the pipeline** (`enrich-images`, weekly, live mode): for current
  shows without an image it finds the venue's own exhibition page (Claude + web search) and takes
  that page's `og:image` — the sharing image the venue itself publishes. Applied only where
  `image_url` is null, with `image_source` recording provenance (migration
  `0010_press_images.sql`); the host can clear or replace any image in the admin editor.

### Opening hours

Venues carry `opening_hours` (compact human line, e.g. "Tue–Sat 10:00–17:00") plus
`hours_checked`, the date it was last verified against the venue's own website — shown together
on the venue page so stale information is visible rather than silent. Editable by the host
(venue editor) and by claimed venue accounts (*Manage your venue*). Migration
`0009_opening_hours.sql`; seeded hours for the 16 venues with current shows were verified
2026-07-21.

### Venue freshness pipeline (live mode only)

A self-validating pipeline keeps the register accurate over time — and **never changes data on
its own**. Jobs research and propose; every proposed change lands in the in-app **Owner Inbox**
(Host Control → Owner Inbox) where the owner approves, edits-and-approves, or rejects it
(rejection snoozes the identical proposal for 90 days). The only direct write a job may make is
`verified_date` on a high-confidence confirmation.

- `supabase/functions/validate-venues` — weekly; checks the 20 stalest active venues (website
  probe + Claude with web search, JSON verdicts with evidence), files archive/update proposals.
- `supabase/functions/discover-venues` — monthly; searches for newly opened Sydney spaces
  (Art Guide, Ocula, Time Out, NAVA), dedupes against register + queue, files add proposals.
- `supabase/functions/queue-digest` — weekly; one email digest when proposals are waiting
  (Resend; never per-item notifications).
- Migrations `0005` (queue/runs tables + RLS, owner-only) and `0006` (pg_cron schedules — read
  its header for the required Vault secrets and deploy steps). Guardrails: evidence required by
  DB CHECK, one pending proposal per venue+action, 30-Claude-calls cost cap per run, per-venue
  try/catch with errors logged to `validation_runs`, dry-run mode via `?dry_run=1`.
- Secrets (`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `DIGEST_TO`) live in Supabase function
  secrets — never in client code. Demo mode seeds two sample proposals so the inbox is testable
  without a backend.

### Public venue directory

The **VENUES** tab lists every venue in the register (filter by museums / galleries / ARIs;
venues with something on view sort first, with an "N ON NOW" marker). Each venue has a public
page with its photo, address, website / Instagram / map links, and its current and upcoming
exhibitions from the agenda. Exhibition pages link back to the venue page via **VENUE PAGE →**.

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
- `supabase/` — schema + RLS migrations, the 13-exhibition seed, the venue register
  (`venues_seed.sql`) and the fixture-flagging script (`maintenance/flag_fixture_data.sql`).
- `scripts/gen-placeholders.js` — regenerates the neutral tonal placeholder images used
  until venue press images are cleared (swap via admin → IMAGE URL, or `image_url` column).

## Approval flow

Every submission — from the public form (no account) or a venue owner — is created with
`status = 'pending'` and is invisible in the agenda until an admin approves it. Admins can
edit any field before approving; rejection requires a one-tap reason (outside Sydney /
incomplete / no image / other). Venue-owner edits send the row back to review; RLS prevents
owners from self-approving or self-featuring. Individual watchlist/visit rows are never
readable by venue accounts.
