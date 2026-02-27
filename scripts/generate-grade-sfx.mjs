/**
 * Generate grade-specific jackpot escalation SFX from a G major arpeggio WAV.
 *
 * Usage:  node scripts/generate-grade-sfx.mjs
 * Requires: ffmpeg-static (npm install --save-dev ffmpeg-static)
 *
 * Output:
 *   public/assets/audio/sfx_grade_<grade>.mp3   (11 files, shipped)
 *   scripts/sfx-parts/note_<Note>_full.wav       (12 files, for polishing)
 *   scripts/sfx-parts/note_<Note>_short.wav      (12 files, for polishing)
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, unlinkSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// --------------- TUNABLE CONSTANTS ---------------
const TRIM_START_SEC = 2.50;    // Where actual arpeggio starts (after silence)
const SHORT_CLIP_SEC = 0.50;    // Duration for "short" note clip
const FADE_OUT_MS    = 50;      // Fade-out on short clips (ms)
const CROSSFADE_SEC  = 0.03;    // 30ms crossfade between clips
const MP3_BITRATE    = '192k';
// -------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const FFMPEG = require('ffmpeg-static');

const SOURCE_WAV = 'C:\\Users\\ilyar\\Downloads\\G_major,_Gmajor,_fan_#3-1772142117009.wav';
const PARTS_DIR  = resolve(__dirname, 'sfx-parts');
const OUT_DIR    = resolve(__dirname, '..', 'public', 'assets', 'audio');
const TEMP_DIR   = resolve(__dirname, 'sfx-parts', '_tmp');

// Common uses old sfx_reveal (no generated file). Uncommon starts at G (BGM key), ascending.
const NOTES = [
    { name: 'G',  semi:  0, grade: 'uncommon'   },
    { name: 'Gs', semi:  1, grade: 'improved'   },
    { name: 'A',  semi:  2, grade: 'rare'       },
    { name: 'As', semi:  3, grade: 'valuable'   },
    { name: 'B',  semi:  4, grade: 'elite'      },
    { name: 'C',  semi:  5, grade: 'epic'       },
    { name: 'Cs', semi:  6, grade: 'heroic'     },
    { name: 'D',  semi:  7, grade: 'mythic'     },
    { name: 'Ds', semi:  8, grade: 'ancient'    },
    { name: 'E',  semi:  9, grade: 'legendary'  },
];

const GRADES = NOTES;

function ff(...args) {
    execFileSync(FFMPEG, args, { stdio: 'pipe' });
}

/** Detect mean volume of an audio file, returns dB value */
function detectMeanDb(filePath) {
    const result = spawnSync(FFMPEG,
        ['-i', filePath, '-af', 'volumedetect', '-f', 'null', '-'],
        { encoding: 'utf8' });
    const match = result.stderr.match(/mean_volume:\s*([-\d.]+)\s*dB/);
    return match ? parseFloat(match[1]) : -20;
}

function ensureDir(dir) {
    mkdirSync(dir, { recursive: true });
}

function cleanTmp() {
    if (existsSync(TEMP_DIR)) {
        for (const f of readdirSync(TEMP_DIR)) unlinkSync(resolve(TEMP_DIR, f));
    }
}

// --------------- STAGE 1: Trim + Pitch Shift ---------------
function trimSource() {
    const out = resolve(PARTS_DIR, '_clean.wav');
    console.log('  Trimming source...');
    ff('-y', '-i', SOURCE_WAV,
       '-af', `atrim=start=${TRIM_START_SEC},asetpts=N/SR/TB`,
       out);
    return out;
}

function pitchShift(cleanWav, note) {
    const fullOut  = resolve(PARTS_DIR, `note_${note.name}_full.wav`);
    const shortOut = resolve(PARTS_DIR, `note_${note.name}_short.wav`);
    const semi = note.semi;

    // Pure resampling pitch shift — no time-stretching, preserves full clarity.
    const newRate = Math.round(48000 * Math.pow(2, semi / 12));
    const pitchFilter = semi === 0
        ? 'anull'
        : `asetrate=${newRate},aresample=48000`;

    // Full variant
    ff('-y', '-i', cleanWav, '-af', pitchFilter, fullOut);

    // Short variant (with fade-out)
    const fadeOutSec = FADE_OUT_MS / 1000;
    const fadeStart = Math.max(0, SHORT_CLIP_SEC - fadeOutSec);
    ff('-y', '-i', cleanWav,
       '-af', `${pitchFilter},atrim=end=${SHORT_CLIP_SEC},afade=t=out:st=${fadeStart}:d=${fadeOutSec}`,
       shortOut);
}

// --------------- STAGE 2: Compose Grade Sounds ---------------

/** Master chain: boost loudness to match sfx_wobble (-5.7 dB mean), preserve natural sound */
const MASTER_CHAIN = [
    'treble=gain=3:frequency=3000',                     // +3dB brightness above 3kHz
    'volume=12dB',                                      // aggressive boost to match game SFX levels
    'alimiter=limit=0.95:attack=1:release=10',          // brick-wall limiter to prevent clipping
].join(',');

function composeGrade(gradeIndex) {
    const grade = GRADES[gradeIndex];
    const noteCount = gradeIndex + 1;
    const outMp3 = resolve(OUT_DIR, `sfx_grade_${grade.grade}.mp3`);

    if (noteCount === 1) {
        const fullWav = resolve(PARTS_DIR, `note_${GRADES[0].name}_full.wav`);
        ff('-y', '-i', fullWav, '-af', MASTER_CHAIN, '-b:a', MP3_BITRATE, outMp3);
        return;
    }

    // Multiple notes: concatenate shorts + final full with crossfades
    ensureDir(TEMP_DIR);
    cleanTmp();

    const inputs = [];
    for (let i = 0; i < noteCount - 1; i++) {
        inputs.push(resolve(PARTS_DIR, `note_${GRADES[i].name}_short.wav`));
    }
    inputs.push(resolve(PARTS_DIR, `note_${GRADES[noteCount - 1].name}_full.wav`));

    // Chain acrossfade iteratively
    let current = inputs[0];
    for (let i = 1; i < inputs.length; i++) {
        const tmpOut = resolve(TEMP_DIR, `chain_${i}.wav`);
        ff('-y', '-i', current, '-i', inputs[i],
           '-filter_complex',
           `[0][1]acrossfade=d=${CROSSFADE_SEC}:c1=tri:c2=tri`,
           tmpOut);
        current = tmpOut;
    }

    // Apply master chain + encode
    ff('-y', '-i', current, '-af', MASTER_CHAIN, '-b:a', MP3_BITRATE, outMp3);
    cleanTmp();
}

// --------------- MAIN ---------------
console.log('=== Grade SFX Generator ===\n');

if (!existsSync(SOURCE_WAV)) {
    console.error(`Source file not found: ${SOURCE_WAV}`);
    process.exit(1);
}

ensureDir(PARTS_DIR);
ensureDir(TEMP_DIR);

console.log('Stage 1: Trim + pitch shift...');
const cleanWav = trimSource();
for (const note of NOTES) {
    console.log(`  ${note.name} (${note.semi > 0 ? '+' : ''}${note.semi} semitones)...`);
    pitchShift(cleanWav, note);
}

console.log('\nStage 2: Compose grade sounds (dynaudnorm + treble + limiter)...');
for (let i = 0; i < GRADES.length; i++) {
    console.log(`  ${GRADES[i].grade} (${i + 1} note${i > 0 ? 's' : ''})...`);
    composeGrade(i);
}

// Cleanup
cleanTmp();
try { unlinkSync(resolve(PARTS_DIR, '_clean.wav')); } catch { /* ok */ }

// Report
console.log('\n=== Output Files ===');
let totalBytes = 0;
for (const g of GRADES) {
    const p = resolve(OUT_DIR, `sfx_grade_${g.grade}.mp3`);
    if (existsSync(p)) {
        const sz = statSync(p).size;
        totalBytes += sz;
        const mean = detectMeanDb(p);
        console.log(`  ${`sfx_grade_${g.grade}.mp3`.padEnd(30)} ${(sz / 1024).toFixed(1).padStart(6)} KB  mean: ${mean.toFixed(1)} dB`);
    }
}
console.log(`  ${'TOTAL'.padEnd(30)} ${(totalBytes / 1024).toFixed(1).padStart(6)} KB`);
console.log(`\nReference: sfx_wobble mean = -5.7 dB, sfx_reveal mean = -21.9 dB`);
console.log('Done!');
