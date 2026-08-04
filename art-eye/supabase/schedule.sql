-- ART EYE — de motor automatisch laten draaien.
-- Plak dit EEN keer in de SQL Editor en druk op Run. Daarna gaat het vanzelf:
-- elke maandagochtend loopt de motor alle venues langs en zet nieuwe expo's
-- in de wachtrij. Al bekende expo's worden overgeslagen, dus geen dubbelen.
--
-- Vervang tbdhglobmjnxllvhqsao door je eigen project ref als dat anders is.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Oude versie weghalen (veilig als hij nog niet bestaat).
select cron.unschedule('arteye-discover-weekly')
where exists (select 1 from cron.job where jobname = 'arteye-discover-weekly');

-- Elke maandag om 06:00 UTC (= dinsdag ~17:00 in Sydney, na het weekend
-- waarin galeries hun nieuwe programma online zetten).
select cron.schedule(
  'arteye-discover-weekly',
  '0 6 * * 1',
  $$
    select net.http_get(
      'https://tbdhglobmjnxllvhqsao.supabase.co/functions/v1/Discover-exhibitions?chain=1'
    );
  $$
);


-- ============================================================
-- CONTROLEREN
-- ============================================================
-- Staat de planning erin?
--   select jobname, schedule, active from cron.job;
--
-- Wanneer draaide hij, en ging het goed?
--   select job_pid, status, return_message, start_time
--   from cron.job_run_details
--   where jobname = 'arteye-discover-weekly'
--   order by start_time desc limit 10;


-- ============================================================
-- AANPASSEN
-- ============================================================
-- Vaker draaien? Vervang de tijd hierboven:
--   '0 6 * * 1'   = elke maandag 06:00 UTC   (aanrader)
--   '0 6 * * *'   = elke dag 06:00 UTC
--   '0 6 1 * *'   = de 1e van elke maand
--
-- Helemaal uitzetten:
--   select cron.unschedule('arteye-discover-weekly');
