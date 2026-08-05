#!/usr/bin/env node
/**
 * Scant docs/portfolio/photos/ en schrijft docs/portfolio/manifest.json.
 *
 * Structuur:
 *   docs/portfolio/photos/<serienaam>/<foto>.jpg
 *
 * - Elke submap wordt een serie; foto's direct in photos/ komen in "Portfolio".
 * - Sortering is alfabetisch op bestandsnaam; een nummer-voorvoegsel
 *   ("01-duinen.jpg") bepaalt de volgorde en wordt uit het bijschrift gehaald.
 * - Bijschrift = bestandsnaam zonder extensie, met streepjes als spaties.
 *   Eindigt de naam op "_x" (bijv. "duinen_x.jpg") dan blijft het bijschrift leeg.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PHOTOS_DIR = path.join(ROOT, "docs", "portfolio", "photos");
const MANIFEST_PATH = path.join(ROOT, "docs", "portfolio", "manifest.json");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"]);

function titleFromName(name) {
  const stripped = name
    .replace(/^\d+[\s._-]*/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  if (!stripped) return "";
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function captionFromFile(filename) {
  const base = path.basename(filename, path.extname(filename));
  if (/_x$/i.test(base)) return "";
  return titleFromName(base.replace(/_x$/i, ""));
}

/* ---- afmetingen lezen (voor rustige laadervaring, optioneel) ---- */

function readDimensions(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  try {
    const buf = fs.readFileSync(filePath);
    if (ext === ".png") return pngSize(buf);
    if (ext === ".jpg" || ext === ".jpeg") return jpegSize(buf);
    if (ext === ".gif") return gifSize(buf);
    if (ext === ".svg") return svgSize(buf);
  } catch (err) {
    // afmetingen zijn optioneel
  }
  return null;
}

function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function gifSize(buf) {
  if (buf.length < 10 || buf.toString("ascii", 0, 3) !== "GIF") return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) { offset += 1; continue; }
    const marker = buf[offset + 1];
    // SOF0..SOF15 behalve DHT/DAC/RST
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  return null;
}

function svgSize(buf) {
  const text = buf.toString("utf8", 0, Math.min(buf.length, 2048));
  const viewBox = text.match(/viewBox\s*=\s*["']\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (viewBox) return { width: Math.round(+viewBox[1]), height: Math.round(+viewBox[2]) };
  const w = text.match(/\bwidth\s*=\s*["']([\d.]+)/i);
  const h = text.match(/\bheight\s*=\s*["']([\d.]+)/i);
  if (w && h) return { width: Math.round(+w[1]), height: Math.round(+h[1]) };
  return null;
}

/* ---- scannen ---- */

function listImages(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && IMAGE_EXT.has(path.extname(d.name).toLowerCase()))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "nl", { numeric: true }));
}

function buildPhoto(dirRel, filename) {
  const abs = path.join(PHOTOS_DIR, dirRel, filename);
  const dims = readDimensions(abs);
  const srcParts = ["photos"].concat(dirRel ? [dirRel] : [], [filename]);
  return {
    src: srcParts.map(encodeURIComponent).join("/"),
    caption: captionFromFile(filename),
    width: dims ? dims.width : null,
    height: dims ? dims.height : null,
  };
}

function build() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }

  const series = [];

  const rootImages = listImages(PHOTOS_DIR);
  if (rootImages.length) {
    series.push({
      slug: "portfolio",
      title: "Portfolio",
      photos: rootImages.map((f) => buildPhoto("", f)),
    });
  }

  const folders = fs
    .readdirSync(PHOTOS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "nl", { numeric: true }));

  for (const folder of folders) {
    const images = listImages(path.join(PHOTOS_DIR, folder));
    if (!images.length) continue;
    series.push({
      slug: folder.toLowerCase(),
      title: titleFromName(folder) || folder,
      photos: images.map((f) => buildPhoto(folder, f)),
    });
  }

  const manifest = {
    generated: new Date().toISOString(),
    series,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  const total = series.reduce((sum, s) => sum + s.photos.length, 0);
  console.log(`manifest.json bijgewerkt: ${series.length} serie(s), ${total} foto('s)`);
}

build();
