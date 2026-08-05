-- ART EYE — upgrade: persfoto's meenemen uit de bronpagina.
-- Plak dit EEN keer in de SQL Editor en druk Run.
--
-- De motor leest voortaan de officiele persfoto van de expo-pagina mee
-- (het beeld dat de venue zelf gebruikt bij delen). Deze upgrade geeft de
-- wachtrij een plek voor die foto en zorgt dat goedkeuren hem meepubliceert.

alter table exhibition_review_queue
  add column if not exists image_url text;

create or replace function approve_exhibition_proposal(qid uuid)
returns uuid language plpgsql security definer as $$
declare q exhibition_review_queue;
        new_id uuid;
begin
  if not is_admin() then raise exception 'not authorised'; end if;
  select * into q from exhibition_review_queue where id = qid and status = 'pending';
  if not found then raise exception 'proposal not found or already handled'; end if;

  insert into exhibitions (venue_id, title, artists, start_date, end_date, description,
                           image_url, image_source, status, is_featured, city)
  values (q.venue_id, q.title, q.artists, q.start_date, q.end_date,
          q.description, q.image_url, q.source_url, 'approved', false, 'Sydney')
  returning id into new_id;

  update exhibition_review_queue set status = 'approved', reviewed_at = now() where id = qid;
  return new_id;
end $$;

select count(*) as shows_totaal from exhibitions;
