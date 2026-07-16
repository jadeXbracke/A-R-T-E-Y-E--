/* Generates neutral placeholder artworks for the seed exhibitions.
 * Run: node tools/generate-art.js  (writes assets/art/<slug>.png, 1200x1500)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const W = 1200;
const H = 1500;

function rect(x, y, w, h, fill) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
}
function circle(cx, cy, r, fill, extra = '') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
}

// Each composition: flat abstract colour fields, square geometry, gallery-neutral.
const pieces = {
  'e-archibald': [
    rect(0, 0, W, H, '#B99C6B'),
    rect(120, 150, 960, 1200, '#8A6B4A'),
    rect(240, 300, 720, 900, '#D8C9A8'),
    circle(600, 660, 210, '#5C4632'),
    rect(240, 1020, 720, 180, '#3E3228'),
  ],
  'e-murakami': [
    rect(0, 0, W, H, '#F5C6D6'),
    circle(340, 420, 250, '#E23A2E'),
    circle(830, 700, 320, '#F5D33F'),
    circle(420, 1120, 220, '#3BA9E0'),
    circle(900, 260, 130, '#7CC24D'),
    circle(180, 860, 110, '#FFFFFF'),
  ],
  'e-primavera': [
    rect(0, 0, W, H, '#DDE7D2'),
    rect(0, 0, 400, H, '#9DBB7F'),
    rect(400, 500, 800, 260, '#C9A6D4'),
    rect(700, 0, 180, H, '#5E7D4E'),
    circle(950, 1180, 160, '#F0EBD8'),
  ],
  'e-armanious': [
    rect(0, 0, W, H, '#E4DCCB'),
    rect(150, 900, 900, 450, '#C7B99A'),
    circle(430, 620, 190, '#A89578'),
    rect(700, 380, 260, 520, '#8F7F65'),
    circle(880, 1140, 90, '#6B5E4A'),
  ],
  'e-kahukiwa': [
    rect(0, 0, W, H, '#8E2318'),
    rect(0, 980, W, 520, '#1D1815'),
    circle(600, 620, 330, '#D8CDB8'),
    circle(600, 620, 190, '#8E2318'),
    rect(0, 460, W, 60, '#1D1815'),
  ],
  'e-nell': [
    rect(0, 0, W, H, '#F2EFE8'),
    rect(0, 1050, W, 450, '#17140F'),
    circle(600, 560, 300, '#17140F'),
    circle(600, 560, 60, '#C22F1E'),
  ],
  'e-acw': [
    rect(0, 0, W, H, '#C9CFD6'),
    rect(90, 120, 500, 640, '#2E4A7A'),
    rect(640, 420, 470, 900, '#8B94A3'),
    rect(240, 900, 420, 380, '#E9E5DA'),
    rect(700, 150, 340, 200, '#1E2B42'),
  ],
  'e-bennett': [
    rect(0, 0, W, H, '#B9CBA4'),
    circle(300, 400, 240, '#5F7D4C'),
    circle(860, 640, 300, '#E7B7C4'),
    circle(520, 1120, 260, '#3E5C36'),
    circle(1000, 1220, 150, '#F1E7D0'),
  ],
  'e-gabori': [
    rect(0, 0, W, H, '#E2572E'),
    rect(0, 0, 520, 800, '#E84B8A'),
    rect(520, 800, 680, 700, '#2E5AA8'),
    rect(300, 550, 620, 400, '#F5E14B'),
    rect(0, 1250, 520, 250, '#FFFFFF'),
  ],
  'e-gesture': [
    rect(0, 0, W, H, '#EFECE4'),
    `<path d="M 100 1250 C 350 700, 500 1350, 720 800 S 1050 350, 1120 200" stroke="#17140F" stroke-width="90" fill="none" stroke-linecap="square"/>`,
    circle(220, 320, 70, '#17140F'),
  ],
  'e-crothers': [
    rect(0, 0, W, H, '#D7E0E4'),
    `<path d="M 0 400 L 400 700 L 800 350 L 1200 650" stroke="#5B7A8C" stroke-width="26" fill="none"/>`,
    `<path d="M 0 1000 L 350 850 L 750 1200 L 1200 950" stroke="#33505F" stroke-width="26" fill="none"/>`,
    circle(400, 700, 60, '#33505F'),
    circle(800, 350, 60, '#5B7A8C'),
    circle(750, 1200, 60, '#5B7A8C'),
  ],
  'e-pulse': [
    rect(0, 0, W, H, '#F2EFE8'),
    ...Array.from({ length: 8 }, (_, i) => rect(0, 120 + i * 170, i % 2 ? 900 : 1100, 70, i % 3 === 1 ? '#C22F1E' : '#17140F')),
  ],
  'e-abbotsleigh': [
    rect(0, 0, W, H, '#E8E2D4'),
    rect(80, 100, 480, 420, '#A3B3C2'),
    rect(640, 100, 480, 640, '#C9A6A0'),
    rect(80, 600, 480, 760, '#7F8E6F'),
    rect(640, 820, 480, 540, '#D9C778'),
  ],
};

async function main() {
  const outDir = path.join(__dirname, '..', 'assets', 'art');
  fs.mkdirSync(outDir, { recursive: true });
  for (const [slug, shapes] of Object.entries(pieces)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes.join('')}</svg>`;
    const out = path.join(outDir, `${slug}.png`);
    await sharp(Buffer.from(svg)).png({ quality: 80, compressionLevel: 9 }).toFile(out);
    console.log('wrote', out);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
