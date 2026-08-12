-- 0010 — press images for exhibitions (enrich-images pipeline).
-- image_source records the page the image came from (the venue's own
-- exhibition page or a listing), so every automatically fetched press image
-- is auditable and the host can clear or replace it in the admin editor.

alter type run_type add value if not exists 'enrich';

alter table public.exhibitions
  add column if not exists image_source text;

-- The weekly cron schedule for this pipeline (Tuesdays 02:30) lives in
-- 0006_pipeline_cron.sql alongside the other pipeline jobs — it needs
-- pg_cron/pg_net enabled and the call_pipeline_function() helper that only
-- exists once that (optional, manual-setup) migration has been run.
