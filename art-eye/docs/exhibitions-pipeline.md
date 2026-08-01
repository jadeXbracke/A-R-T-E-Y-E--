# Exhibitions pipeline — deploy & run

Pulls **real, current exhibitions** from each venue's own website (plus Art Guide
Australia / Ocula) using Claude `web_search`, into a review queue. Nothing goes
live until you approve it. "Propose, never apply."

Pieces:
- `supabase/migrations/0015_exhibition_pipeline.sql` — `exhibition_review_queue`
  table + `approve_exhibition_proposal(qid)` RPC (admin-only).
- `supabase/functions/discover-exhibitions/` — the Edge Function.

## Prerequisites (yours — I can't do these from the build session)
1. A Supabase project (free tier is fine).
2. Supabase CLI: `npm i -g supabase` then `supabase login`.
3. An Anthropic API key (console.anthropic.com) — the pipeline uses Claude.

## One-time setup
```bash
cd art-eye
supabase link --project-ref <YOUR_PROJECT_REF>

# 1. apply the database schema (all migrations, incl. 0015)
supabase db push

# 2. give the functions their secrets
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

# 3. deploy the discovery function
supabase functions deploy discover-exhibitions
```

Then point the app at this project by setting, in the app's env:
```
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```
(Without these the app runs in local demo mode.)

## Run it
```bash
# dry run first — finds shows, changes nothing, prints a report + cost estimate
curl "https://<ref>.functions.supabase.co/discover-exhibitions?dry_run=1&limit=20"

# for real — writes to the review queue (still not live)
curl "https://<ref>.functions.supabase.co/discover-exhibitions?limit=60"
```
`limit` caps how many venues are scanned per run; the run is also hard-capped at
30 Claude calls (~8 venues per call) so cost stays bounded.

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

## Cost
Bounded per run by the 30-Claude-call cap. The dry run prints
`cost_estimate_usd`; check it before scaling `limit` up.
