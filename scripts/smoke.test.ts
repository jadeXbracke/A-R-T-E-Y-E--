/**
 * Data-layer smoke test — runs off-device with `npm test`.
 * Exercises the seeded demo backend end-to-end: auth, agenda, watchlist,
 * mark-as-seen, venue + public submissions, admin approve/reject.
 */
import { DemoBackend, KeyValueStorage } from '../src/lib/demoBackend';
import { dateRange, isClosingSoon, isOnNow, isOpeningSoon, openingLabel } from '../src/lib/dates';
import { SEED_EXHIBITIONS, SEED_VENUES } from '../src/lib/seed';
import { buildInput } from '../src/lib/validate';

let failures = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failures++;
    console.error(`FAIL  ${name}`);
  }
}

class MemStorage implements KeyValueStorage {
  private m = new Map<string, string>();
  async getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  async setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

async function main() {
  const TODAY = '2026-07-16';

  console.log('— seed integrity');
  check('13 exhibitions seeded', SEED_EXHIBITIONS.length === 13);
  check('8 venues seeded', SEED_VENUES.length === 8);
  check(
    'exactly Archibald, Murakami, Primavera featured',
    SEED_EXHIBITIONS.filter((e) => e.is_featured)
      .map((e) => e.id)
      .sort()
      .join(',') === 'e-archibald,e-murakami,e-primavera'
  );
  check(
    'every exhibition references a seeded venue',
    SEED_EXHIBITIONS.every((e) => SEED_VENUES.some((v) => v.id === e.venue_id))
  );
  check('all seeded rows approved + Sydney', SEED_EXHIBITIONS.every((e) => e.status === 'approved' && e.city === 'Sydney'));

  console.log('— date logic (today = 2026-07-16)');
  check('dateRange renders mono style', dateRange('2026-06-06', '2026-08-16') === '6 JUN — 16 AUG');
  check('openingLabel renders 6 PM', openingLabel('2026-07-22T18:00:00+10:00') === '22 JUL, 6 PM');
  const archibald = SEED_EXHIBITIONS.find((e) => e.id === 'e-archibald')!;
  const crothers = SEED_EXHIBITIONS.find((e) => e.id === 'e-crothers')!;
  const gabori = SEED_EXHIBITIONS.find((e) => e.id === 'e-gabori')!;
  check('Archibald is on now', isOnNow(archibald, TODAY));
  check('Crothers (22 Jul) not on now but opening soon', !isOnNow(crothers, TODAY) && isOpeningSoon(crothers, TODAY));
  check('Gabori (ended 11 Jul) not on now', !isOnNow(gabori, TODAY));
  const acw = SEED_EXHIBITIONS.find((e) => e.id === 'e-acw')!;
  check('A Constructed World (ends 18 Jul) closing soon', isClosingSoon(acw, TODAY));

  console.log('— validation');
  check('valid input passes', typeof buildInput({
    venueName: 'Test Gallery', venueType: 'gallery', title: 'T', artists: 'A',
    start: '2026-08-01', end: '2026-08-20', opening: '2026-08-01 18:00',
    description: '', imageUrl: null, contact: '',
  }) === 'object');
  check('bad date rejected', typeof buildInput({
    venueName: 'Test', venueType: 'gallery', title: 'T', artists: 'A',
    start: '01/08/2026', end: '2026-08-20', opening: '', description: '', imageUrl: null, contact: '',
  }) === 'string');
  check('end before start rejected', typeof buildInput({
    venueName: 'Test', venueType: 'gallery', title: 'T', artists: 'A',
    start: '2026-08-20', end: '2026-08-01', opening: '', description: '', imageUrl: null, contact: '',
  }) === 'string');

  console.log('— demo backend: auth');
  const b = new DemoBackend(new MemStorage());
  check('no session initially', (await b.restoreSession()) === null);
  const admin = await b.signIn('jadebrack@gmail.com', 'anything');
  check('test account signs in as admin', admin.role === 'admin');
  await b.signOut();
  const user = await b.signUp({
    email: 'viewer@example.com', password: 'pw', displayName: 'Viewer',
    role: 'user', profileType: 'student',
  });
  check('sign-up creates user with profile type', user.role === 'user' && user.profile_type === 'student');
  let dup = false;
  try {
    await b.signUp({ email: 'viewer@example.com', password: 'x', displayName: 'V', role: 'user', profileType: 'artist' });
  } catch {
    dup = true;
  }
  check('duplicate email rejected', dup);

  console.log('— demo backend: agenda + watchlist + visits');
  const agenda = await b.listAgenda();
  check('agenda serves the 13 approved rows', agenda.exhibitions.length === 13);
  await b.addToWatchlist(user.id, 'e-primavera');
  await b.addToWatchlist(user.id, 'e-armanious');
  check('watchlist holds 2', (await b.getWatchlist(user.id)).length === 2);
  await b.removeFromWatchlist(user.id, 'e-armanious');
  check('watchlist remove works', (await b.getWatchlist(user.id)).join() === 'e-primavera');
  await b.markSeen({
    user_id: user.id, exhibition_id: 'e-primavera', rating: 4,
    reflection: 'The video room stayed with me.', visit_date: TODAY,
  });
  const visits = await b.getVisits(user.id);
  check('visit logged with rating + note', visits.length === 1 && visits[0].rating === 4);
  check('seen exhibition leaves the watchlist', (await b.getWatchlist(user.id)).length === 0);

  console.log('— demo backend: submissions + approval flow');
  const owner = await b.signUp({
    email: 'gallery@example.com', password: 'pw', displayName: 'Gallerist',
    role: 'venue_owner', profileType: 'gallery_professional',
  });
  await b.submitExhibition({
    venue_name: 'New Space', venue_type: 'gallery', title: 'First Light', artists: 'Jane Doe',
    start_date: '2026-09-01', end_date: '2026-09-30', opening_datetime: null,
    description: 'Debut show.', image_url: null,
  }, owner.id);
  await b.submitExhibition({
    venue_name: 'Someone Else Space', venue_type: 'gallery', title: 'Public Tip', artists: 'Anon',
    start_date: '2026-09-05', end_date: '2026-09-25', opening_datetime: null,
    description: '', image_url: null, submitter_contact: 'tipper@example.com',
  }, null);
  check('pending rows do not enter the agenda', (await b.listAgenda()).exhibitions.length === 13);
  const mine = await b.listMySubmissions(owner.id);
  check('owner sees only their submission', mine.exhibitions.length === 1 && mine.exhibitions[0].title === 'First Light');
  const pending = await b.listPending();
  check('admin sees both pending', pending.exhibitions.length === 2);

  const first = pending.exhibitions.find((e) => e.title === 'First Light')!;
  const tip = pending.exhibitions.find((e) => e.title === 'Public Tip')!;
  await b.approve(first.id, {
    venue_name: 'New Space', venue_type: 'gallery', title: 'First Light (edited)', artists: 'Jane Doe',
    start_date: '2026-09-01', end_date: '2026-09-30', opening_datetime: null,
    description: 'Debut show, edited by admin before approval.', image_url: null,
  });
  await b.reject(tip.id, 'no_image');
  const after = await b.listAgenda();
  check('approved (with admin edit) enters agenda', after.exhibitions.some((e) => e.title === 'First Light (edited)'));
  check('rejected stays out of agenda', !after.exhibitions.some((e) => e.title === 'Public Tip'));
  check('queue is clear', (await b.listPending()).exhibitions.length === 0);

  const ownerView = await b.listMySubmissions(owner.id);
  check('owner sees approved status', ownerView.exhibitions[0].status === 'approved');
  await b.updateSubmission(ownerView.exhibitions[0].id, {
    venue_name: 'New Space', venue_type: 'gallery', title: 'First Light II', artists: 'Jane Doe',
    start_date: '2026-09-01', end_date: '2026-09-30', opening_datetime: null,
    description: 'Owner edit.', image_url: null,
  });
  check('owner edit lands', (await b.listMySubmissions(owner.id)).exhibitions[0].title === 'First Light II');

  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
