/**
 * Asset optimiser — resize source images to 2× max display size, then PNG-optimise.
 * Zero quality loss at display resolution. Lossless PNG compression.
 *
 * Run: node scripts/optimize-assets.mjs
 *
 * Max display sizes derived from BootScene.ts runtime downscaling targets:
 *   trimAndDownscaleCoin → largest target size
 *   trimToWidth/trimToHeight → target dimension
 *   downscaleTexture → target w×h
 *   pet textures → TARGET_PET = 250
 *   eggs → 296 (CenterStage roll display) + 170 (_sm for shop/nests)
 */

import sharp from 'sharp';
import { readdir, stat, copyFile, mkdir, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';

const ASSETS = 'public/assets';
const DRY_RUN = process.argv.includes('--dry-run');

// ── UI icons: file → max canvas pixels needed (2× for retina headroom) ──
// Format: maxDimension means "fit within maxDimension × maxDimension box"
const UI_MAX_SIZE = {
    // 1536×1024 monsters — trimmed then downscaled to small sizes
    'gift_green2_icon.png': 256,   // trimAndDownscaleCoin → max 80px (_lg)
    'quests_icon.png':      520,   // downscaleTexture → 260×174
    'daily_icon.png':       320,   // trimAndDownscaleCoin 90px + trimToWidth 130px
    'nest.png':             560,   // trimToWidth → 280px
    'Rating_icon_3.png':    256,   // trimToWidth → 99px
    'shop_icon.png':        740,   // downscaleTexture → 370×247
    'Rating_icon_2.png':    256,   // used directly, small display
    'star_not_active.png':  128,   // trimToHeight → 28px
    'star_active.png':      128,   // trimToHeight → 28px
    'nests_icon.png':       440,   // trimToWidth → 220px
    'shock_icon.png':       128,   // trimAndDownscaleCoin → 36px
    'rebirth.png':          320,   // trimToWidth → 120px
    'arrow_r.png':          256,   // trimToHeight → 56px
    'incubation_icon.png':  440,   // trimToWidth → 220px (same as nests_icon)
    'arrow_l.png':          256,   // trimToHeight → 56px
    'ad_film.png':          320,   // displayed at ~150px

    // 1024×1024
    'coin.png':             256,   // trimAndDownscaleCoin → max 80px
    'exp.png':              128,   // trimToHeight → 44px
    'lvl_icon.png':         192,   // trimAndDownscaleCoin → 60px
    'ok_icon.png':          192,   // trimAndDownscaleCoin → max 60px
    'lock_icon.png':        160,   // trimAndDownscaleCoin → 56px
    'settings_icon.png':    160,   // trimAndDownscaleCoin → 56px

    // 799×446 / 791×438
    'automod_on.png':       464,   // downscaled to 232×144
    'automod_off.png':      464,   // downscaled to 232×144

    // Already reasonable — skip (button 1927×417 is special)
    'button_black_outline_shadow_width130.png': 740,
};

let totalBefore = 0;
let totalAfter = 0;

async function optimiseFile(filePath, maxDim) {
    const before = (await stat(filePath)).size;
    totalBefore += before;

    const meta = await sharp(filePath).metadata();
    const maxSrc = Math.max(meta.width, meta.height);

    // Only resize if source is larger than target
    let pipeline = sharp(filePath);
    if (maxSrc > maxDim) {
        pipeline = pipeline.resize(maxDim, maxDim, {
            fit: 'inside',
            withoutEnlargement: true,
            kernel: 'lanczos3',
        });
    }

    // Re-compress PNG with maximum effort (lossless)
    const buf = await pipeline
        .png({ compressionLevel: 9, effort: 10, palette: false })
        .toBuffer();

    totalAfter += buf.length;
    const pct = ((1 - buf.length / before) * 100).toFixed(1);
    const beforeKB = (before / 1024).toFixed(0);
    const afterKB = (buf.length / 1024).toFixed(0);
    console.log(`  ${basename(filePath)}: ${beforeKB}KB → ${afterKB}KB (−${pct}%) [${meta.width}×${meta.height} → fit ${maxDim}]`);

    if (!DRY_RUN) {
        await writeFile(filePath, buf);
    }
}

async function optimiseEggs() {
    console.log('\n── Eggs (1024×1024 PNG → 600px PNG) ──');
    const dir = join(ASSETS, 'eggs');
    const files = (await readdir(dir)).filter(f => f.endsWith('.png'));
    for (const f of files) {
        await optimiseFile(join(dir, f), 600);
    }
}

async function optimiseUI() {
    console.log('\n── UI icons ──');
    for (const [file, maxDim] of Object.entries(UI_MAX_SIZE)) {
        const filePath = join(ASSETS, 'ui', file);
        try {
            await stat(filePath);
            await optimiseFile(filePath, maxDim);
        } catch {
            console.log(`  SKIP (not found): ${file}`);
        }
    }
}

async function optimisePets() {
    console.log('\n── Pets (webp 512px — already optimised, skipping) ──');
    const dir = join(ASSETS, 'pets');
    const files = (await readdir(dir)).filter(f => f.endsWith('.webp'));
    let size = 0;
    for (const f of files) { size += (await stat(join(dir, f))).size; }
    totalBefore += size;
    totalAfter += size;
    console.log(`  ${files.length} files: ${(size/1024/1024).toFixed(1)}MB (no change)`);
}

async function optimiseBackgrounds() {
    console.log('\n── Backgrounds (webp 1280×731 → 1031×580 exact game res) ──');
    const dir = join(ASSETS, 'backgrounds');
    const files = (await readdir(dir)).filter(f => f.endsWith('.webp'));
    let before = 0, after = 0;
    for (const f of files) {
        const fp = join(dir, f);
        const { readFile } = await import('fs/promises');
        const srcBuf = await readFile(fp);
        before += srcBuf.length;

        const buf = await sharp(srcBuf)
            .resize(1031, 580, { fit: 'cover', kernel: 'lanczos3' })
            .webp({ quality: 82, effort: 6 })
            .toBuffer();
        after += buf.length;

        if (!DRY_RUN) {
            await writeFile(fp, buf);
        }
    }
    totalBefore += before;
    totalAfter += after;
    console.log(`  ${files.length} files: ${(before/1024/1024).toFixed(1)}MB → ${(after/1024/1024).toFixed(1)}MB`);
}

async function optimiseCollectionIcons() {
    console.log('\n── Collection icons (256×256 PNG — already small, skipping) ──');
    const dir = join(ASSETS, 'ui', 'collections');
    const files = (await readdir(dir)).filter(f => f.endsWith('.png'));
    let size = 0;
    for (const f of files) { size += (await stat(join(dir, f))).size; }
    totalBefore += size;
    totalAfter += size;
    console.log(`  ${files.length} files: ${(size/1024).toFixed(0)}KB (no change)`);
}

async function main() {
    console.log(DRY_RUN ? '=== DRY RUN (no files modified) ===' : '=== OPTIMISING ASSETS ===');

    await optimiseUI();
    await optimiseEggs();
    await optimisePets();
    await optimiseBackgrounds();
    await optimiseCollectionIcons();

    console.log('\n════════════════════════════════════');
    console.log(`TOTAL: ${(totalBefore/1024/1024).toFixed(1)}MB → ${(totalAfter/1024/1024).toFixed(1)}MB`);
    console.log(`SAVED: ${((totalBefore-totalAfter)/1024/1024).toFixed(1)}MB (−${((1-totalAfter/totalBefore)*100).toFixed(0)}%)`);
}

main().catch(console.error);
