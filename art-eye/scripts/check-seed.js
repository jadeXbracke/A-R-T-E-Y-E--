#!/usr/bin/env node
/**
 * Guards the venue register in src/lib/seed.ts.
 *
 * Errors are things that silently break the live site — a duplicate slug, an
 * exhibition hanging off a venue that will never exist, a venue the SQL cannot
 * address. Warnings are gaps in the data that only a human can fill.
 *
 *   node scripts/check-seed.js            report errors and warnings
 *   node scripts/check-seed.js --strict   also fail on warnings
 */
const fs = require('fs');
const path = require('path');

const SEED = path.join(__dirname, '../src/lib/seed.ts');
const strict = process.argv.includes('--strict');

const src = fs
  .readFileSync(SEED, 'utf8')
  .replace(/^import[^;]*;\s*/m, '')
  .replace(/:\s*Venue\[\]/, '')
  .replace(/:\s*Exhibition\[\]/, '')
  .replace(/:\s*Record<[^>]*>/, '')
  .replace(/\bexport const\b/g, 'const');
const { SEED_VENUES: venues, SEED_EXHIBITIONS: shows } = new Function(
  'require',
  src + '\nreturn { SEED_VENUES, SEED_EXHIBITIONS };'
)(() => 0);

const errors = [];
const warnings = [];
const seen = (list, key) => {
  const counts = new Map();
  for (const item of list) counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  return [...counts].filter(([, c]) => c > 1).map(([v]) => v);
};

// --- errors ------------------------------------------------------------------
for (const dup of seen(venues, 'id')) errors.push(`duplicate venue id: ${dup}`);
for (const dup of seen(venues, 'slug')) errors.push(`duplicate venue slug: ${dup}`);
for (const dup of seen(shows, 'id')) errors.push(`duplicate exhibition id: ${dup}`);

for (const v of venues) {
  // Every SQL statement addresses a venue by slug. No slug, no row.
  if (!v.slug) errors.push(`${v.name}: no slug — it can never reach the database`);
  if (!v.name) errors.push(`${v.id}: no name`);
  if (v.status && !['active', 'archived', 'pending'].includes(v.status)) {
    errors.push(`${v.name}: unknown status "${v.status}"`);
  }
  if (v.status && v.status !== 'active' && !v.archived_reason) {
    errors.push(`${v.name}: status "${v.status}" without an archived_reason`);
  }
}

const byId = new Map(venues.map((v) => [v.id, v]));
for (const e of shows) {
  const v = byId.get(e.venue_id);
  if (!v) {
    errors.push(`exhibition "${e.title}": unknown venue ${e.venue_id}`);
  } else if ((v.status ?? 'active') !== 'active') {
    warnings.push(`exhibition "${e.title}" hangs off ${v.status} venue ${v.name} — it will not be published`);
  }
  if (e.end_date < e.start_date) errors.push(`exhibition "${e.title}": ends before it starts`);
}

// --- warnings ----------------------------------------------------------------
const published = venues.filter((v) => (v.status ?? 'active') === 'active');
const noAddress = published.filter((v) => !v.address);
const noCoords = published.filter((v) => v.latitude == null || v.longitude == null);
const noLink = published.filter((v) => !v.website && !v.instagram);
if (noAddress.length) warnings.push(`${noAddress.length} published venues have no street address: ${noAddress.map((v) => v.name).join(', ')}`);
if (noCoords.length) warnings.push(`${noCoords.length} published venues have no coordinates: ${noCoords.map((v) => v.name).join(', ')}`);
if (noLink.length) warnings.push(`${noLink.length} published venues have neither a website nor an Instagram: ${noLink.map((v) => v.name).join(', ')}`);

// --- freshness ---------------------------------------------------------------
// The register aged for weeks without anyone noticing, because a show that ends
// simply stops being displayed — no error, no empty screen, just a quieter app.
// This is the warning that was missing.
const today = new Date().toISOString().slice(0, 10);
const plus = (days) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const publishable = shows.filter((e) => {
  const v = byId.get(e.venue_id);
  return v && (v.status ?? 'active') === 'active';
});
const running = publishable.filter((e) => !e.end_date || e.end_date >= today);
const closingSoon = running.filter((e) => e.end_date && e.end_date < plus(30));
console.log(`programme: ${running.length} shows running on ${today}, ${closingSoon.length} of them close within 30 days`);
if (running.length < 25) {
  warnings.push(`only ${running.length} shows are still running — the programme is thinning out; check that the discovery pipeline is actually running (select * from pipeline_health)`);
}
if (running.length && closingSoon.length / running.length > 0.5) {
  warnings.push(`${closingSoon.length} of ${running.length} running shows close within 30 days — the programme needs restocking soon`);
}

// --- report ------------------------------------------------------------------
const archived = venues.length - published.length;
console.log(`venues: ${venues.length} (${published.length} published, ${archived} archived/pending)`);
console.log(`exhibitions: ${shows.length}`);
for (const w of warnings) console.log(`  warning: ${w}`);
for (const e of errors) console.error(`  ERROR: ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s) in src/lib/seed.ts`);
  process.exit(1);
}
if (strict && warnings.length) {
  console.error(`\n${warnings.length} warning(s), and --strict was set`);
  process.exit(1);
}
console.log('seed register is consistent');
