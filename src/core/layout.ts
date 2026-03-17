import { isPortrait, LANDSCAPE_W, LANDSCAPE_H, PORTRAIT_W, PORTRAIT_H } from './orientation';

export interface PedestalPos { x: number; y: number; scale: number }

export interface MainLayout {
    /** Game dimensions */
    gw: number;
    gh: number;
    /** Center of game area */
    cx: number;
    cy: number;

    /** Pedestal positions */
    pedestal: { first: PedestalPos; second: PedestalPos; third: PedestalPos };

    /** Roll button */
    rollBtn: { x: number; y: number; w: number; h: number; texture: string; fontSize: string };
    /** Autoroll toggle */
    autoroll: { x: number; y: number; w: number; h: number };
    /** Arrow hint Y */
    arrowY: number;

    /** Buff badges */
    badges: { x: number; y: number; direction: 'row' | 'column' };

    /** TopBar / XP HUD */
    topBar: { x: number; y: number };
    /** CoinDisplay */
    coinDisplay: { x: number; y: number };
    /** SettingsButton */
    settingsBtn: { x: number; y: number };

    /** Leaderboard */
    leaderboard: { x: number; y: number };
    /** QuestPanel */
    questPanel: { x: number; y: number };
    /** BonusPanel */
    bonusPanel: { x: number; y: number };

    /** Bottom buttons */
    btnW: number;
    collectionBtn: { x: number; y: number };
    nestsBtn: { x: number; y: number };
    shopBtn: { x: number; y: number };
    dailyBonusBtn: { x: number; y: number };

    /** PetThought bubble positions */
    thoughtRight: { x: number; y: number };
    thoughtLeft: { x: number; y: number };

    /** Portrait-only bottom bar overlay */
    bottomBar: { visible: boolean; y: number; h: number } | null;
}

// ─── LANDSCAPE (fixed 16:9 = 1031×580) ──────────────────────

const LANDSCAPE_QUEST_X = LANDSCAPE_W - 135 - 15;
const LANDSCAPE_BONUS_X = LANDSCAPE_W - 150 - 15;
const LB_Y_BASE = Math.round((LANDSCAPE_H - 175) / 2) - 22 - 25;

const LANDSCAPE: MainLayout = {
    gw: LANDSCAPE_W,
    gh: LANDSCAPE_H,
    cx: LANDSCAPE_W / 2,
    cy: LANDSCAPE_H / 2,

    pedestal: {
        first:  { x: 519, y: 288, scale: 0.68 },
        second: { x: 330, y: 333, scale: 0.55 },
        third:  { x: 703, y: 357, scale: 0.49 },
    },

    rollBtn: { x: 487, y: 532, w: 305, h: 67, texture: 'ui_roll', fontSize: '30px' },
    autoroll: {
        x: 487 + 305 / 2 + 4 + 99 / 2,   // 641
        y: LANDSCAPE_H - 15 - 61 / 2,      // 534.5
        w: 99,
        h: 61,
    },
    arrowY: 532 - 67 / 2 - 50,

    badges: { x: 487, y: 532 - 67 / 2 - 18, direction: 'row' },

    topBar: { x: 15, y: 15 },
    coinDisplay: { x: LANDSCAPE_W - 49 - 21 - 10 - 102, y: 15 },
    settingsBtn: { x: LANDSCAPE_W - 49, y: 33 },

    leaderboard: { x: 15, y: LB_Y_BASE - 38 },
    questPanel:  { x: LANDSCAPE_QUEST_X, y: LB_Y_BASE - 20 },
    bonusPanel:  { x: LANDSCAPE_BONUS_X, y: 0 },

    btnW: 118,
    collectionBtn: { x: 15, y: LANDSCAPE_H - 93 - 15 },
    nestsBtn:      { x: 15 + 118 + 11, y: LANDSCAPE_H - 93 - 15 },
    shopBtn:       { x: LANDSCAPE_W - 118 - 15, y: LANDSCAPE_H - 93 - 15 },
    dailyBonusBtn: { x: LANDSCAPE_W - 118 - 15 - 118 - 11, y: LANDSCAPE_H - 93 - 15 },

    thoughtRight: { x: 658, y: 110 },
    thoughtLeft:  { x: 380, y: 110 },

    bottomBar: null,
};

// ─── PORTRAIT (fixed 9:16 = 580×1031) ───────────────────────

const P_BOTTOM_BAR_Y = 958;
const P_BOTTOM_BAR_H = 73;
const P_BTN_ROW_Y = 922;

const PORTRAIT: MainLayout = {
    gw: PORTRAIT_W,
    gh: PORTRAIT_H,
    cx: PORTRAIT_W / 2,
    cy: PORTRAIT_H / 2,

    pedestal: {
        first:  { x: 293, y: 595, scale: 0.64 },
        second: { x: 147, y: 634, scale: 0.52 },
        third:  { x: 432, y: 659, scale: 0.46 },
    },

    rollBtn: { x: 290, y: 969, w: 140, h: 140, texture: 'ui_roll_portrait', fontSize: '35px' },
    autoroll: {
        x: 290,
        y: 969 - 140 / 2 - 7 - 61 / 2 + 15,
        w: 99,
        h: 61,
    },
    arrowY: 969 - 140 / 2 - 50,

    badges: { x: 15, y: 740, direction: 'column' },

    topBar: { x: 24, y: 15 },
    coinDisplay: { x: 413, y: 15 },
    settingsBtn: { x: 545, y: 35 },

    leaderboard: { x: 15, y: 70 },
    questPanel:  { x: PORTRAIT_W - 135 - 15, y: 86 },
    bonusPanel:  { x: PORTRAIT_W - 150 - 15, y: 803 },

    btnW: 106,
    collectionBtn: { x: 1, y: 934 },
    nestsBtn:      { x: 111, y: 934 },
    shopBtn:       { x: 473, y: 934 },
    dailyBonusBtn: { x: 363, y: 934 },

    thoughtRight: { x: 400, y: 370 },
    thoughtLeft:  { x: 180, y: 370 },

    bottomBar: { visible: true, y: P_BOTTOM_BAR_Y, h: P_BOTTOM_BAR_H },
};

export function getLayout(): MainLayout {
    return isPortrait() ? PORTRAIT : LANDSCAPE;
}
