/* Renders key screens of the web export at iPhone size and saves screenshots. */
const { chromium } = require('playwright-core');
const path = require('path');

const OUT = process.env.SHOT_DIR || path.join(__dirname, '..', 'shots');
const BASE = 'http://localhost:8765';

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));

  const shots = [
    ['/', 'agenda'],
    ['/exhibition/e-murakami', 'detail'],
    ['/submit', 'submit'],
    ['/auth/sign-up', 'signup'],
    ['/saved', 'saved'],
    ['/profile', 'profile'],
  ];
  const fs = require('fs');
  fs.mkdirSync(OUT, { recursive: true });
  for (const [route, name] of shots) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log('shot', name);
  }
  await browser.close();
  if (errors.length) {
    console.log('CONSOLE ERRORS:');
    for (const e of errors.slice(0, 20)) console.log(' -', e);
    process.exit(2);
  }
  console.log('NO CONSOLE ERRORS');
}
main().catch((e) => { console.error(e); process.exit(1); });
