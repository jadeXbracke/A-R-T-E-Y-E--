# Exhibitions pipeline — deploy & run

Pulls **real, current exhibitions** from each venue's own website — for **free**,
with **no AI and no API key**. It reads the structured data venues already
publish (`schema.org/Event` in `<script type="application/ld+json">`), so the
data is exact by construction. Nothing goes live until you approve it.
"Propose, never apply."

Pieces:
- `supabase/migrations/0015_exhibition_pipeline.sql` — `exhibition_review_queue`
  table + `approve_exhibition_proposal(qid)` RPC (admin-only).
- `supabase/functions/discover-exhibitions/` — the Edge Function (JSON-LD reader).

## Why free
No model is called. The function fetches each venue's "what's on" page and
parses the JSON-LD event data the site already ships. That means:
- **€0 per run** — no Anthropic/Gemini key, no per-call cost, no rate limit.
- **Exact** — it copies the venue's own published title/dates, it doesn't guess.

Trade-off: it only finds shows on sites that publish JSON-LD (most museums and
larger galleries do; some small galleries don't). For venues without it, use the
admin screen to add shows by hand, or keep the old AI variant in git history.

## Prerequisites (yours — I can't do these from the build session)
1. A Supabase project (free tier is fine).
2. Supabase CLI: `npm i -g supabase` then `supabase login`.

That's it — no API key needed for this function.

## One-time setup
```bash
cd art-eye
supabase link --project-ref <YOUR_PROJECT_REF>

# 1. apply the database schema (all migrations, incl. 0015)
supabase db push

# 2. deploy the discovery function
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

The response reports, per venue, whether structured data was found:
```json
{ "venue": "Museum of Contemporary Art", "title": "…", "outcome": "queued" }
{ "venue": "Some small gallery", "outcome": "no structured data (JSON-LD) found" }
```
Venues with `no structured data` are the ones to fill in by hand.

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
Because runs are free, you can even schedule this daily.

## Cost
**€0.** No model is called.
