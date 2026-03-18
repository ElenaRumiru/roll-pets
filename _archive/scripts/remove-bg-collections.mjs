/**
 * Remove white background from collection icons.
 * Strategy: flood-fill white from corners, then hard-erode 2px border to kill fringe.
 *
 * Usage: node scripts/remove-bg-collections.mjs
 * Input:  collections/*.webp
 * Output: collections/out/*.png (with transparency)
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join } from 'path';

const SRC_DIR = join(process.cwd(), 'collections');
const OUT_DIR = join(SRC_DIR, 'out');
const WHITE_THRESHOLD = 210;
const ERODE_PASSES = 2; // hard-remove N pixel layers touching transparent

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(SRC_DIR)).filter(f => f.endsWith('.webp'));
console.log(`Found ${files.length} icons to process`);

for (const file of files) {
  const src = join(SRC_DIR, file);
  const meta = await sharp(src).metadata();
  const w = meta.width;
  const h = meta.height;

  const { data } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buf = Buffer.from(data);

  const idx = (x, y) => (y * w + x) * 4;
  const key = (x, y) => y * w + x;

  // ── Step 1: Flood fill white from edges ──
  const visited = new Uint8Array(w * h);

  function floodFill(sx, sy) {
    const queue = [[sx, sy]];
    visited[key(sx, sy)] = 1;
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const i = idx(x, y);
      const r = buf[i], g = buf[i + 1], b = buf[i + 2];
      if (r < WHITE_THRESHOLD || g < WHITE_THRESHOLD || b < WHITE_THRESHOLD) continue;
      buf[i + 3] = 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[key(nx, ny)]) {
          visited[key(nx, ny)] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  // Seed from all edges
  for (let x = 0; x < w; x++) { floodFill(x, 0); floodFill(x, h - 1); }
  for (let y = 0; y < h; y++) { floodFill(0, y); floodFill(w - 1, y); }

  // ── Step 2: Hard erode — remove N pixel layers bordering transparent ──
  for (let pass = 0; pass < ERODE_PASSES; pass++) {
    const toKill = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (buf[idx(x, y) + 3] === 0) continue;
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h || buf[idx(nx, ny) + 3] === 0) {
            toKill.push([x, y]);
            break;
          }
        }
      }
    }
    for (const [x, y] of toKill) buf[idx(x, y) + 3] = 0;
  }

  const outName = file.replace('.webp', '.png');
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(join(OUT_DIR, outName));

  console.log(`  ✓ ${file} → out/${outName}`);
}

console.log(`\nDone! ${files.length} icons saved to collections/out/`);
