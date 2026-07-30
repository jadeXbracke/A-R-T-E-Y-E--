// Generates neutral tonal placeholder images for exhibitions that have no
// press image yet. Pure node (zlib) — no image libraries required.
// Usage: node scripts/gen-placeholders.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const W = 900;
const H = 1125; // 4:5

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(pixels, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}

// deterministic pseudo-noise so the fields feel like paper, not vector fills
function noise(x, y, seed) {
  let n = x * 374761393 + y * 668265263 + seed * 2246822519;
  n = (n ^ (n >> 13)) * 1274126177;
  return (((n ^ (n >> 16)) >>> 0) % 1000) / 1000 - 0.5;
}

function gradient(slug, top, bottom, seed) {
  const [r1, g1, b1] = hex(top);
  const [r2, g2, b2] = hex(bottom);
  const rows = [];
  for (let y = 0; y < H; y++) {
    const row = Buffer.alloc(1 + W * 3);
    row[0] = 0; // filter none
    const t = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const n = noise(x >> 2, y >> 2, seed) * 7;
      row[1 + x * 3] = Math.max(0, Math.min(255, Math.round(r1 + (r2 - r1) * t + n)));
      row[2 + x * 3] = Math.max(0, Math.min(255, Math.round(g1 + (g2 - g1) * t + n)));
      row[3 + x * 3] = Math.max(0, Math.min(255, Math.round(b1 + (b2 - b1) * t + n)));
    }
    rows.push(row);
  }
  return png(Buffer.concat(rows));
}

const outDir = path.join(__dirname, '..', 'assets', 'exhibitions');
fs.mkdirSync(outDir, { recursive: true });

// Light, modern editorial fields — bone, stone, sage, clay, fog — so a show
// without a press image reads like quiet gallery paper, not a dark block.
const sets = [
  ['archibald', '#F0EEE9', '#D6D2C9'],
  ['murakami', '#F2E7DA', '#DECBB4'],
  ['primavera', '#E8EDE6', '#CBD4C8'],
  ['armanious', '#EEECE8', '#D2CEC6'],
  ['kahukiwa', '#EFE0D6', '#D8BCAB'],
  ['nell', '#EAEAEC', '#CBCCD1'],
  ['constructed-world', '#E8ECF0', '#C8D0D9'],
  ['bennett', '#F2EBDE', '#DCCEB2'],
  ['gabori-ledgerwood', '#E6EAF0', '#BFC8D6'],
  ['infinite-gesture', '#ECEAF0', '#CECBD8'],
  ['crothers', '#E7ECEC', '#C5CFCF'],
  ['pulse', '#F2E8E6', '#DCC7C2'],
  ['abbotsleigh', '#EEEDE4', '#D2D0C0'],
];

sets.forEach(([slug, a, b], i) => {
  fs.writeFileSync(path.join(outDir, `${slug}.png`), gradient(slug, a, b, i + 7));
  console.log('wrote', slug + '.png');
});
