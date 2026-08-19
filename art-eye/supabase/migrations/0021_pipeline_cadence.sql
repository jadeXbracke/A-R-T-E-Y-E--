-- 0021 — tighten the discovery/validation pipeline cadence.
--
-- Discovery was monthly, and its prompt only looked for venues opened in
-- the last ~3 months — a venue that opened just after a run, or one that
-- simply predates the register and was never found, stayed invisible for
-- up to a month either way. Moving to weekly halves the worst-case gap.
--
-- Run this after 0006 (needs the same vault secrets already set up there).

-- discover-venues: monthly -> weekly (Mondays 03:00 UTC, after validate).
select cron.unschedule('discover-venues-monthly');
select cron.schedule('discover-venues-weekly', '0 3 * * 1', $$select call_pipeline_function('discover-venues')$$);
