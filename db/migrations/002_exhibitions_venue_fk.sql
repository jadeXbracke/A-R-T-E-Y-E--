-- ============================================================================
-- 002_exhibitions_venue_fk.sql
-- V2 — link exhibitions to venues via venue_id
--
-- Handles both situations:
--   a) `exhibitions` does not exist yet  -> created fresh with venue_id
--   b) `exhibitions` exists (V1 data)    -> venue_id added, then backfilled
--      from a legacy free-text venue column (venue_name / venue / gallery /
--      location / venue_text — the first one found is used).
--
-- Legacy venue names that don't exist in `venues` yet are inserted as
-- unclaimed venues, so no exhibition loses its venue during migration.
-- The legacy text column is kept; drop it manually once you've verified
-- the backfill (see the bottom of this file).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.exhibitions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  start_date  date,
  end_date    date,
  venue_id    uuid,
  is_fixture  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS venue_id   uuid;
ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS is_fixture boolean NOT NULL DEFAULT false;
-- Legacy V1 tables may lack these V2 columns; the updated_at trigger and the
-- exhibitions_public view (migration 003) rely on them existing.
ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS start_date  date;
ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS end_date    date;
ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.exhibitions ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exhibitions_venue_id_fkey') THEN
    ALTER TABLE public.exhibitions
      ADD CONSTRAINT exhibitions_venue_id_fkey
      FOREIGN KEY (venue_id) REFERENCES public.venues (id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS exhibitions_venue_id_idx   ON public.exhibitions (venue_id);
CREATE INDEX IF NOT EXISTS exhibitions_is_fixture_idx ON public.exhibitions (is_fixture);

DROP TRIGGER IF EXISTS exhibitions_set_updated_at ON public.exhibitions;
CREATE TRIGGER exhibitions_set_updated_at
  BEFORE UPDATE ON public.exhibitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Backfill venue_id from a legacy free-text venue column, if one exists.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  candidates text[] := ARRAY['venue_name', 'venue', 'gallery', 'location', 'venue_text'];
  legacy_col text;
BEGIN
  SELECT c.column_name INTO legacy_col
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name   = 'exhibitions'
    AND c.column_name  = ANY (candidates)
  ORDER BY array_position(candidates, c.column_name::text)
  LIMIT 1;

  IF legacy_col IS NULL THEN
    RAISE NOTICE 'No legacy venue column found on exhibitions — nothing to backfill.';
    RETURN;
  END IF;

  RAISE NOTICE 'Backfilling exhibitions.venue_id from legacy column "%"', legacy_col;

  -- 1. Create venues for legacy names that don't exist yet (matched on slug,
  --    so "White Rabbit Gallery" and "white rabbit gallery" collapse to one).
  EXECUTE format($f$
    INSERT INTO public.venues (name, slug, is_claimed, is_fixture)
    SELECT DISTINCT ON (btrim(regexp_replace(lower(trim(e.%1$I)), '[^a-z0-9]+', '-', 'g'), '-'))
           trim(e.%1$I),
           btrim(regexp_replace(lower(trim(e.%1$I)), '[^a-z0-9]+', '-', 'g'), '-'),
           false,
           false
    FROM public.exhibitions e
    WHERE e.%1$I IS NOT NULL
      AND btrim(regexp_replace(lower(trim(e.%1$I)), '[^a-z0-9]+', '-', 'g'), '-') <> ''
    ON CONFLICT (slug) DO NOTHING
  $f$, legacy_col);

  -- 2. Point every exhibition at its venue (matched on the same slug).
  EXECUTE format($f$
    UPDATE public.exhibitions e
    SET venue_id = v.id
    FROM public.venues v
    WHERE e.venue_id IS NULL
      AND e.%1$I IS NOT NULL
      AND v.slug = btrim(regexp_replace(lower(trim(e.%1$I)), '[^a-z0-9]+', '-', 'g'), '-')
  $f$, legacy_col);
END $$;

COMMIT;

-- After verifying the backfill, drop the legacy column manually, e.g.:
--   ALTER TABLE public.exhibitions DROP COLUMN venue_name;
