-- ============================================================================
-- 003_fixture_flagging_and_public_views.sql
-- V2 — quarantine fixture/test data + public views for the feed
--
-- 1. Flags known fixture/test venues (e.g. "lalala", "Cassandra Bird") with
--    is_fixture = true, and cascades that flag to their exhibitions.
-- 2. Creates `venues_public` and `exhibitions_public` views that exclude ALL
--    fixture data. Point the public feed at these views (or always filter on
--    is_fixture = false) so test data can never leak into production output.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Flag fixture venues.
--    >>> ADD MORE TEST/FIXTURE NAME PATTERNS HERE (ILIKE patterns) <<<
-- ---------------------------------------------------------------------------
WITH fixture_patterns (pattern) AS (
  VALUES
    ('%lalala%'),
    ('cassandra bird')
    -- , ('my other test venue')
)
UPDATE public.venues v
SET is_fixture = true
WHERE EXISTS (
  SELECT 1 FROM fixture_patterns p
  WHERE v.name ILIKE p.pattern OR v.slug ILIKE p.pattern
);

-- Exhibitions whose own title is clearly test data.
WITH fixture_patterns (pattern) AS (
  VALUES
    ('%lalala%'),
    ('cassandra bird')
)
UPDATE public.exhibitions e
SET is_fixture = true
WHERE EXISTS (
  SELECT 1 FROM fixture_patterns p
  WHERE e.title ILIKE p.pattern
);

-- Cascade: every exhibition at a fixture venue is itself fixture data.
UPDATE public.exhibitions e
SET is_fixture = true
FROM public.venues v
WHERE e.venue_id = v.id
  AND v.is_fixture
  AND NOT e.is_fixture;

-- ---------------------------------------------------------------------------
-- 2. Public views — the ONLY thing the public feed should query.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.venues_public AS
SELECT id, name, slug, address, suburb, type, website, instagram,
       lat, lng, is_claimed, created_at, updated_at
FROM public.venues
WHERE NOT is_fixture;

CREATE OR REPLACE VIEW public.exhibitions_public AS
SELECT e.id, e.title, e.description, e.start_date, e.end_date,
       e.venue_id, e.created_at, e.updated_at,
       v.name  AS venue_name,
       v.slug  AS venue_slug,
       v.suburb AS venue_suburb,
       v.type  AS venue_type
FROM public.exhibitions e
LEFT JOIN public.venues v ON v.id = e.venue_id
WHERE NOT e.is_fixture
  AND (v.id IS NULL OR NOT v.is_fixture);

COMMIT;

-- ---------------------------------------------------------------------------
-- Optional: HARD DELETE all fixture data instead of just hiding it.
-- Only run this once you're sure nothing real got flagged
-- (check first: SELECT name FROM venues WHERE is_fixture;)
-- ---------------------------------------------------------------------------
-- BEGIN;
-- DELETE FROM public.exhibitions WHERE is_fixture;
-- DELETE FROM public.venues WHERE is_fixture;
-- COMMIT;
