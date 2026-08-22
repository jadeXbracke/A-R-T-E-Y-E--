-- 0006 — SUPERSEDED by supabase/setup_3_automation.sql. Do not run this file.
--
-- It schedules four of the jobs but never scheduled discover-exhibitions, so
-- the exhibition programme aged while the venue register was maintained. Its
-- one-argument call_pipeline_function() also cannot pass query parameters, so
-- it cannot ask a run to walk the whole register (?chain=1). setup_3 replaces
-- both, unschedules whatever this file left behind, and is safe to re-run.
--
-- Kept only so an existing database that already ran it still matches history.
--
-- 0006 — pipeline schedules (pg_cron + pg_net calling the Edge Functions).
--
-- ⚠️ SETUP REQUIRED before running this file:
--  1. Deploy the functions:  supabase functions deploy validate-venues discover-venues queue-digest
--  2. Set function secrets:  supabase secrets set ANTHROPIC_API_KEY=... RESEND_API_KEY=... DIGEST_TO=you@example.com
--  3. In the SQL editor, store two Vault secrets (Project Settings → Vault also works):
--       select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
--       select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
--  4. Then run this file. Nothing here touches venue data — the jobs only
--     propose; you approve in the Owner Inbox.
--
-- Test a job by hand first (dry run, writes nothing):
--   curl -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
--     "https://<PROJECT_REF>.supabase.co/functions/v1/validate-venues?dry_run=1"

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function call_pipeline_function(fn text) returns void
language plpgsql security definer set search_path = public as $$
declare
  base_url text;
  key text;
begin
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into key from vault.decrypted_secrets where name = 'service_role_key';
  if base_url is null or key is null then
    raise exception 'Vault secrets project_url / service_role_key are not set (see 0006 header)';
  end if;
  perform net.http_post(
    url := base_url || '/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || key),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
end $$;

-- weekly validation: Mondays 02:00 UTC (20 venues/run → full register in ~7 weeks)
select cron.schedule('validate-venues-weekly', '0 2 * * 1', $$select call_pipeline_function('validate-venues')$$);
-- monthly discovery: 1st of the month, 03:00 UTC
select cron.schedule('discover-venues-monthly', '0 3 1 * *', $$select call_pipeline_function('discover-venues')$$);
-- weekly digest: Mondays 09:00 UTC (only emails when the queue is non-empty)
select cron.schedule('queue-digest-weekly', '0 9 * * 1', $$select call_pipeline_function('queue-digest')$$);
-- weekly press-image pass: Tuesdays 02:30 UTC, after Monday's validate run
-- (needs run_type.enrich + exhibitions.image_source from 0010_press_images.sql)
select cron.schedule('art-eye-enrich-images', '30 2 * * 2', $$select call_pipeline_function('enrich-images')$$);
