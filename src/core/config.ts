import { Grade, GradeConfig } from '../types';

export const GAME_WIDTH = 836;
export const GAME_HEIGHT = 470;

export const XP_BASE = 100;
export const XP_MULTIPLIER = 1.15;

export const GRADE_ORDER: Grade[] = [
    'common', 'uncommon', 'improved', 'rare', 'valuable',
    'elite', 'epic', 'heroic', 'mythic', 'ancient', 'legendary',
];

export const GRADE: Record<string, GradeConfig> = {
    common: {
        color: 0x9e9e9e, colorHex: '#9e9e9e',
        outlineColor: 0x323232, outlineHex: '#323232',
        strokeThickness: 0, label: 'Common',
        xpNewPercent: 25, xpDupPercent: 0.5,
        minChance: 2, maxChance: 100,
    },
    uncommon: {
        color: 0x88cc55, colorHex: '#88cc55',
        outlineColor: 0x2d4b1b, outlineHex: '#2d4b1b',
        strokeThickness: 2, label: 'Uncommon',
        xpNewPercent: 25, xpDupPercent: 1,
        minChance: 100, maxChance: 1_000,
    },
    improved: {
        color: 0x2d8a2d, colorHex: '#2d8a2d',
        outlineColor: 0x1a4a1a, outlineHex: '#1a4a1a',
        strokeThickness: 2, label: 'Improved',
        xpNewPercent: 25, xpDupPercent: 1.5,
        minChance: 1_000, maxChance: 5_000,
    },
    rare: {
        color: 0x42c9c9, colorHex: '#42c9c9',
        outlineColor: 0x1d414b, outlineHex: '#1d414b',
        strokeThickness: 2, label: 'Rare',
        xpNewPercent: 25, xpDupPercent: 2,
        minChance: 5_000, maxChance: 50_000,
    },
    valuable: {
        color: 0x5dade2, colorHex: '#5dade2',
        outlineColor: 0x1a3d5c, outlineHex: '#1a3d5c',
        strokeThickness: 2, label: 'Valuable',
        xpNewPercent: 25, xpDupPercent: 3,
        minChance: 50_000, maxChance: 500_000,
    },
    elite: {
        color: 0xa08cda, colorHex: '#a08cda',
        outlineColor: 0x3a2e5c, outlineHex: '#3a2e5c',
        strokeThickness: 2, label: 'Elite',
        xpNewPercent: 25, xpDupPercent: 4,
        minChance: 500_000, maxChance: 5_000_000,
    },
    epic: {
        color: 0xb060d0, colorHex: '#b060d0',
        outlineColor: 0x461a49, outlineHex: '#461a49',
        strokeThickness: 2, label: 'Epic',
        xpNewPercent: 25, xpDupPercent: 5,
        minChance: 5_000_000, maxChance: 50_000_000,
    },
    heroic: {
        color: 0xe880a0, colorHex: '#e880a0',
        outlineColor: 0x5c1a2e, outlineHex: '#5c1a2e',
        strokeThickness: 2, label: 'Heroic',
        xpNewPercent: 25, xpDupPercent: 6,
        minChance: 50_000_000, maxChance: 250_000_000,
    },
    mythic: {
        color: 0xffd700, colorHex: '#ffd700',
        outlineColor: 0x5c4a00, outlineHex: '#5c4a00',
        strokeThickness: 2, label: 'Mythic',
        xpNewPercent: 25, xpDupPercent: 7,
        minChance: 250_000_000, maxChance: 500_000_000,
    },
    ancient: {
        color: 0xff8c00, colorHex: '#ff8c00',
        outlineColor: 0x5c3200, outlineHex: '#5c3200',
        strokeThickness: 2, label: 'Ancient',
        xpNewPercent: 25, xpDupPercent: 8,
        minChance: 500_000_000, maxChance: 750_000_000,
    },
    legendary: {
        color: 0xff3333, colorHex: '#ff3333',
        outlineColor: 0x5c1111, outlineHex: '#5c1111',
        strokeThickness: 2, label: 'Legendary',
        xpNewPercent: 25, xpDupPercent: 10,
        minChance: 750_000_000, maxChance: 1_000_000_000,
    },
};

export function getGradeForChance(chance: number): Grade {
    for (let i = GRADE_ORDER.length - 1; i >= 0; i--) {
        if (chance >= GRADE[GRADE_ORDER[i]].minChance) return GRADE_ORDER[i];
    }
    return 'common';
}

// UI Style constants (PETS GO inspired)
export const UI = {
    PRIMARY_GREEN: 0x00b06f,
    PRIMARY_GREEN_DARK: 0x008a57,
    PRIMARY_GREEN_HEX: '#00b06f',
    ACCENT_ORANGE: 0xff9d43,
    ACCENT_ORANGE_HEX: '#ff9d43',
    PANEL_BG: 0x1e1e32,
    PANEL_BG_ALPHA: 0.85,
    PANEL_BORDER: 0x3a3a5c,
    FONT_MAIN: 'Arial Black',
    FONT_BODY: 'Arial',
    STROKE_THICK: 4,
    STROKE_MEDIUM: 3,
    STROKE_THIN: 2,
    CORNER_RADIUS: 12,
};

// Pedestal positions (match bg_1.jpg layout)
export const PEDESTAL = {
    first:  { x: 421, y: 233, scale: 0.55 },
    second: { x: 268, y: 270, scale: 0.45 },
    third:  { x: 570, y: 291, scale: 0.40 },
};

export const PET_OFFSET_Y = 0;

export const ROLL_BTN = { x: 418, y: 435, width: 340, height: 55 };

export const BUFF_CONFIG = {
    lucky:    { multiplier: 2, rollsPerAd: 1, color: 0x27ae60, colorHex: '#27ae60' },
    super:    { multiplier: 3, rollsPerAd: 1, offerCooldown: 15_000, offerDuration: 15_000, color: 0x3498db, colorHex: '#3498db' },
    epic:     { multiplier: 5, timer: 30_000, maxStack: 10, color: 0xffc107, colorHex: '#ffc107' },
    autoroll: { duration: 30_000, color: 0xff9d43, colorHex: '#ff9d43' },
} as const;

export const LEFT_PANEL = { x: 12, w: 155 };

export const BONUS_PANEL = {
    x: GAME_WIDTH - 143 - 12, y: 0,
    w: 143, iconSize: 56, padding: 5,
    gap: 7,
};

export const AUTOROLL_INTERVAL = 500;

export const ONBOARDING = {
    arrowY: ROLL_BTN.y - 75,
    arrowScale: 0.12,
    bobDistance: 18,
    bobDuration: 600,
    idleTimeout: 10_000,
};

/** Level thresholds where egg + background visuals change (17 tiers) */
export const VISUAL_TIERS = [
    1, 6, 12, 18, 25, 36, 52, 72, 102, 144, 205, 282, 385, 513, 718, 1026, 1538,
];

/** Get visual tier index (1-based) for a given player level */
export function getVisualTier(level: number): number {
    for (let i = VISUAL_TIERS.length - 1; i >= 0; i--) {
        if (level >= VISUAL_TIERS[i]) return i + 1;
    }
    return 1;
}

export function xpForLevel(level: number): number {
    return Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, level - 1));
}

/** Convert pet chance (X from "1 in X") to display string */
export function getOddsString(chance: number): string {
    if (chance >= 1_000_000_000) return `1/${(chance / 1_000_000_000).toFixed(1)}B`;
    if (chance >= 1_000_000) return `1/${(chance / 1_000_000).toFixed(1)}M`;
    if (chance >= 1_000) return `1/${(chance / 1_000).toFixed(1)}K`;
    return `1/${chance}`;
}
