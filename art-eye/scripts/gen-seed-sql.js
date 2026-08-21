#!/usr/bin/env node
/**
 * Generates every SQL seed file from src/lib/seed.ts.
 *
 * src/lib/seed.ts is the single source of truth for the venue register and the
 * verified exhibitions. The files under supabase/ used to be maintained by hand
 * alongside it, which is how the two drifted apart: five venues lived only in
 * seed.ts and never reached the live database, taking six exhibitions with them.
 *
 *   node scripts/gen-seed-sql.js          rewrite the SQL files
 *   node scripts/gen-seed-sql.js --check  fail if they are out of date (CI)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SEED = path.join(ROOT, 'src/lib/seed.ts');
const SUPA = path.join(ROOT, 'supabase');
const MIGRATIONS = path.join(SUPA, 'migrations');
const check = process.argv.includes('--check');

// --- read the TypeScript seed as data ---------------------------------------
// seed.ts is plain data: object literals, no logic. Stripping the import and the
// three type annotations leaves valid JavaScript.
function readSeed() {
  const src = fs
    .readFileSync(SEED, 'utf8')
    .replace(/^import[^;]*;\s*/m, '')
    .replace(/:\s*Venue\[\]/, '')
    .replace(/:\s*Exhibition\[\]/, '')
    .replace(/:\s*Record<[^>]*>/, '')
    .replace(/\bexport const\b/g, 'const');
  const load = new Function(
    'require',
    src + '\nreturn { SEED_VENUES, SEED_EXHIBITIONS };'
  );
  return load(() => 0); // bundled image assets are irrelevant to SQL
}

// --- SQL literals ------------------------------------------------------------
const s = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v == null ? 'null' : String(v));
const b = (v) => (v == null ? 'null' : v ? 'true' : 'false');

const VENUE_COLUMNS = [
  'slug', 'name', 'type', 'category', 'tier', 'editorial_note', 'address',
  'suburb', 'website', 'instagram', 'latitude', 'longitude', 'city',
  'founded_year', 'free_entry', 'entry_checked', 'opening_hours',
  'hours_checked', 'status',
];

function venueRow(v) {
  if (!v.slug) throw new Error(`venue without slug: ${v.name}`);
  return (
    '  (' +
    [
      s(v.slug), s(v.name), s(v.type), s(v.category ?? null), s(v.tier ?? null),
      s(v.editorial_note ?? null), s(v.address), s(v.suburb ?? null),
      s(v.website ?? null), s(v.instagram ?? null), n(v.latitude ?? null),
      n(v.longitude ?? null), s(v.city), n(v.founded_year ?? null),
      b(v.free_entry ?? null), s(v.entry_checked ?? null),
      s(v.opening_hours ?? null), s(v.hours_checked ?? null),
      s(v.status ?? 'active'),
    ].join(', ') +
    ')'
  );
}

const GENERATED = '--  GENERATED FILE — do not edit by hand.\n' +
  '--  Source: art-eye/src/lib/seed.ts. Regenerate with `npm run seed:sql`.\n';

function venueBody(venues) {
  const active = venues.filter((v) => (v.status ?? 'active') === 'active').length;
  const photos = venues.filter((v) => v.image_url);
  return `-- ============================================================================
--  ART EYE — SYDNEY VENUE REGISTER  (seed / upsert)
-- ============================================================================
${GENERATED}--
--  ${venues.length} venues, ${active} of them published. Rows are matched on \`slug\`, so
--  running this again updates the register instead of creating duplicates.
--
--  Run AFTER the migrations in ./migrations (needs the register columns).
--
--  Venues that have closed or left their space keep their row with
--  status = 'archived' (or 'pending' where a closure is unconfirmed): the app
--  and the live view publish only status = 'active', and keeping the row stops
--  the discovery pipeline from proposing the venue all over again.
-- ============================================================================

insert into venues (${VENUE_COLUMNS.join(', ')}) values
${venues.map(venueRow).join(',\n')}
on conflict (slug) do update set
  name           = excluded.name,
  type           = excluded.type,
  category       = excluded.category,
  tier           = excluded.tier,
  editorial_note = excluded.editorial_note,
  address        = coalesce(excluded.address, venues.address),
  suburb         = excluded.suburb,
  website        = coalesce(excluded.website, venues.website),
  instagram      = coalesce(excluded.instagram, venues.instagram),
  latitude       = coalesce(excluded.latitude, venues.latitude),
  longitude      = coalesce(excluded.longitude, venues.longitude),
  city           = excluded.city,
  founded_year   = coalesce(excluded.founded_year, venues.founded_year),
  free_entry     = coalesce(excluded.free_entry, venues.free_entry),
  entry_checked  = coalesce(excluded.entry_checked, venues.entry_checked),
  opening_hours  = coalesce(excluded.opening_hours, venues.opening_hours),
  hours_checked  = coalesce(excluded.hours_checked, venues.hours_checked),
  status         = excluded.status;

-- Closed before this register existed — archived, never deleted.
update venues set status = 'archived', verification_source = 'owner register v2'
  where slug in ('may-space', 'liverpool-street-gallery');

-- ---------------------------------------------------------------------------
-- Venue photography — freely licensed (Wikimedia Commons). Only set where the
-- venue has no photo yet, so a venue-uploaded photo is never overwritten.
-- ---------------------------------------------------------------------------
update venues set image_url = x.url
from (values
${photos.map((v) => `  (${s(v.slug)}, ${s(v.image_url)})`).join(',\n')}
) as x(slug, url)
where venues.slug = x.slug and venues.image_url is null;

-- Controle: hoeveel venues staan er nu live?
select count(*) as venues_live from venues where status = 'active';
`;
}

function exhibitionBody(venues, exhibitions) {
  const slugOf = new Map(venues.map((v) => [v.id, v.slug]));
  const published = new Set(
    venues.filter((v) => (v.status ?? 'active') === 'active').map((v) => v.id)
  );
  const rows = exhibitions.filter((e) => published.has(e.venue_id));
  const skipped = exhibitions.length - rows.length;
  return `-- ART EYE — zet de geverifieerde tentoonstellingen in de LIVE database.
${GENERATED}--
--  ${rows.length} shows${skipped ? ` (${skipped} overgeslagen: hun venue is gearchiveerd)` : ''}.
--  Plak dit een keer in de SQL Editor en druk Run. Veilig om te herhalen: shows
--  die er al staan (zelfde venue + titel) worden overgeslagen, en de wachtrij
--  van de motor blijft onaangeroerd.

with seed (slug, title, artists, start_date, end_date, description, image_url, is_featured) as (
  values
${rows
  .map((e) => {
    const slug = slugOf.get(e.venue_id);
    if (!slug) throw new Error(`exhibition "${e.title}" points at unknown venue ${e.venue_id}`);
    const img = e.image_url && e.image_url.startsWith('asset:') ? null : e.image_url;
    return `  (${s(slug)}, ${s(e.title)}, ${s(e.artists)}, ${s(e.start_date)}, ${s(e.end_date)}, ${s(e.description)}, ${s(img)}, ${b(e.is_featured)})`;
  })
  .join(',\n')}
)
insert into exhibitions (venue_id, title, artists, start_date, end_date, description, image_url, status, is_featured, city)
select v.id, s.title, s.artists, s.start_date::date, s.end_date::date, s.description, s.image_url, 'approved', s.is_featured, 'Sydney'
from seed s
join venues v on v.slug = s.slug
where not exists (
  select 1 from exhibitions e
  where e.venue_id = v.id and lower(e.title) = lower(s.title)
);

-- Controle: hoeveel staan er nu live?
select count(*) as exhibitions_live from exhibitions;
`;
}

// setup_1_schema.sql is every migration in order, except the optional
// auto-scheduler, each under its own banner.
function schemaBody() {
  const files = fs
    .readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql') && !f.startsWith('0006_'))
    .sort();
  const parts = files.map(
    (f) =>
      '-- ============================================================\n' +
      `-- migrations/${f}\n` +
      '-- ============================================================\n' +
      fs.readFileSync(path.join(MIGRATIONS, f), 'utf8').replace(/\s*$/, '')
  );
  return (
    '-- ART EYE — SETUP STEP 1 of 2: DATABASE SCHEMA.\n' +
    '-- Paste this ENTIRE file into the Supabase SQL Editor and press Run.\n' +
    '-- Then run setup_2_venues.sql. Safe to run repeatedly on the same project\n' +
    '-- (every statement is written to skip work that\'s already been done).\n' +
    '-- (Contains every migration except the optional auto-scheduler 0006.)\n\n' +
    parts.join('\n\n') +
    '\n'
  );
}

function main() {
  const { SEED_VENUES, SEED_EXHIBITIONS } = readSeed();

  const venues = venueBody(SEED_VENUES);
  const setup2 =
    '-- ART EYE — SETUP STEP 2 of 2: DE SYDNEY VENUES.\n' +
    '-- Run setup_1_schema.sql FIRST, then paste this file and press Run.\n' +
    '-- Safe to run repeatedly (venues are matched on slug).\n\n' +
    venues;
  const exhibitions = exhibitionBody(SEED_VENUES, SEED_EXHIBITIONS);
  const schema = schemaBody();
  const activeVenues = SEED_VENUES.filter((v) => (v.status ?? 'active') === 'active').length;
  const liveShows = SEED_EXHIBITIONS.filter((e) => {
    const v = SEED_VENUES.find((x) => x.id === e.venue_id);
    return v && (v.status ?? 'active') === 'active';
  }).length;
  const all =
    '-- ART EYE — COMPLETE DATABASE SETUP IN ONE FILE.\n' +
    '-- Paste this ENTIRE file into the Supabase SQL Editor and press Run once.\n' +
    '-- Safe to run more than once on the same project — every statement skips\n' +
    '-- work that\'s already been done, so re-running after a partial failure\n' +
    '-- (or just to double-check) is fine.\n' +
    `-- Contains: the full schema (every migration), ${activeVenues} published Sydney venues,\n` +
    `-- and the ${liveShows} verified exhibitions.\n` +
    '-- Afterwards: sign up in the app with jadebrack@gmail.com, then run\n' +
    '-- make_owner.sql to promote that one account to admin.\n\n' +
    schema +
    '\n' +
    setup2 +
    '\n' +
    exhibitions;

  const files = {
    'setup_1_schema.sql': schema,
    'venues_seed.sql': venues,
    'setup_2_venues.sql': setup2,
    'exhibitions_seed.sql': exhibitions,
    'setup_all.sql': all,
  };

  let stale = 0;
  for (const [name, body] of Object.entries(files)) {
    const target = path.join(SUPA, name);
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
    if (current === body) continue;
    stale++;
    if (check) {
      console.error(`out of date: supabase/${name}`);
    } else {
      fs.writeFileSync(target, body);
      console.log(`wrote supabase/${name}`);
    }
  }
  if (check && stale) {
    console.error('\nRun `npm run seed:sql` and commit the result.');
    process.exit(1);
  }
  if (check) console.log('SQL seeds are up to date with src/lib/seed.ts');
  if (!check && !stale) console.log('SQL seeds already up to date');
}

main();
