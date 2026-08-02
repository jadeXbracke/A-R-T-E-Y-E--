# Exhibitions pipeline — deploy & run

Pulls **real, current exhibitions** from each venue's own website. It is a
**hybrid** of two readers:

1. **Free structured data first** — reads `schema.org/Event` from the page's
   JSON-LD (`<script type="application/ld+json">`). Exact, €0, no key.
2. **Google Gemini fallback** — for venues that don't publish JSON-LD, the page
   text is handed to Gemini (Google AI Studio, free tier) to extract the shows.

Gemini is only called when step 1 finds nothing, so most venues cost €0 and the
number of model calls stays tiny — well within Gemini's free tier. Nothing goes
live until you approve it. "Propose, never apply."

Pieces:
- `supabase/migrations/0015_exhibition_pipeline.sql` — `exhibition_review_queue`
  table + `approve_exhibition_proposal(qid)` RPC (admin-only).
- `supabase/functions/discover-exhibitions/` — the Edge Function (JSON-LD + Gemini).

## Cost & limits
- JSON-LD path: **€0**, no key, no limit.
- Gemini path: **free tier** (Google AI Studio). Only the venues without JSON-LD
  hit it, and the run is capped at 40 Gemini calls. Free tier is roughly
  15 requests/min and ~1000/day, so a full weekly (or daily) run won't get near
  the limit. If it ever does, the function stops the AI fallback for that run and
  reports `rate_limited: true` — it never fails the whole run.

## Prerequisites (yours — I can't do these from the build session)
1. A Supabase project (free tier is fine).
2. Supabase CLI: `npm i -g supabase` then `supabase login`.
3. A **Gemini API key** — free from https://aistudio.google.com/apikey
   (only needed for the AI fallback; JSON-LD works without it).

## One-time setup
```bash
cd art-eye
supabase link --project-ref <YOUR_PROJECT_REF>

# 1. apply the database schema (all migrations, incl. 0015)
supabase db push

# 2. give the function the Gemini key (skip if you only want JSON-LD)
supabase secrets set GEMINI_API_KEY=...
# optional: pick a model (default gemini-2.0-flash)
# supabase secrets set GEMINI_MODEL=gemini-2.0-flash

# 3. deploy the discovery function
supabase functions deploy discover-exhibitions
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
```

Then point the app at this project by setting, in the app's env:
```
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```
(Without these the app runs in local demo mode.)

## Run it
```bash
# dry run first — finds shows, changes nothing, prints a report
curl "https://<ref>.functions.supabase.co/discover-exhibitions?dry_run=1&limit=20"

# for real — writes to the review queue (still not live)
curl "https://<ref>.functions.supabase.co/discover-exhibitions?limit=60"
```
`limit` caps how many venues are scanned per run. Each venue costs one HTTP
fetch (a few more only if the first page has no events).

The response reports, per venue, where each show came from (`via: "json-ld"` or
`via: "gemini"`) and how many Gemini calls were used:
```json
{ "venue": "Museum of Contemporary Art", "title": "…", "via": "json-ld", "outcome": "queued" }
{ "venue": "Some small gallery",         "title": "…", "via": "gemini",  "outcome": "queued" }
{ "gemini_calls": 7, "rate_limited": false }
```
`gemini`-sourced rows are queued with a lower confidence (0.65 vs 0.9) since they
are interpreted rather than copied — worth a closer look when approving.

## Review & approve
Queued rows land in `exhibition_review_queue` (status `pending`). Inspect them:
```sql
select id, venue_id, title, artists, start_date, end_date, source_url, confidence
from exhibition_review_queue where status = 'pending' order by created_at desc;
```
Approve one — this inserts the real, published exhibition:
```sql
select approve_exhibition_proposal('<queue row id>');
```
Reject one:
```sql
update exhibition_review_queue set status = 'rejected', reviewed_at = now() where id = '<id>';
```
(A small admin screen for one-tap approve/reject can be added — ask and I'll wire it.)

## Keep it fresh (optional)
Schedule a weekly run with pg_cron (the repo already uses cron in
`0006_pipeline_cron.sql`), e.g.:
```sql
select cron.schedule('discover-exhibitions-weekly', '0 6 * * 1', $$
  select net.http_get('https://<ref>.functions.supabase.co/discover-exhibitions?limit=60');
$$);
```
Because the JSON-LD path is free and the Gemini path is well within its free
tier, you can schedule this daily.

## Cost
**€0 in practice.** JSON-LD costs nothing; the Gemini fallback runs on Google AI
Studio's free tier and is capped at 40 calls per run.
