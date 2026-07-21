-- 0010 — press images for exhibitions (enrich-images pipeline).
-- image_source records the page the image came from (the venue's own
-- exhibition page or a listing), so every automatically fetched press image
-- is auditable and the host can clear or replace it in the admin editor.

alter type run_type add value if not exists 'enrich';

alter table public.exhibitions
  add column if not exists image_source text;

-- Weekly press-image pass — Tuesdays 02:30, after Monday's validate run.
-- Uses the same Vault secrets (project_url, service_role_key) as 0006.
select cron.schedule(
  'art-eye-enrich-images',
  '30 2 * * 2',
  $$select call_pipeline_function('enrich-images')$$
);
