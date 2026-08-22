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

## Keep it fresh — this is the part that makes it self-maintaining

Run **`supabase/setup_3_automation.sql`** once in the SQL Editor. It schedules
every job, including this one, and supersedes both the old `schedule.sql` and
migration `0006_pipeline_cron.sql`.

What it sets up:

| Job | Wanneer (UTC) | Doet |
|---|---|---|
| `arteye-discover-exhibitions` | zo 20:00 | loopt met `?chain=1` het hele register langs en vult de wachtrij |
| `arteye-autopilot` | zo 21:00 | publiceert wat letterlijk van de galerie-site kwam; gooit afgelopen voorstellen weg |
| `arteye-digest` | ma 09:00 | mailt wat er nog op goedkeuring wacht |
| `validate-venues-weekly` | ma 02:00 | controleert 20 venues per week op verhuizing/sluiting |
| `discover-venues-monthly` | 1e van de maand 03:00 | zoekt nieuwe venues |
| `art-eye-enrich-images` | di 02:30 | haalt persfoto's op |

Two things had to be fixed before this worked at all: the old scheduler called
the function as `Discover-exhibitions` (capital D — Edge Function names are
case-sensitive, so 404) and sent no `Authorization` header (401). Both are
handled by `call_pipeline_function()` in setup_3.

### What publishes by itself, and what does not

`auto_approve_exhibition_proposals(0.9)` (migration 0023) publishes **only**
proposals read verbatim from a venue's own `schema.org` data — confidence 0.9 —
and only when the venue is active, the dates are sane, and the show has not
finished. Anything the Gemini fallback interpreted (0.65) still waits for you.

Lower the bar at your own risk:
```sql
select auto_approve_exhibition_proposals(0.6);  -- ook de AI-gelezen shows
```

### Is it actually running?
```sql
select * from pipeline_health order by last_run desc nulls last;

select j.jobname, d.status, d.return_message, d.start_time
from cron.job_run_details d join cron.job j on j.jobid = d.jobid
order by d.start_time desc limit 20;
```
A job that has quietly stopped shows up as a stale `last_run`, not as silence.

## Cost
**€0 in practice.** JSON-LD costs nothing; the Gemini fallback runs on Google AI
Studio's free tier and is capped at 40 calls per run.
