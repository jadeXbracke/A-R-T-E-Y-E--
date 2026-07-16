/* End-to-end walk of the core loops against the exported web build (demo mode):
 * browse → sign up (admin test account) → want to see → mark as seen →
 * profile record → public submission → admin review/approve → agenda shows it.
 * Run: node tools/screenshot-server.js first (or python http.server in dist-web).
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'shots');
const BASE = 'http://localhost:8765';

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));

  const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const clickText = async (text, nth = 0) => {
    await page.getByText(text, { exact: true }).filter({ visible: true }).nth(nth).click();
    await page.waitForTimeout(600);
  };
  const clickTab = async (name) => {
    await page.getByTestId(`tab-${name}`).click();
    await page.waitForTimeout(800);
  };

  // 1. agenda
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot('01-agenda');

  // grid toggle
  await clickText('GRID');
  await shot('02-agenda-grid');
  await clickText('LIST');

  // filters
  await clickText('CLOSING SOON');
  await shot('03-filter-closing');
  await clickText('ALL');

  // 2. detail via list row
  await clickText('Takashi Murakami');
  await page.waitForTimeout(800);
  await shot('04-detail');

  // 3. mark as seen while signed out → sign-in gate → sign-up (admin account)
  await clickText('MARK AS SEEN');
  await page.waitForTimeout(800);
  await shot('05-signin-gate');
  await clickText('CREATE AN ACCOUNT →');
  await page.waitForTimeout(600);
  const inputs = page.locator('input');
  await inputs.nth(0).fill('Jade');
  await inputs.nth(1).fill('jadebrack@gmail.com');
  await inputs.nth(2).fill('demopass1');
  await clickText('COLLECTOR');
  await shot('06-signup');
  await clickText('CREATE ACCOUNT');
  await page.waitForTimeout(1500);
  await shot('07-agenda-signed-in');

  // REVIEW tab must now be visible (admin), and absent earlier is checked implicitly
  if ((await page.getByText('REVIEW', { exact: true }).count()) === 0) {
    errors.push('ASSERT: admin REVIEW tab not visible after admin sign-up');
  }

  // 4. want to see + mark as seen
  await clickText('Takashi Murakami');
  await page.waitForTimeout(800);
  await clickText('WANT TO SEE');
  await page.waitForTimeout(600);
  if ((await page.getByText('● WANT TO SEE').count()) === 0) {
    errors.push('ASSERT: watchlist toggle did not activate');
  }
  await clickText('MARK AS SEEN');
  await page.waitForTimeout(800);
  await page.getByTestId('rating-dot-4').click();
  await page.locator('textarea').fill('The flowers followed me home.');
  await shot('08-log-flow');
  await clickText('SAVE TO YOUR CURATION');
  await page.waitForTimeout(1000);
  await shot('09-detail-seen');

  // 5. profile record (back to the tabbed agenda first — detail is pushed above the tabs)
  await clickText('← BACK');
  await clickTab('profile');
  await page.waitForTimeout(800);
  await shot('10-profile');
  if ((await page.getByText('The flowers followed me home.', { exact: false }).count()) === 0) {
    errors.push('ASSERT: reflection missing from profile diary');
  }

  // 6. public submission
  await clickTab('agenda');
  await clickText('SUBMIT');
  await page.waitForTimeout(600);
  await clickText('MCA AUSTRALIA');
  const subInputs = page.locator('input');
  await subInputs.nth(0).fill('Night Swimming');
  await subInputs.nth(1).fill('Test Artist');
  await subInputs.nth(2).fill('2026-08-01');
  await subInputs.nth(3).fill('2026-09-01');
  await page.locator('textarea').fill('A trial listing sent from the public form.');
  await shot('11-submit-form');
  await clickText('SUBMIT FOR REVIEW');
  await page.waitForTimeout(800);
  await shot('12-submit-thanks');
  await clickText('BACK TO THE AGENDA →');
  await page.waitForTimeout(600);

  // 7. admin review → approve
  await clickTab('admin');
  await shot('13-admin-pending');
  await clickText('REVIEW →');
  await page.waitForTimeout(800);
  await shot('14-admin-review');
  await clickText('APPROVE');
  await page.waitForTimeout(1000);

  // 8. approved listing now public in agenda
  await clickTab('agenda');
  if ((await page.getByText('Night Swimming', { exact: false }).count()) === 0) {
    errors.push('ASSERT: approved submission not in agenda');
  }
  await shot('15-agenda-with-approved');

  // 9. reject flow with one-tap reason
  await clickText('SUBMIT');
  await page.waitForTimeout(600);
  await clickText('MCA AUSTRALIA');
  const rInputs = page.locator('input');
  await rInputs.nth(0).fill('To Be Rejected');
  await rInputs.nth(1).fill('Nobody');
  await rInputs.nth(2).fill('2026-08-01');
  await rInputs.nth(3).fill('2026-09-01');
  await page.locator('textarea').fill('Should not pass.');
  await clickText('SUBMIT FOR REVIEW');
  await page.waitForTimeout(800);
  await clickText('BACK TO THE AGENDA →');
  await page.waitForTimeout(400);
  await clickTab('admin');
  await clickText('REVIEW →');
  await page.waitForTimeout(800);
  await clickText('REJECT');
  await page.waitForTimeout(400);
  await shot('16-reject-reasons');
  await clickText('OUTSIDE SYDNEY');
  await page.waitForTimeout(800);
  if ((await page.getByText('NOTHING AWAITING REVIEW', { exact: false }).count()) === 0) {
    // list should be empty again (case-insensitive match on empty state)
    const remaining = await page.getByText('REVIEW →', { exact: true }).count();
    if (remaining > 0) errors.push('ASSERT: pending list not empty after reject');
  }
  await shot('17-admin-after-reject');

  // 10. want-to-see tab
  await clickTab('saved');
  await shot('18-saved');

  await browser.close();

  const appErrors = errors.filter((e) => !/Failed to load resource/.test(e));
  if (appErrors.length) {
    console.log('FAILURES:');
    for (const e of appErrors) console.log(' -', e);
    process.exit(2);
  }
  console.log('E2E PASSED — no app console errors, all assertions held');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
