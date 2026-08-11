-- ART EYE — upgrade: eerlijke datums voor gevonden expo's.
-- Plak dit EEN keer in de SQL Editor en druk Run.
--
-- Tot nu toe kreeg een goedgekeurde expo zonder datum stiekem "vandaag" als
-- datum. Na deze upgrade blijven onbekende datums gewoon leeg en toont de app
-- "DATES TBA" / "FROM ..." / "UNTIL ..." — niets wordt verzonnen.

alter table exhibitions alter column start_date drop not null;
alter table exhibitions alter column end_date drop not null;

create or replace function approve_exhibition_proposal(qid uuid)
returns uuid language plpgsql security definer as $$
declare q exhibition_review_queue;
        new_id uuid;
begin
  if not is_admin() then raise exception 'not authorised'; end if;
  select * into q from exhibition_review_queue where id = qid and status = 'pending';
  if not found then raise exception 'proposal not found or already handled'; end if;

  insert into exhibitions (venue_id, title, artists, start_date, end_date, description, image_source, status, is_featured, city)
  values (q.venue_id, q.title, q.artists, q.start_date, q.end_date,
          q.description, q.source_url, 'approved', false, 'Sydney')
  returning id into new_id;

  update exhibition_review_queue set status = 'approved', reviewed_at = now() where id = qid;
  return new_id;
end $$;

-- Eerder goedgekeurde expo's waarvan begin- en einddatum per ongeluk op de
-- goedkeurdag zijn gezet, weer eerlijk leeg maken:
update exhibitions e
   set start_date = q.start_date, end_date = q.end_date
  from exhibition_review_queue q
 where q.status = 'approved'
   and q.venue_id = e.venue_id
   and lower(q.title) = lower(e.title)
   and e.start_date = e.end_date
   and (q.start_date is distinct from e.start_date or q.end_date is distinct from e.end_date);

select count(*) as shows_totaal from exhibitions;
