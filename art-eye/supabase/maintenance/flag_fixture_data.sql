-- ============================================================================
--  ART EYE — flag fixture / test data
-- ============================================================================
--  Test rows you created while trying the app (e.g. "lalala") live in your
--  database, not in any seed file. This script MARKS them as fixtures so they
--  vanish from the public directory and agenda — without deleting anything.
--  (Nothing real is touched: "Cassandra Bird" and the 13 July-2026 shows stay.)
--
--  Safe to run repeatedly. Edit the two lists below, then run the whole file.
-- ============================================================================

-- 1) Venues to hide — list them by name (case-insensitive).
update venues
set is_fixture = true
where lower(name) in (
  'lalala'
  -- , 'test gallery'
  -- , 'my test venue'
);

-- 2) Exhibitions to hide — list them by title (case-insensitive).
update exhibitions
set is_fixture = true
where lower(title) in (
  'lalala'
  -- , 'test show'
);

-- 3) Any exhibition sitting at a hidden venue is hidden too.
update exhibitions e
set is_fixture = true
from venues v
where e.venue_id = v.id
  and v.is_fixture = true
  and e.is_fixture = false;

-- ---------------------------------------------------------------------------
-- To bring something back into the public feed, clear its flag, e.g.:
--   update venues       set is_fixture = false where lower(name)  = 'somewhere';
--   update exhibitions  set is_fixture = false where lower(title) = 'some show';
--
-- To review what is currently hidden:
--   select name  from venues       where is_fixture;
--   select title from exhibitions  where is_fixture;
-- ============================================================================
