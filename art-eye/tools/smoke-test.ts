/* Smoke test for the demo data layer and date logic.
 * Run: npx tsx --tsconfig tsconfig.test.json tools/smoke-test.ts
 */
import assert from 'node:assert';
import { formatOpening, formatRange, isClosingSoon, isOnNow } from '../src/lib/dates';
import { SEED_EXHIBITIONS, SEED_VENUES } from '../src/lib/seed';
import { LocalAdapter } from '../src/lib/data/local';

async function main() {
  // ---- seed integrity ----
  assert.equal(SEED_EXHIBITIONS.length, 13, 'thirteen seed exhibitions');
  assert.equal(SEED_VENUES.length, 8, 'eight venues');
  const venueIds = new Set(SEED_VENUES.map((v) => v.id));
  for (const e of SEED_EXHIBITIONS) {
    assert.ok(venueIds.has(e.venue_id), `venue exists for ${e.title}`);
    assert.ok(e.start_date <= e.end_date, `dates ordered for ${e.title}`);
    assert.equal(e.city, 'Sydney');
  }
  assert.deepEqual(
    SEED_EXHIBITIONS.filter((e) => e.is_featured).map((e) => e.id).sort(),
    ['e-archibald', 'e-murakami', 'e-primavera'],
    'Archibald, Murakami, Primavera featured'
  );

  // ---- date formatting ----
  assert.equal(formatRange('2026-06-06', '2026-08-16'), '6 JUN — 16 AUG');
  assert.equal(formatOpening('2026-07-22T18:00:00'), '22 JUL, 6 PM');
  assert.ok(isOnNow({ start_date: '2026-06-06', end_date: '2099-08-16' }));
  assert.ok(!isClosingSoon({ start_date: '2026-06-06', end_date: '2099-08-16' }));

  // ---- local adapter: auth ----
  const db = new LocalAdapter();
  const admin = await db.signUp('jadebrack@gmail.com', 'secret123', 'Jade', 'user', 'enthusiast');
  assert.equal(admin.role, 'admin', 'test account promoted to admin');
  await db.signOut();
  assert.equal(await db.restoreSession(), null, 'session cleared');
  const owner = await db.signUp('gallery@example.com', 'secret123', 'Gallery Co', 'venue_owner', 'gallery_professional');
  assert.equal(owner.role, 'venue_owner');
  const curator = await db.signUp('viewer@example.com', 'secret123', 'Vi Ewer', 'user', 'student');
  await assert.rejects(db.signIn('viewer@example.com', 'wrong'), /incorrect/);

  // ---- catalogue ----
  const catalogue = await db.listExhibitions();
  assert.equal(catalogue.length, 13, 'all seed exhibitions approved and listed');
  assert.ok(catalogue.every((e) => e.venue), 'venues joined');

  // ---- watchlist + visits ----
  await db.addWatch(curator.id, 'e-murakami');
  await db.addWatch(curator.id, 'e-primavera');
  assert.deepEqual((await db.watchlistIds(curator.id)).sort(), ['e-murakami', 'e-primavera']);
  await db.logVisit(curator.id, 'e-murakami', 5, 'The flowers followed me home.');
  const visits = await db.listVisits(curator.id);
  assert.equal(visits.length, 1);
  assert.equal(visits[0].rating, 5);
  assert.equal(visits[0].exhibition?.title, 'Takashi Murakami');
  assert.deepEqual(await db.watchlistIds(curator.id), ['e-primavera'], 'seen retires want-to-see');
  await db.logVisit(curator.id, 'e-murakami', 4, 'Second visit, still great.');
  assert.equal((await db.listVisits(curator.id)).length, 1, 'visit upserts, no duplicate');

  // ---- submission → approval flow ----
  const submission = await db.submitExhibition(
    {
      venue_id: null,
      new_venue_name: 'Test Space',
      new_venue_type: 'gallery',
      new_venue_address: 'Newtown',
      title: 'Trial Hang',
      artists: 'A. Tester',
      start_date: '2026-08-01',
      end_date: '2026-08-30',
      opening_datetime: null,
      description: 'A test.',
      image_url: null,
    },
    owner.id
  );
  assert.equal(submission.status, 'pending');
  assert.equal((await db.listExhibitions()).length, 13, 'pending rows are not public');
  assert.equal((await db.listPending()).length, 1);
  assert.equal((await db.listMySubmissions(owner.id)).length, 1, 'owner sees own submission');

  // public (anonymous) submission
  const anon = await db.submitExhibition(
    {
      venue_id: 'v-mca',
      title: 'Anon Show',
      artists: 'Anon',
      start_date: '2026-09-01',
      end_date: '2026-09-20',
      opening_datetime: null,
      description: 'Sent without an account.',
      image_url: null,
    },
    null
  );
  assert.equal(anon.status, 'pending');
  assert.equal((await db.listPending()).length, 2);

  // owner edit returns to pending after rejection
  await db.rejectExhibition(submission.id, 'no_image');
  const rejected = await db.getExhibition(submission.id);
  assert.equal(rejected?.status, 'rejected');
  assert.equal(rejected?.rejection_reason, 'no_image');
  await db.updateSubmission(submission.id, { image_url: 'file:///img.jpg' });
  assert.equal((await db.getExhibition(submission.id))?.status, 'pending', 'edit resubmits');

  // admin approves with an edit
  await db.approveExhibition(submission.id, { title: 'Trial Hang — Revised' });
  const approved = await db.getExhibition(submission.id);
  assert.equal(approved?.status, 'approved');
  assert.equal(approved?.title, 'Trial Hang — Revised');
  assert.equal((await db.listExhibitions()).length, 14, 'approved submission is public');

  console.log('ALL SMOKE TESTS PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
