import { isPortrait, LANDSCAPE_W, LANDSCAPE_H, PORTRAIT_W, getGameHeight } from './orientation';

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

    badges: { x: 487, y: 532 - 67 / 2 - 15, direction: 'row' },

    topBar: { x: 15, y: 15 },
    coinDisplay: { x: LANDSCAPE_W - 49 - 21 - 10 - 102, y: 15 },
    settingsBtn: { x: LANDSCAPE_W - 49, y: 33 },

    leaderboard: { x: 15, y: LB_Y_BASE - 38 },
    questPanel:  { x: LANDSCAPE_QUEST_X, y: LB_Y_BASE - 20 },
    bonusPanel:  { x: LANDSCAPE_BONUS_X, y: 0 },

    collectionBtn: { x: 15, y: LANDSCAPE_H - 93 - 15 },
    nestsBtn:      { x: 15 + 118 + 11, y: LANDSCAPE_H - 93 - 15 },
    shopBtn:       { x: LANDSCAPE_W - 118 - 15, y: LANDSCAPE_H - 93 - 15 },
    dailyBonusBtn: { x: LANDSCAPE_W - 118 - 15 - 118 - 11, y: LANDSCAPE_H - 93 - 15 },

    thoughtRight: { x: 658, y: 110 },
    thoughtLeft:  { x: 380, y: 110 },

    bottomBar: null,
};

// ─── PORTRAIT (dynamic height to fill 100% of screen) ──────

const P_BOTTOM_BAR_H = 73;

function buildPortrait(): MainLayout {
    const gh = getGameHeight();
    const btnRowY = gh - 109;
    const rollY = gh - 131;
    const bottomBarY = gh - P_BOTTOM_BAR_H;
    const bonusY = gh - 228;

    return {
        gw: PORTRAIT_W,
        gh,
        cx: PORTRAIT_W / 2,
        cy: gh / 2,

        pedestal: {
            first:  { x: 293, y: 552, scale: 0.68 },
            second: { x: 157, y: 610, scale: 0.55 },
            third:  { x: 424, y: 639, scale: 0.49 },
        },

        rollBtn: { x: 290, y: rollY, w: 200, h: 140, texture: 'ui_roll_portrait', fontSize: '35px' },
        autoroll: {
            x: 290,
            y: rollY - 140 / 2 - 7 - 61 / 2,
            w: 99,
            h: 61,
        },
        arrowY: rollY - 140 / 2 - 50,

        badges: { x: 39, y: 670, direction: 'column' },

        topBar: { x: 50, y: 15 },
        coinDisplay: { x: 383, y: 13 },
        settingsBtn: { x: 531, y: 28 },

        leaderboard: { x: 41, y: 70 },
        questPanel:  { x: PORTRAIT_W - 135 - 15, y: 86 },
        bonusPanel:  { x: PORTRAIT_W - 150 - 15, y: bonusY },

        collectionBtn: { x: 15, y: btnRowY },
        nestsBtn:      { x: 144, y: btnRowY },
        shopBtn:       { x: 440, y: btnRowY },
        dailyBonusBtn: { x: 340, y: btnRowY },

        thoughtRight: { x: 400, y: 370 },
        thoughtLeft:  { x: 180, y: 370 },

        bottomBar: { visible: true, y: bottomBarY, h: P_BOTTOM_BAR_H },
    };
}

export function getLayout(): MainLayout {
    return isPortrait() ? buildPortrait() : LANDSCAPE;
}
