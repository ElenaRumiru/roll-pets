import sharp from 'sharp';
import { readdir, rm, mkdir } from 'fs/promises';
import { join } from 'path';

const SRC = 'NewPets';
const DEST = 'public/assets/pets';
const SKIP = ['0066', '0111'];

// Delete old placeholder webps
const oldFiles = await readdir(DEST);
for (const f of oldFiles) {
    if (f.endsWith('.webp')) {
        await rm(join(DEST, f));
        console.log(`Deleted old: ${f}`);
    }
}

// Convert new PNGs to WebP
const files = (await readdir(SRC))
    .filter(f => f.endsWith('.png'))
    .filter(f => !SKIP.some(s => f.startsWith(s)))
    .sort();

console.log(`\nConverting ${files.length} PNGs to WebP...\n`);

for (const f of files) {
    const num = f.split('_')[0]; // e.g. '0001'
    const outName = `${num}.webp`;
    const trimmed = await sharp(join(SRC, f))
        .trim()
        .toBuffer({ resolveWithObject: true });
    await sharp(trimmed.data)
        .resize(512, 512, { fit: 'inside' })
        .webp({ quality: 80 })
        .toFile(join(DEST, outName));
    const { width, height } = trimmed.info;
    console.log(`${f} → ${outName} (trimmed to ${width}x${height})`);
}

console.log(`\nDone! Converted ${files.length} files.`);
