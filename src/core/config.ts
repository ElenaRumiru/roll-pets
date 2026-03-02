import { Grade, GradeConfig, QuestState, DailyBonusState, DailyBonusReward, NestState } from '../types';

export const GAME_WIDTH = 1031;
export const GAME_HEIGHT = 580;

export const XP_PER_ROLL = 5;
/** Minimum XP for any level (~4 rolls) */
export const XP_FLOOR = 20;
/** XP range above floor (max = FLOOR + SCALE = 1050 → ~210 rolls) */
export const XP_SCALE = 1030;
/** Level at which curve reaches midpoint */
export const XP_KNEE = 20;

export const GRADE_ORDER: Grade[] = [
    'common', 'uncommon', 'improved', 'rare', 'valuable',
    'elite', 'epic', 'heroic', 'mythic', 'ancient', 'legendary',
];

// Hold time (ms) before reveal fades out (250ms fade). Matched to SFX duration per grade.
export const GRADE_HOLD_MS: Record<string, number> = {
    common:    1100,
    uncommon:  2000,
    improved:  3400,
    rare:      3700,
    valuable:  4000,
    elite:     4350,
    epic:      4700,
    heroic:    6700,
    mythic:    7050,
    ancient:   7400,
    legendary: 7750,
};

export const GRADE: Record<string, GradeConfig> = {
    common: {
        color: 0x9e9e9e, colorHex: '#9e9e9e',
        outlineColor: 0x323232, outlineHex: '#323232',
        strokeThickness: 0, label: 'Common',
        minChance: 2, maxChance: 100,
    },
    uncommon: {
        color: 0x88cc55, colorHex: '#88cc55',
        outlineColor: 0x2d4b1b, outlineHex: '#2d4b1b',
        strokeThickness: 2, label: 'Uncommon',
        minChance: 100, maxChance: 1_000,
    },
    improved: {
        color: 0x2d8a2d, colorHex: '#2d8a2d',
        outlineColor: 0x1a4a1a, outlineHex: '#1a4a1a',
        strokeThickness: 2, label: 'Extra',
        minChance: 1_000, maxChance: 5_000,
    },
    rare: {
        color: 0x42c9c9, colorHex: '#42c9c9',
        outlineColor: 0x1d414b, outlineHex: '#1d414b',
        strokeThickness: 2, label: 'Rare',
        minChance: 5_000, maxChance: 50_000,
    },
    valuable: {
        color: 0x5dade2, colorHex: '#5dade2',
        outlineColor: 0x1a3d5c, outlineHex: '#1a3d5c',
        strokeThickness: 2, label: 'Superior',
        minChance: 50_000, maxChance: 500_000,
    },
    elite: {
        color: 0xa08cda, colorHex: '#a08cda',
        outlineColor: 0x3a2e5c, outlineHex: '#3a2e5c',
        strokeThickness: 2, label: 'Elite',
        minChance: 500_000, maxChance: 5_000_000,
    },
    epic: {
        color: 0xb060d0, colorHex: '#b060d0',
        outlineColor: 0x461a49, outlineHex: '#461a49',
        strokeThickness: 2, label: 'Epic',
        minChance: 5_000_000, maxChance: 50_000_000,
    },
    heroic: {
        color: 0xe880a0, colorHex: '#e880a0',
        outlineColor: 0x5c1a2e, outlineHex: '#5c1a2e',
        strokeThickness: 2, label: 'Heroic',
        minChance: 50_000_000, maxChance: 250_000_000,
    },
    mythic: {
        color: 0xffd700, colorHex: '#ffd700',
        outlineColor: 0x5c4a00, outlineHex: '#5c4a00',
        strokeThickness: 2, label: 'Mythic',
        minChance: 250_000_000, maxChance: 500_000_000,
    },
    ancient: {
        color: 0xff8c00, colorHex: '#ff8c00',
        outlineColor: 0x5c3200, outlineHex: '#5c3200',
        strokeThickness: 2, label: 'Ancient',
        minChance: 500_000_000, maxChance: 750_000_000,
    },
    legendary: {
        color: 0xff3333, colorHex: '#ff3333',
        outlineColor: 0x5c1111, outlineHex: '#5c1111',
        strokeThickness: 2, label: 'Legendary',
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
    FONT_MAIN: 'Rubik Black',
    FONT_STROKE: 'Rubik',
    FONT_BODY: 'Rubik Light',
    STROKE_THICK: 4,
    STROKE_MEDIUM: 3,
    STROKE_THIN: 2,
    CORNER_RADIUS: 15,
};

// Pedestal positions (match bg_1.jpg layout)
export const PEDESTAL = {
    first:  { x: 519, y: 288, scale: 0.68 },
    second: { x: 330, y: 333, scale: 0.55 },
    third:  { x: 703, y: 357, scale: 0.49 },
};

export const PET_OFFSET_Y = 8;

export const ROLL_BTN = { x: 487, y: 532, width: 305, height: 67 };
export const AUTOROLL_TOGGLE = { width: 99, height: 61, gap: 7, unlockLevel: 3 };

export const BUFF_CONFIG = {
    lucky:    { multiplier: 2, rollsPerAd: 25, color: 0x78C828, colorHex: '#78C828' },
    super:    { multiplier: 3, rollsPerAd: 12, color: 0x3498db, colorHex: '#3498db' },
    epic:     { multiplier: 5, rollsPerAd: 5, color: 0xffc107, colorHex: '#ffc107' },
    autoroll: { color: 0xff9d43, colorHex: '#ff9d43' },
    offer:    { duration: 15_000, cooldown: 5_000 },
} as const;

export const LEFT_PANEL = { x: 15, w: 191 };

export const BONUS_PANEL = {
    x: GAME_WIDTH - 150 - 15, y: 0,
    w: 150, iconSize: 59, padding: 5,
    gap: 8,
};

export interface QuestStepReward {
    freeCount: number;
    adCount: number;
    buffType: 'lucky' | 'super' | 'epic';
}

export const QUEST_CONFIG = {
    rollSteps: [
        { target: 3,  freeCount: 3,  adCount: 5,   buffType: 'lucky' as const },
        { target: 5,  freeCount: 5,  adCount: 10,  buffType: 'lucky' as const },
        { target: 10, freeCount: 10, adCount: 20,  buffType: 'lucky' as const },
        { target: 20, freeCount: 25, adCount: 50,  buffType: 'lucky' as const },
        { target: 50, freeCount: 25, adCount: 50,  buffType: 'lucky' as const },
    ],
    gradeSteps: [
        { grade: 'uncommon' as Grade, target: 1, freeCount: 3,  adCount: 8,  buffType: 'super' as const },
        { grade: 'uncommon' as Grade, target: 2, freeCount: 5,  adCount: 12, buffType: 'super' as const },
        { grade: 'uncommon' as Grade, target: 3, freeCount: 5,  adCount: 12, buffType: 'super' as const },
        { grade: 'improved' as Grade, target: 1, freeCount: 8,  adCount: 20, buffType: 'super' as const },
        { grade: 'improved' as Grade, target: 2, freeCount: 10, adCount: 25, buffType: 'super' as const },
        { grade: 'improved' as Grade, target: 3, freeCount: 12, adCount: 30, buffType: 'super' as const },
    ],
    onlineSteps: [
        { target: 1,  freeCount: 3,  adCount: 6,   buffType: 'epic' as const },
        { target: 3,  freeCount: 5,  adCount: 10,  buffType: 'epic' as const },
        { target: 5,  freeCount: 8,  adCount: 15,  buffType: 'epic' as const },
        { target: 10, freeCount: 15, adCount: 30,  buffType: 'epic' as const },
        { target: 30, freeCount: 30, adCount: 60,  buffType: 'epic' as const },
        { target: 60, freeCount: 50, adCount: 100, buffType: 'epic' as const },
    ],
    milestonesAt: [3, 6, 9, 12, 15],
    milestoneRewards: [100, 500, 2_000, 5_000, 15_000],
};

export const QUEST_PANEL = { x: GAME_WIDTH - 135 - 15, w: 135 };

export function getDefaultQuestState(): QuestState {
    const d = new Date();
    const today = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return {
        lastResetDate: today,
        rollQuest: { current: 0, target: QUEST_CONFIG.rollSteps[0].target, sequenceIndex: 0 },
        gradeQuest: { current: 0, target: QUEST_CONFIG.gradeSteps[0].target, sequenceIndex: 0 },
        onlineQuest: { current: 0, target: QUEST_CONFIG.onlineSteps[0].target * 60, sequenceIndex: 0 },
        milestones: { completedCount: 0, claimedMilestones: [] },
    };
}

export const AUTOROLL_INTERVAL = 500;

export const ONBOARDING = {
    arrowY: ROLL_BTN.y - ROLL_BTN.height / 2 - 50,
    bobDistance: 22,
    bobDuration: 600,
    idleTimeout: 10_000,
};

/** Level thresholds where egg + background visuals change (17 tiers) */
export const VISUAL_TIERS = [
    1, 15, 35, 60, 90, 125, 170, 225, 290, 365, 450, 545, 640, 735, 830, 910, 975,
];

/** Get visual tier index (1-based) for a given player level */
export function getVisualTier(level: number): number {
    for (let i = VISUAL_TIERS.length - 1; i >= 0; i--) {
        if (level >= VISUAL_TIERS[i]) return i + 1;
    }
    return 1;
}

export function xpForLevel(level: number): number {
    const l2 = level * level;
    return Math.floor(XP_FLOOR + XP_SCALE * l2 / (l2 + XP_KNEE * XP_KNEE));
}

export function levelUpCoinReward(level: number): number {
    const l2 = level * level;
    return Math.round((5 + 495 * l2 / (l2 + 10000)) / 5) * 5;
}

export const LEVELUP_CONFIG = {
    adCoinMultiplier: 3,
    eggCloseSeconds: 5,
    coinAcceptSeconds: 10,
};

export const LEAGUE_PROMOTION_REWARDS: Record<string, number> = {
    silver: 500,
    gold: 5_000,
    diamond: 50_000,
    master: 500_000,
};

export const DAILY_BONUS_CONFIG = {
    weeklyRewards: [
        { type: 'buff' as const, buffType: 'lucky' as const, count: 5 },
        { type: 'buff' as const, buffType: 'super' as const, count: 3 },
        { type: 'buff' as const, buffType: 'lucky' as const, count: 10 },
        { type: 'coins' as const, count: 25 },
        { type: 'buff' as const, buffType: 'super' as const, count: 5 },
        { type: 'buff' as const, buffType: 'epic' as const, count: 3 },
        { type: 'buff' as const, buffType: 'epic' as const, count: 5 },
    ] as DailyBonusReward[],
    milestoneThresholds: [8, 15, 22, 30],
    milestoneRewards: [500, 2_000, 5_000, 10_000],
    monthCycleDays: 30,
};

export function getDefaultDailyBonusState(): DailyBonusState {
    return {
        totalLogins: 0,
        weekDay: 0,
        lastLoginDate: '',
        claimedToday: false,
        monthMilestonesClaimed: [false, false, false, false],
    };
}

export const REBIRTH_CONFIG = {
    triggerLevel: 1000,
    maxCount: 8,
    color: 0xd063f0,
    colorHex: '#d063f0',
} as const;

export const NEST_CONFIG = {
    maxSlots: 3,
    slotPrices: [0, 5_000, 50_000],
    incubationMs: 30_000,
    unlockLevel: 5,
} as const;

export function getDefaultNestState(): NestState {
    return {
        slots: [
            { unlocked: true,  eggTier: null, level: null, startTime: null, duration: NEST_CONFIG.incubationMs, boosted: false, buffMultiplier: 1 },
            { unlocked: false, eggTier: null, level: null, startTime: null, duration: NEST_CONFIG.incubationMs, boosted: false, buffMultiplier: 1 },
            { unlocked: false, eggTier: null, level: null, startTime: null, duration: NEST_CONFIG.incubationMs, boosted: false, buffMultiplier: 1 },
        ],
    };
}

export const COIN_HUD = { w: 102, h: 36, iconSize: 38, gap: 10 };
export const XP_HUD = { w: 192, h: 32, iconSize: 42 };

/** Convert pet chance (X from "1 in X") to display string */
export function getOddsString(chance: number): string {
    if (chance >= 1_000_000_000) return `1/${(chance / 1_000_000_000).toFixed(1)}B`;
    if (chance >= 1_000_000) return `1/${(chance / 1_000_000).toFixed(1)}M`;
    if (chance >= 1_000) return `1/${(chance / 1_000).toFixed(1)}K`;
    return `1/${chance}`;
}
