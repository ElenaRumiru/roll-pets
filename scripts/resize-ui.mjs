import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'ui');
const dst = path.join(root, 'public', 'assets', 'ui');

const jobs = [
    { file: 'Roll.png',           out: 'roll.png',           w: 340, h: 70 },
    { file: 'collections.png',    out: 'collections.png',    w: 50,  h: 50 },
    { file: 'x2chanceAR.png',     out: 'x2chance.png',       w: 64,  h: 64 },
    { file: 'x3chanceAR.png',     out: 'x3chance.png',       w: 64,  h: 64 },
    { file: 'x5chanceSimple.png', out: 'x5chance.png',       w: 64,  h: 64 },
    { file: 'x5chanceWow.png',    out: 'x5chance_ready.png', w: 64,  h: 64 },
    { file: 'AutoImage.png',      out: 'auto.png',           w: 64,  h: 64 },
];

for (const j of jobs) {
    const input = path.join(src, j.file);
    const output = path.join(dst, j.out);
    await sharp(input)
        .resize(j.w, j.h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(output);
    console.log(`✓ ${j.out} (${j.w}x${j.h})`);
}

console.log('Done!');
