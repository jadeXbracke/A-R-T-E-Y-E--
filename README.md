# D-I-S-APP-

## V2 — Sydney Venue Register

De database-migraties en seed-data voor het venue-register van Sydney staan in
[`db/`](db/README.md):

- `db/migrations/` — venues-tabel, `venue_id` foreign key op exposities
  (met automatische backfill vanuit V1-data) en het markeren van
  fixture-/testdata zodat die nooit in de publieke feed komt.
- `db/seed/venues_seed.sql` — ~55 echte Sydney-venues (musea, galeries,
  ARI's), met een duidelijk gemarkeerde plek om zelf venues toe te voegen.

Zie [`db/README.md`](db/README.md) voor uitvoerinstructies (psql of Supabase).
