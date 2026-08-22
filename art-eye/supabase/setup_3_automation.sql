-- ============================================================================
--  ART EYE — STAP 3: DE MOTOR AUTOMATISCH LATEN DRAAIEN
-- ============================================================================
--  Hand-geschreven bestand (niet gegenereerd — anders dan setup_1 en setup_2).
--
--  Dit vervangt het oude schedule.sql en migratie 0006. Die twee planden allebei
--  iets, langs elkaar heen, en het oude schedule.sql riep de functie aan als
--  "Discover-exhibitions" met een hoofdletter en zonder Authorization-header —
--  dus 404, en anders 401. De motor heeft daardoor nooit gedraaid.
--
--  VOORAF (eenmalig, in deze volgorde):
--
--   1. Deploy de functies:
--        supabase functions deploy discover-exhibitions validate-venues \
--          discover-venues queue-digest enrich-images
--
--   2. Zet de sleutels voor de functies:
--        supabase secrets set GEMINI_API_KEY=...
--        supabase secrets set RESEND_API_KEY=... DIGEST_TO=jadebrack@gmail.com
--
--   3. Zet twee Vault-secrets, hieronder in de SQL Editor. Je service-role key
--      staat in Project Settings → API. Deel die met niemand.
--
--        select vault.create_secret('https://tbdhglobmjnxllvhqsao.supabase.co', 'project_url');
--        select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
--
--   4. Plak dan dit hele bestand en druk Run.
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- Eén helper voor alle jobs: haalt project-url en sleutel uit de Vault en roept
-- de Edge Function aan mét Authorization-header. Zonder die header antwoordt
-- Supabase met 401 en gebeurt er stilletjes niets.
-- ---------------------------------------------------------------------------
drop function if exists call_pipeline_function(text);
create or replace function call_pipeline_function(fn text, query text default '')
returns void
language plpgsql security definer set search_path = public as $$
declare
  base_url text;
  key      text;
begin
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into key      from vault.decrypted_secrets where name = 'service_role_key';
  if base_url is null or key is null then
    raise exception 'Vault-secrets project_url / service_role_key ontbreken — zie stap 3 in de kop van dit bestand';
  end if;
  perform net.http_post(
    url     := base_url || '/functions/v1/' || fn || query,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || key),
    body    := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
end $$;

-- ---------------------------------------------------------------------------
-- De planning. Alles opnieuw inplannen is veilig: elke job wordt eerst
-- verwijderd als hij al bestaat.
-- ---------------------------------------------------------------------------
do $$
declare j text;
begin
  foreach j in array array[
    'arteye-discover-weekly',          -- oude, kapotte versie
    'validate-venues-weekly', 'discover-venues-monthly', 'queue-digest-weekly',
    'art-eye-enrich-images',
    'arteye-discover-exhibitions', 'arteye-autopilot', 'arteye-digest'
  ] loop
    if exists (select 1 from cron.job where jobname = j) then
      perform cron.unschedule(j);
    end if;
  end loop;
end $$;

-- Zondagnacht 20:00 UTC = maandagochtend 06:00 in Sydney. Galeries zetten hun
-- nieuwe programma in het weekend online; chain=1 laat de run zichzelf
-- doorgeven tot het hele register is langsgelopen.
select cron.schedule('arteye-discover-exhibitions', '0 20 * * 0',
  $$select call_pipeline_function('discover-exhibitions', '?chain=1&limit=25')$$);

-- Een uur later: publiceer wat letterlijk van de site van de galerie kwam
-- (schema.org, confidence 0.9) en ruim afgelopen voorstellen op. Wat de AI
-- heeft geïnterpreteerd blijft in de inbox op jou wachten.
select cron.schedule('arteye-autopilot', '0 21 * * 0', $$
  select expire_exhibition_proposals();
  select auto_approve_exhibition_proposals(0.9);
$$);

-- Maandag 09:00 UTC: mailtje met wat er nog op goedkeuring wacht. Stuurt niets
-- als de wachtrij leeg is.
select cron.schedule('arteye-digest', '0 9 * * 1',
  $$select call_pipeline_function('queue-digest')$$);

-- Het venue-register zelf: wekelijks controleren, maandelijks nieuwe venues
-- zoeken, en dinsdag de persfoto's ophalen.
select cron.schedule('validate-venues-weekly', '0 2 * * 1',
  $$select call_pipeline_function('validate-venues')$$);
select cron.schedule('discover-venues-monthly', '0 3 1 * *',
  $$select call_pipeline_function('discover-venues')$$);
select cron.schedule('art-eye-enrich-images', '30 2 * * 2',
  $$select call_pipeline_function('enrich-images')$$);

-- ============================================================================
--  CONTROLEREN
-- ============================================================================
-- Staat de planning erin?
--   select jobname, schedule, active from cron.job order by jobname;
--
-- Heeft hij gedraaid, en ging het goed?
--   select j.jobname, d.status, d.return_message, d.start_time
--   from cron.job_run_details d join cron.job j on j.jobid = d.jobid
--   order by d.start_time desc limit 20;
--
-- Wat heeft de motor opgeleverd?
--   select * from pipeline_health order by last_run desc nulls last;
--
-- Wat wacht er op jou?
--   select v.name, q.title, q.start_date, q.end_date, q.confidence, q.source_url
--   from exhibition_review_queue q join venues v on v.id = q.venue_id
--   where q.status = 'pending' order by q.confidence desc, q.created_at;
--
-- Nu meteen draaien in plaats van wachten tot zondag:
--   select call_pipeline_function('discover-exhibitions', '?chain=1&limit=25');
