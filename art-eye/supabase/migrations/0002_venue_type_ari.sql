-- Add "ari" (artist-run initiative) to the venue_type enum.
-- Kept in its own migration: Postgres forbids using a freshly added enum
-- value in the same transaction that adds it, so nothing else lives here.
alter type venue_type add value if not exists 'ari';
