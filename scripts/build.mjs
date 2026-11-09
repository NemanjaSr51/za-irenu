// Builds the site into _site/: copies the pages, turns every photo in slike/ into a small
// thumbnail + a phone-sized version (auto-rotated, black/white bars trimmed, location data stripped),
// and writes slike.js with the list the pages read.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import exifReader from 'exif-reader';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, '_site');
const src = path.join(root, 'slike');
const SKIP = new Set(['_site', 'node_modules', 'scripts', 'slike', 'package.json', 'package-lock.json', 'README.md']);
const IMG = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(path.join(out, 'slike', 't'), { recursive: true });
await fs.mkdir(path.join(out, 'slike', 'v'), { recursive: true });
for (const e of await fs.readdir(root, { withFileTypes: true })) {
  if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
  await fs.cp(path.join(root, e.name), path.join(out, e.name), { recursive: true });
}

let captions = {};
try { captions = JSON.parse(await fs.readFile(path.join(src, 'opisi.json'), 'utf8')); } catch {}

const files = (await fs.readdir(src).catch(() => [])).filter(f => IMG.test(f)).sort();
const GENERIC = /^(img|dsc|dscn|pxl|mvimg|vid|photo|image|whatsapp|screenshot|snimak|signal|fb_img|received|pic|picture|cam|camera|\d+$)/i;
const slug = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'dj').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'slika';
const pad = n => String(n).padStart(2, '0');

function dateFromName(name) {
  const m = name.match(/(20\d\d)[-_.]?(\d\d)[-_.]?(\d\d)(?:\D{1,4}(\d\d)[-_.:]?(\d\d)[-_.:]?(\d\d))?/);
  if (!m) return '';
  const [, y, mo, d, h = '12', mi = '00', s = '00'] = m;
  if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return '';
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}
function dateFromExif(buf) {
  try {
    const x = exifReader(buf);
    const d = x?.Photo?.DateTimeOriginal || x?.Image?.DateTime;
    if (d instanceof Date && !isNaN(d)) return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  } catch {}
  return '';
}
// opisi.json entry for a photo: either "caption" or { "opis": "caption", "datum": "16.8.2026" }.
const entryFor = file => {
  if (!Object.hasOwn(captions, file)) return {};
  const e = captions[file];
  return typeof e === 'object' && e !== null ? e : { opis: e };
};
// "16.8.2026", "16. 08. 2026.", "16/8/2026", "2026-08-16" -> "2026-08-16T12:00:00"; "" -> no date shown; undefined -> automatic
function dateFromEntry(file) {
  const e = entryFor(file);
  if (!Object.hasOwn(e, 'datum')) return undefined;
  const s = String(e.datum ?? '').trim();
  if (!s) return '';
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}T12:00:00`;
  m = s.replace(/\s+/g, '').match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})\.?$/);
  if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) return `${m[3]}-${pad(m[2])}-${pad(m[1])}T12:00:00`;
  console.warn(`  ! ne razumijem datum "${s}" za ${file}, koristim automatski`);
  return undefined;
}
function captionFor(file) {
  const e = entryFor(file);
  if (Object.hasOwn(e, 'opis')) return String(e.opis || '');
  const base = file.replace(/\.[^.]+$/, '');
  if (GENERIC.test(base)) return '';
  return base.replace(/(20\d\d)[-_.]?\d\d[-_.]?\d\d([-_ .]*(at)?[-_ .]*\d\d[-_.:]?\d\d([-_.:]?\d\d)?)?/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Remove letterbox bars (e.g. story screenshots): flat bands (solid or gradient) on BOTH opposite edges.
// A dark sky on just one edge is part of the photo, so it stays.
async function trimBars(buf) {
  const meta = await sharp(buf).metadata();
  const SW = 240, sh = Math.max(1, Math.round(meta.height * SW / meta.width));
  const { data } = await sharp(buf).resize(SW, sh, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => data[y * SW + x];
  const flat = vals => { let lo = 255, hi = 0; for (const v of vals) { lo = Math.min(lo, v); hi = Math.max(hi, v); } return hi - lo < 10; };
  const row = y => Array.from({ length: SW }, (_, x) => px(x, y));
  const col = x => Array.from({ length: sh }, (_, y) => px(x, y));
  let top = 0, bottom = sh - 1, left = 0, right = SW - 1;
  while (top < bottom && flat(row(top))) top++;
  while (bottom > top && flat(row(bottom))) bottom--;
  while (left < right && flat(col(left))) left++;
  while (right > left && flat(col(right))) right--;
  const minV = sh * 0.04, minH = SW * 0.04;
  if (top < minV || sh - 1 - bottom < minV) { top = 0; bottom = sh - 1; }
  if (left < minH || SW - 1 - right < minH) { left = 0; right = SW - 1; }
  const keptW = (right - left + 1) / SW, keptH = (bottom - top + 1) / sh;
  if (keptW * keptH > 0.95 || keptW < 0.3 || keptH < 0.3) return buf;
  const s = meta.width / SW, inset = 1; // shave a pixel so no dark seam survives the downscale
  const L = Math.min(meta.width - 1, Math.round(left * s) + (left ? inset : 0));
  const T = Math.min(meta.height - 1, Math.round(top * s) + (top ? inset : 0));
  const R = Math.max(L + 1, Math.round((right + 1) * s) - (right < SW - 1 ? inset : 0));
  const B = Math.max(T + 1, Math.round((bottom + 1) * s) - (bottom < sh - 1 ? inset : 0));
  return sharp(buf).extract({ left: L, top: T, width: Math.min(R, meta.width) - L, height: Math.min(B, meta.height) - T }).toBuffer();
}

const photos = [];
const used = new Set();
for (const file of files) {
  try {
    const full = path.join(src, file);
    const meta = await sharp(full, { failOn: 'none' }).metadata();
    let id = slug(file.replace(/\.[^.]+$/, ''));
    while (used.has(id)) id += '-x';
    used.add(id);

    let buf = await sharp(full, { failOn: 'none' }).rotate().toBuffer();
    buf = await trimBars(buf);

    const thumb = await sharp(buf).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(out, 'slike', 't', id + '.webp'));
    const view = await sharp(buf).resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(out, 'slike', 'v', id + '.webp'));

    photos.push({
      id,
      t: `slike/t/${id}.webp`, tw: thumb.width, th: thumb.height,
      v: `slike/v/${id}.webp`, vw: view.width, vh: view.height,
      date: dateFromEntry(file) ?? (dateFromName(file) || (meta.exif ? dateFromExif(meta.exif) : '')),
      caption: captionFor(file),
      file,
    });
    console.log(`  ✓ ${file} → ${id} (${view.width}×${view.height})`);
  } catch (err) {
    console.warn(`  ✗ preskacem ${file}: ${err.message}`);
  }
}
// newest first; undated ones at the end, by name
photos.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.file.localeCompare(b.file));
photos.forEach(p => delete p.file);

await fs.writeFile(path.join(out, 'slike.js'), `window.SLIKE = ${JSON.stringify({ photos }, null, 1)};\n`);
await fs.writeFile(path.join(out, '.nojekyll'), '');
console.log(`Gotovo: ${photos.length} slika → _site/`);
