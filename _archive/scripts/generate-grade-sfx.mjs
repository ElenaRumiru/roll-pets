/**
 * Generate grade-specific jackpot escalation SFX from a success jingle.
 * Overlays applause on higher grades (Elite+).
 *
 * Usage:  node scripts/generate-grade-sfx.mjs
 * Requires: ffmpeg-static (npm install --save-dev ffmpeg-static)
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, unlinkSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// --------------- TUNABLE CONSTANTS ---------------
const SHORT_CLIP_SEC = 0.50;    // Duration for "short" note clip
const FADE_OUT_MS    = 50;      // Fade-out on short clips (ms)
const CROSSFADE_SEC  = 0.03;    // 30ms crossfade between clips
const MP3_BITRATE    = '192k';
const SAMPLE_RATE    = 48000;

// Applause settings
const QUIET_APPLAUSE_VOL = -6;  // dB for quiet applause
const LOUD_APPLAUSE_VOL  = -3;  // dB for loud applause (louder, relay after quiet)
const QUIET_OVERLAP      = 4.0; // seconds — quiet starts this much before arpeggio ends
const LOUD_OVERLAP       = 3.0; // seconds — loud starts this much before arpeggio ends (peak during last note)
const APPLAUSE_FADE_IN   = 0.3; // seconds fade-in for applause
const APPLAUSE_FADE_OUT  = 0.5; // seconds fade-out at end
const QUIET_APPLAUSE_DUR = 3.53; // hardcoded duration (getDuration fails on paths with spaces)
const LOUD_APPLAUSE_DUR  = 4.22;
const TAIL_EXTRA         = 0.5; // extra padding after last applause ends
// -------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const FFMPEG = require('ffmpeg-static');

const SOURCE        = 'C:\\Users\\ilyar\\Downloads\\freesound_community-success-1-6297.mp3';
const APPLAUSE_QUIET = 'C:\\Users\\ilyar\\Downloads\\CRWDApls-Sound_of_an_audience-Elevenlabs (mp3cut.net).mp3';
const APPLAUSE_LOUD  = 'C:\\Users\\ilyar\\Downloads\\CRWDApls-Sound_of_an_audience-Elevenlabs (mp3cut.net) (1).mp3';

const PARTS_DIR = resolve(__dirname, 'sfx-parts');
const OUT_DIR   = resolve(__dirname, '..', 'public', 'assets', 'audio');
const TEMP_DIR  = resolve(__dirname, 'sfx-parts', '_tmp');

// Common uses old sfx_reveal. Uncommon starts at G (BGM key), ascending.
const NOTES = [
    { name: 'G',  semi:  0, grade: 'uncommon'  },
    { name: 'Gs', semi:  1, grade: 'improved'  },
    { name: 'A',  semi:  2, grade: 'rare'      },
    { name: 'As', semi:  3, grade: 'valuable'  },
    { name: 'B',  semi:  4, grade: 'elite'     },  // quiet applause starts
    { name: 'C',  semi:  5, grade: 'epic'      },  // quiet applause
    { name: 'Cs', semi:  6, grade: 'heroic'    },  // + loud applause
    { name: 'D',  semi:  7, grade: 'mythic'    },
    { name: 'Ds', semi:  8, grade: 'ancient'   },
    { name: 'E',  semi:  9, grade: 'legendary' },
];

// Applause config per grade
const APPLAUSE_MAP = {
    elite:     { quiet: true, loud: false },
    epic:      { quiet: true, loud: false },
    heroic:    { quiet: true, loud: true },
    mythic:    { quiet: true, loud: true },
    ancient:   { quiet: true, loud: true },
    legendary: { quiet: true, loud: true },
};

const GRADES = NOTES;

function ff(...args) {
    execFileSync(FFMPEG, args, { stdio: 'pipe' });
}

function detectMeanDb(filePath) {
    const result = spawnSync(FFMPEG,
        ['-i', filePath, '-af', 'volumedetect', '-f', 'null', 'NUL'],
        { encoding: 'utf8' });
    const match = result.stderr.match(/mean_volume:\s*([-\d.]+)\s*dB/);
    return match ? parseFloat(match[1]) : -20;
}

/** Get duration of an audio file in seconds */
function getDuration(filePath) {
    const result = spawnSync(FFMPEG, ['-i', filePath, '-hide_banner'], { encoding: 'utf8' });
    const match = result.stderr.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    if (!match) return 0;
    return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
}

function ensureDir(dir) { mkdirSync(dir, { recursive: true }); }

function cleanTmp() {
    if (existsSync(TEMP_DIR)) {
        for (const f of readdirSync(TEMP_DIR)) unlinkSync(resolve(TEMP_DIR, f));
    }
}

// --------------- STAGE 1: Prepare + Pitch Shift ---------------
function prepareSource() {
    const out = resolve(PARTS_DIR, '_clean.wav');
    console.log('  Converting source to 48kHz WAV...');
    ff('-y', '-i', SOURCE, '-af', `aresample=${SAMPLE_RATE}`, out);
    return out;
}

function pitchShift(cleanWav, note) {
    const fullOut  = resolve(PARTS_DIR, `note_${note.name}_full.wav`);
    const shortOut = resolve(PARTS_DIR, `note_${note.name}_short.wav`);
    const semi = note.semi;

    const newRate = Math.round(SAMPLE_RATE * Math.pow(2, semi / 12));
    const pitchFilter = semi === 0 ? 'anull' : `asetrate=${newRate},aresample=${SAMPLE_RATE}`;

    ff('-y', '-i', cleanWav, '-af', pitchFilter, fullOut);

    const fadeOutSec = FADE_OUT_MS / 1000;
    const fadeStart = Math.max(0, SHORT_CLIP_SEC - fadeOutSec);
    ff('-y', '-i', cleanWav,
       '-af', `${pitchFilter},atrim=end=${SHORT_CLIP_SEC},afade=t=out:st=${fadeStart}:d=${fadeOutSec}`,
       shortOut);
}

// --------------- STAGE 2: Compose ---------------
const MASTER_CHAIN = [
    'treble=gain=3:frequency=3000',
    'volume=8dB',
    'alimiter=limit=0.95:attack=1:release=10',
].join(',');

/** Compose the arpeggio chain into a WAV (before applause mixing) */
function composeToWav(gradeIndex) {
    const noteCount = gradeIndex + 1;
    const outWav = resolve(TEMP_DIR, `grade_${gradeIndex}.wav`);

    if (noteCount === 1) {
        const fullWav = resolve(PARTS_DIR, `note_${GRADES[0].name}_full.wav`);
        ff('-y', '-i', fullWav, outWav);
        return outWav;
    }

    const inputs = [];
    for (let i = 0; i < noteCount - 1; i++) {
        inputs.push(resolve(PARTS_DIR, `note_${GRADES[i].name}_short.wav`));
    }
    inputs.push(resolve(PARTS_DIR, `note_${GRADES[noteCount - 1].name}_full.wav`));

    let current = inputs[0];
    for (let i = 1; i < inputs.length; i++) {
        const tmpOut = resolve(TEMP_DIR, `chain_${gradeIndex}_${i}.wav`);
        ff('-y', '-i', current, '-i', inputs[i],
           '-filter_complex', `[0][1]acrossfade=d=${CROSSFADE_SEC}:c1=tri:c2=tri`,
           tmpOut);
        current = tmpOut;
    }

    // Copy to clean name
    ff('-y', '-i', current, outWav);
    return outWav;
}

/** Mix applause layer(s) onto grade WAV, then apply master chain → MP3 */
function mixAndEncode(gradeWav, grade, outMp3) {
    const applause = APPLAUSE_MAP[grade];
    if (!applause) {
        ff('-y', '-i', gradeWav, '-af', MASTER_CHAIN, '-b:a', MP3_BITRATE, outMp3);
        return;
    }

    const arpeggioLen = getDuration(gradeWav);
    console.log(`    arpeggio: ${arpeggioLen.toFixed(2)}s`);

    // Quiet applause: starts QUIET_OVERLAP before arpeggio ends
    const quietStartSec = Math.max(0, arpeggioLen - QUIET_OVERLAP);
    const quietDelayMs = Math.round(quietStartSec * 1000);
    const quietEndSec = quietStartSec + QUIET_APPLAUSE_DUR;

    // Loud applause: starts LOUD_OVERLAP before arpeggio ends (peak during last note)
    const loudStartSec = Math.max(0, arpeggioLen - LOUD_OVERLAP);
    const loudDelayMs = Math.round(loudStartSec * 1000);
    const loudEndSec = loudStartSec + LOUD_APPLAUSE_DUR;

    // Pad main stream so applause can trail after arpeggio
    const lastEnd = applause.loud ? loudEndSec : quietEndSec;
    const padMs = Math.max(0, Math.round((lastEnd - arpeggioLen + TAIL_EXTRA) * 1000));

    // Build filter_complex
    const inputs = ['-i', gradeWav];
    const filters = [];
    const mixStreams = ['[main]'];
    let streamIdx = 1;

    filters.push(`[0]${MASTER_CHAIN},apad=pad_dur=${padMs}ms[main]`);

    if (applause.quiet) {
        inputs.push('-i', APPLAUSE_QUIET);
        const qFadeOut = Math.max(0, QUIET_APPLAUSE_DUR - APPLAUSE_FADE_OUT);
        filters.push(
            `[${streamIdx}]aresample=${SAMPLE_RATE},` +
            `afade=t=in:st=0:d=${APPLAUSE_FADE_IN},` +
            `afade=t=out:st=${qFadeOut.toFixed(3)}:d=${APPLAUSE_FADE_OUT},` +
            `volume=${QUIET_APPLAUSE_VOL}dB,` +
            `adelay=${quietDelayMs}|${quietDelayMs}[aq]`
        );
        mixStreams.push('[aq]');
        streamIdx++;
    }

    if (applause.loud) {
        inputs.push('-i', APPLAUSE_LOUD);
        const lFadeOut = Math.max(0, LOUD_APPLAUSE_DUR - APPLAUSE_FADE_OUT);
        filters.push(
            `[${streamIdx}]aresample=${SAMPLE_RATE},` +
            `afade=t=in:st=0:d=${APPLAUSE_FADE_IN},` +
            `afade=t=out:st=${lFadeOut.toFixed(3)}:d=${APPLAUSE_FADE_OUT},` +
            `volume=${LOUD_APPLAUSE_VOL}dB,` +
            `adelay=${loudDelayMs}|${loudDelayMs}[al]`
        );
        mixStreams.push('[al]');
        streamIdx++;
    }

    const mixCount = mixStreams.length;
    filters.push(`${mixStreams.join('')}amix=inputs=${mixCount}:duration=longest:normalize=0`);

    ff('-y', ...inputs, '-filter_complex', filters.join(';'), '-b:a', MP3_BITRATE, outMp3);
}

// --------------- MAIN ---------------
console.log('=== Grade SFX Generator ===\n');

if (!existsSync(SOURCE)) { console.error(`Source not found: ${SOURCE}`); process.exit(1); }
if (!existsSync(APPLAUSE_QUIET)) { console.error(`Quiet applause not found: ${APPLAUSE_QUIET}`); process.exit(1); }
if (!existsSync(APPLAUSE_LOUD)) { console.error(`Loud applause not found: ${APPLAUSE_LOUD}`); process.exit(1); }

ensureDir(PARTS_DIR);
ensureDir(TEMP_DIR);

console.log('Stage 1: Prepare source + pitch shift...');
const cleanWav = prepareSource();
for (const note of NOTES) {
    console.log(`  ${note.name} (${note.semi > 0 ? '+' : ''}${note.semi} semitones)...`);
    pitchShift(cleanWav, note);
}

console.log('\nStage 2: Compose + mix applause + encode...');
for (let i = 0; i < GRADES.length; i++) {
    const g = GRADES[i];
    const hasApplause = APPLAUSE_MAP[g.grade];
    const label = hasApplause
        ? `${g.grade} (${i + 1} note${i > 0 ? 's' : ''} + ${hasApplause.loud ? 'quiet+loud' : 'quiet'} applause)`
        : `${g.grade} (${i + 1} note${i > 0 ? 's' : ''})`;
    console.log(`  ${label}...`);

    cleanTmp();
    const gradeWav = composeToWav(i);
    const outMp3 = resolve(OUT_DIR, `sfx_grade_${g.grade}.mp3`);
    mixAndEncode(gradeWav, g.grade, outMp3);
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
console.log('\nDone!');
