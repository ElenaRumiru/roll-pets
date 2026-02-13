import { Rarity, RarityConfig } from '../types';

export const GAME_WIDTH = 836;
export const GAME_HEIGHT = 470;

export const XP_BASE = 100;
export const XP_MULTIPLIER = 1.15;

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const RARITY: Record<Rarity, RarityConfig> = {
    common: {
        baseWeight: 60,
        color: 0x9e9e9e,
        colorHex: '#9e9e9e',
        outlineColor: 0x323232,
        outlineHex: '#323232',
        label: 'Common',
        xpNewPercent: 25,
        xpDupPercent: 1,
        luckBonus: 0,
    },
    uncommon: {
        baseWeight: 25,
        color: 0x71ff3e,
        colorHex: '#71ff3e',
        outlineColor: 0x2d4b1b,
        outlineHex: '#2d4b1b',
        label: 'Uncommon',
        xpNewPercent: 25,
        xpDupPercent: 2,
        luckBonus: 0.2,
    },
    rare: {
        baseWeight: 10,
        color: 0x42a5f5,
        colorHex: '#42a5f5',
        outlineColor: 0x1d414b,
        outlineHex: '#1d414b',
        label: 'Rare',
        xpNewPercent: 25,
        xpDupPercent: 3,
        luckBonus: 0.15,
    },
    epic: {
        baseWeight: 4,
        color: 0xce93d8,
        colorHex: '#ce93d8',
        outlineColor: 0x461a49,
        outlineHex: '#461a49',
        label: 'Epic',
        xpNewPercent: 25,
        xpDupPercent: 5,
        luckBonus: 0.1,
    },
    legendary: {
        baseWeight: 1,
        color: 0xffc107,
        colorHex: '#ffc107',
        outlineColor: 0x493719,
        outlineHex: '#493719',
        label: 'Legendary',
        xpNewPercent: 25,
        xpDupPercent: 10,
        luckBonus: 0.05,
    },
};

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
    first:  { x: 425, y: 250, scale: 0.55 },  // center, tallest
    second: { x: 262, y: 278, scale: 0.45 },  // left, medium
    third:  { x: 570, y: 303, scale: 0.40 },  // right, shortest
};

export const PET_OFFSET_Y = -55;

export const ROLL_BTN = { x: 418, y: 435, width: 340, height: 55 };

export const BUFF_DURATIONS = {
    x2xp: 180_000,
    autoroll: 60_000,
    luck: 120_000,
};

export const AUTOROLL_INTERVAL = 1500;

export function xpForLevel(level: number): number {
    return Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, level - 1));
}

/** Convert rarity weight to "1kX" odds string at given level */
export function getOddsString(rarity: Rarity, level: number, luckBuff: boolean): string {
    const weights: Record<Rarity, number> = {} as any;
    let total = 0;
    for (const r of RARITY_ORDER) {
        const cfg = RARITY[r];
        const bonus = luckBuff ? 5 : 0;
        weights[r] = cfg.baseWeight + (level * cfg.luckBonus) + (r !== 'common' ? bonus : 0);
        total += weights[r];
    }
    const prob = weights[rarity] / total;
    if (prob >= 1) return '1k1';
    const oneIn = Math.round(1 / prob);
    if (oneIn >= 1_000_000) return `1k${(oneIn / 1_000_000).toFixed(1)}M`;
    if (oneIn >= 1_000) return `1k${(oneIn / 1_000).toFixed(1)}K`;
    return `1k${oneIn}`;
}
