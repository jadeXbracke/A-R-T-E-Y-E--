-- ============================================================================
-- 001_create_venues.sql
-- V2 — Sydney venue register
--
-- Creates the canonical `venues` table. Safe to run on a database where the
-- table does not exist yet; existing tables get missing columns added.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

CREATE TABLE IF NOT EXISTS public.venues (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL,
  address     text,
  suburb      text,
  type        text,
  website     text,
  instagram   text,             -- handle without the leading @
  lat         double precision,
  lng         double precision,
  is_claimed  boolean NOT NULL DEFAULT false,  -- venue owner has claimed this profile
  is_fixture  boolean NOT NULL DEFAULT false,  -- test/fixture data: never shown publicly
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- If a venues table already existed (e.g. from V1), make sure every V2 column
-- is present. ADD COLUMN IF NOT EXISTS is a no-op on a fresh table.
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS slug        text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS address     text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS suburb      text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS type        text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS website     text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS instagram   text;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS lat         double precision;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS lng         double precision;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS is_claimed  boolean NOT NULL DEFAULT false;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS is_fixture  boolean NOT NULL DEFAULT false;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

-- Backfill slugs for any legacy rows that don't have one yet.
UPDATE public.venues
SET slug = btrim(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), '-')
WHERE slug IS NULL OR slug = '';

ALTER TABLE public.venues ALTER COLUMN slug SET NOT NULL;

-- Constraints (wrapped so re-running the migration never errors).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'venues_slug_key') THEN
    ALTER TABLE public.venues ADD CONSTRAINT venues_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'venues_type_check') THEN
    ALTER TABLE public.venues
      ADD CONSTRAINT venues_type_check CHECK (type IN ('gallery', 'museum', 'ari'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS venues_suburb_idx     ON public.venues (suburb);
CREATE INDEX IF NOT EXISTS venues_type_idx       ON public.venues (type);
CREATE INDEX IF NOT EXISTS venues_is_fixture_idx ON public.venues (is_fixture);

-- Keep updated_at fresh on every UPDATE.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS venues_set_updated_at ON public.venues;
CREATE TRIGGER venues_set_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
