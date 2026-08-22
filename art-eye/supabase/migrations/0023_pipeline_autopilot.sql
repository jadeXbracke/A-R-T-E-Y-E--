-- 0023 — let the engine finish its own work.
--
-- The discovery pipeline files proposals and stops there: every show needs a
-- human tap before it goes live. That is the right default for anything the AI
-- fallback interpreted, but it also means the register ages the moment nobody
-- is reviewing. Two helpers close the loop:
--
--   auto_approve_exhibition_proposals()  publishes only what was copied
--                                        verbatim from a venue's own
--                                        schema.org data (confidence >= 0.9).
--   expire_exhibition_proposals()        clears out proposals for shows that
--                                        have already finished.
--
-- Anything the Gemini fallback interpreted (confidence 0.65) still waits for
-- you in the Owner Inbox. "Propose, never apply" holds where it matters.

alter type run_type add value if not exists 'auto_approve';

-- ---------------------------------------------------------------- approve
create or replace function auto_approve_exhibition_proposals(min_confidence numeric default 0.9)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  q          exhibition_review_queue;
  approved   int := 0;
  run        uuid;
begin
  insert into validation_runs (run_type, venues_checked) values ('auto_approve', 0)
    returning id into run;

  for q in
    select eq.* from exhibition_review_queue eq
    join venues v on v.id = eq.venue_id
    where eq.status = 'pending'
      and eq.confidence >= min_confidence
      -- never publish at a venue the register does not publish
      and v.status = 'active' and v.is_fixture = false
      -- a show needs real, sane, still-running dates
      and eq.start_date is not null and eq.end_date is not null
      and eq.end_date >= eq.start_date
      and eq.end_date >= current_date
      -- and must not already be on the wall
      and not exists (
        select 1 from exhibitions e
        where e.venue_id = eq.venue_id and lower(e.title) = lower(eq.title)
      )
    order by eq.created_at
  loop
    insert into exhibitions (venue_id, title, artists, start_date, end_date,
                             description, image_source, status, is_featured, city)
    values (q.venue_id, q.title, q.artists, q.start_date, q.end_date,
            q.description, q.source_url, 'approved', false, 'Sydney');
    update exhibition_review_queue
      set status = 'approved', reviewed_at = now() where id = q.id;
    approved := approved + 1;
  end loop;

  update validation_runs
    set finished_at = now(), proposals_created = approved where id = run;
  return approved;
end $$;

-- ----------------------------------------------------------------- expire
-- Proposals for shows that have already closed are noise in the inbox.
create or replace function expire_exhibition_proposals()
returns integer
language plpgsql security definer set search_path = public as $$
declare expired int;
begin
  update exhibition_review_queue
    set status = 'rejected', reviewed_at = now()
    where status = 'pending' and end_date is not null and end_date < current_date;
  get diagnostics expired = row_count;
  return expired;
end $$;

-- Both run as the scheduler or the service role, never from a browser.
revoke all on function auto_approve_exhibition_proposals(numeric) from public, anon, authenticated;
revoke all on function expire_exhibition_proposals() from public, anon, authenticated;
grant execute on function auto_approve_exhibition_proposals(numeric) to service_role;
grant execute on function expire_exhibition_proposals() to service_role;

-- ----------------------------------------------------------------- health
-- One row per job: when it last ran and what it did. A job that stops working
-- shows up here as a stale last_run instead of as silence.
create or replace view pipeline_health as
  select
    r.run_type::text                              as job,
    max(r.started_at)                             as last_run,
    (now() - max(r.started_at))                   as ago,
    sum(r.proposals_created)                      as proposals_total
  from validation_runs r
  group by r.run_type;

alter view pipeline_health set (security_invoker = on);
