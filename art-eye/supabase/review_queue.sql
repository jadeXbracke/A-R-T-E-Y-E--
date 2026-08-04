-- ART EYE — de wachtrij bekijken en goedkeuren, vanuit de SQL Editor.
-- Plak het blok dat je nodig hebt en druk op Run.

-- ============================================================
-- 1. WAT HEEFT DE MOTOR GEVONDEN?  (begin hier)
-- ============================================================
select v.name as venue,
       q.title,
       q.artists,
       q.start_date,
       q.end_date,
       round(q.confidence * 100) as zekerheid_pct,
       q.source_url as bron,
       q.id
from exhibition_review_queue q
join venues v on v.id = q.venue_id
where q.status = 'pending'
order by v.name, q.title;


-- ============================================================
-- 2. HOEVEEL STAAN ER KLAAR?
-- ============================================================
-- select status, count(*) from exhibition_review_queue group by status;


-- ============================================================
-- 3. EEN ENKELE GOEDKEUREN
-- ============================================================
-- Kopieer een id uit query 1 en zet het hieronder:
-- select approve_exhibition_proposal('PLAK-HIER-HET-ID');


-- ============================================================
-- 4. ALLES GOEDKEUREN WAAR DE MOTOR ZEKER OVER IS
-- ============================================================
-- confidence 0.9 = rechtstreeks uit de officiele data van de venue
-- (0.65 = door Gemini gelezen; die kijk je liever eerst zelf na).
-- insert into exhibitions
--   (venue_id, title, artists, start_date, end_date, description,
--    image_source, status, is_featured, city)
-- select q.venue_id, q.title, q.artists,
--        coalesce(q.start_date, current_date),
--        coalesce(q.end_date, current_date),
--        q.description, q.source_url, 'approved', false, 'Sydney'
-- from exhibition_review_queue q
-- where q.status = 'pending' and q.confidence >= 0.9;
--
-- update exhibition_review_queue
--    set status = 'approved', reviewed_at = now()
--  where status = 'pending' and confidence >= 0.9;


-- ============================================================
-- 5. EEN VOORSTEL AFWIJZEN
-- ============================================================
-- update exhibition_review_queue
--    set status = 'rejected', reviewed_at = now()
--  where id = 'PLAK-HIER-HET-ID';


-- ============================================================
-- 6. WAT STAAT ER NU ECHT IN DE APP?
-- ============================================================
-- select v.name as venue, e.title, e.start_date, e.end_date
-- from exhibitions e join venues v on v.id = e.venue_id
-- order by e.start_date desc limit 100;
