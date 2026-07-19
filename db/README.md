# V2 — Sydney Venue Register (database)

Alles wat nodig is voor het venue-register van Sydney: migraties, seed-data
en het opschonen van fixture-/testdata.

## Structuur

```
db/
├── migrations/
│   ├── 001_create_venues.sql                    # venues-tabel (of uitbreiding van bestaande)
│   ├── 002_exhibitions_venue_fk.sql             # exposities → venue_id foreign key + backfill
│   └── 003_fixture_flagging_and_public_views.sql # testdata markeren + publieke views
└── seed/
    └── venues_seed.sql                          # ~55 Sydney-venues, hier voeg je zelf toe
```

## Uitvoeren

**Volgorde: 001 → 002 → 003 → seed.** Alles is idempotent — opnieuw draaien kan altijd.

### Met psql

```bash
psql "$DATABASE_URL" -f db/migrations/001_create_venues.sql
psql "$DATABASE_URL" -f db/migrations/002_exhibitions_venue_fk.sql
psql "$DATABASE_URL" -f db/migrations/003_fixture_flagging_and_public_views.sql
psql "$DATABASE_URL" -f db/seed/venues_seed.sql
```

### Met Supabase

Plak de vier bestanden in dezelfde volgorde in de **SQL Editor** van je
Supabase-project, of kopieer ze naar `supabase/migrations/` (hernoem met
timestamp-prefix, bv. `20260719000001_create_venues.sql`) en draai
`supabase db push`.

## Het schema

### `venues`

| Kolom       | Type      | Betekenis                                             |
|-------------|-----------|-------------------------------------------------------|
| `id`        | uuid (PK) | –                                                     |
| `name`      | text      | Naam van de venue                                     |
| `slug`      | text      | Uniek, URL-vriendelijk (`white-rabbit-gallery`)       |
| `address`   | text      | Straat + nummer                                       |
| `suburb`    | text      | Bv. Paddington, Chippendale                           |
| `type`      | text      | `gallery`, `museum` of `ari`                          |
| `website`   | text      | Volledige URL                                         |
| `instagram` | text      | Handle **zonder** @                                   |
| `lat`/`lng` | float     | Coördinaten                                           |
| `is_claimed`| boolean   | `true` zodra de venue-eigenaar het profiel claimt (default `false`) |
| `is_fixture`| boolean   | `true` = testdata, komt **nooit** in de publieke feed |

### `exhibitions`

Krijgt `venue_id` (FK → `venues.id`, `ON DELETE SET NULL`) en `is_fixture`.
Migratie 002 backfillt `venue_id` automatisch vanuit een oude vrije-tekstkolom
(`venue_name`, `venue`, `gallery`, `location` of `venue_text` — de eerste die
bestaat). Namen die nog niet in `venues` staan worden als unclaimed venue
aangemaakt, zodat geen enkele expositie z'n venue kwijtraakt. De oude
tekstkolom blijft staan; drop die pas handmatig na controle.

## Zelf venues toevoegen

Open `db/seed/venues_seed.sql` en zoek het blok:

```
>>> VOEG HIER JE EIGEN VENUES TOE / ADD YOUR OWN VENUES HERE <<<
```

Eén regel per venue, mét komma erachter (de terminator-regel onderaan vangt de
laatste komma op). Draai het bestand daarna opnieuw — het upsert op `slug`,
dus bestaande venues worden bijgewerkt, nooit gedupliceerd. `is_claimed` en
`is_fixture` worden door de seed bewust **nooit** overschreven.

✅ De voorgevulde lijst (54 venues: musea, publieke galeries, commerciële
galeries en ARI's) is in juli 2026 geverifieerd tegen officiële bronnen
(websites en Instagram-accounts van de venues zelf): status, adres, website
en IG-handle zijn actueel. Gesloten of nomadische organisaties (o.a.
Australian Design Centre, Gallery 9, 107 Projects) staan gecomment onderaan
het seed-bestand als naslag. Coördinaten zijn straatniveau-nauwkeurig
(~100 m); geocodeer opnieuw als je pixel-perfecte kaartpins wilt.

## Fixture-/testdata

Migratie 003 markeert venues en exposities die matchen op bekende
testpatronen (o.a. `lalala`, `Cassandra Bird`) met `is_fixture = true`, en
zet die vlag ook op alle exposities van een fixture-venue. Extra patronen
voeg je toe in het duidelijk gemarkeerde blok bovenin migratie 003.

**De publieke feed mag alleen deze views gebruiken:**

- `venues_public` — alle venues zonder fixtures
- `exhibitions_public` — exposities zonder fixtures én zonder exposities bij
  fixture-venues (incl. venue-naam/slug/suburb/type via join)

Zo kan testdata nooit publiek lekken, ook niet als iemand vergeet te
filteren. Hard verwijderen kan met het gecommente `DELETE`-blok onderaan
migratie 003 — pas ná controle met
`SELECT name FROM venues WHERE is_fixture;`.

## Testdata voor development

Nieuwe testdata aanmaken? Zet altijd `is_fixture = true`:

```sql
INSERT INTO venues (name, slug, is_fixture) VALUES ('Test Venue', 'test-venue', true);
```
