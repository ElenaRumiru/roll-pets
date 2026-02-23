import { GameObjects, Scene } from 'phaser';
import { UI, GAME_WIDTH, GAME_HEIGHT, QUEST_CONFIG, BUFF_CONFIG } from '../core/config';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { fitText } from './components/fitText';

const POPUP_W = 345;
const POPUP_H = 210;
const CARD_W = 136;
const CARD_H = 138;
const CARD_GAP = 20;
const CARD_R = 12;
const BTN_W = 111;
const BTN_H = 35;
const BTN_R = BTN_H / 2;
const BTN_SHADOW = 2;

const FREE_COLOR = 0x78C828;
const FREE_DARK = 0x4E8A18;
const AD_COLOR = 0x7B2FBE;
const AD_DARK = 0x4A1A72;

export class QuestClaimPopup {
    private container: GameObjects.Container;
    private destroyed = false;

    constructor(
        scene: Scene,
        questType: 'roll' | 'grade',
        onFree: () => void,
        onAd: () => void,
        private onDismiss?: () => void,
    ) {
        this.container = scene.add.container(0, 0).setDepth(1000);

        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const popLeft = cx - POPUP_W / 2;
        const popTop = cy - POPUP_H / 2;

        // Overlay — tap outside popup to dismiss
        const overlay = scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
        overlay.setInteractive();
        overlay.on('pointerdown', (p: Phaser.Input.Pointer) => {
            const lx = p.x, ly = p.y;
            if (lx < popLeft || lx > popLeft + POPUP_W || ly < popTop || ly > popTop + POPUP_H) {
                this.dismiss();
            }
        });
        this.container.add(overlay);

        // Popup background
        const popBg = scene.add.graphics();
        popBg.fillStyle(0x000000, 0.95);
        popBg.fillRoundedRect(popLeft, popTop, POPUP_W, POPUP_H, 14);
        this.container.add(popBg);

        // Title
        const titleY = popTop + 23;
        const title = scene.add.text(cx, titleY, t('quest_complete'), {
            fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.container.add(title);

        // Subtitle
        const subY = titleY + 21;
        const sub = scene.add.text(cx, subY, t('quest_choose'), {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        this.container.add(sub);

        // Reward config
        const cfg = QUEST_CONFIG.rewards[questType];
        const buffKey = cfg.buffType as 'lucky' | 'super' | 'epic';
        const descKey = `buff_desc_${buffKey}`;
        const descColor = BUFF_CONFIG[buffKey].colorHex;

        // Cards area
        const cardsY = subY + 15;
        const leftX = cx - CARD_GAP / 2 - CARD_W / 2;
        const rightX = cx + CARD_GAP / 2 + CARD_W / 2;

        // Free card
        this.createCard(scene, leftX, cardsY, cfg.freeCount, buffKey, descKey, descColor,
            FREE_COLOR, FREE_DARK, t('quest_free'),
            () => { this.destroy(); onFree(); });

        // Ad card
        this.createCard(scene, rightX, cardsY, cfg.adCount, buffKey, descKey, descColor,
            AD_COLOR, AD_DARK, t('quest_watch'),
            () => { this.destroy(); onAd(); });
    }

    private createCard(
        scene: Scene, cx: number, topY: number,
        count: number, buffKey: string, descKey: string, descColor: string,
        btnColor: number, btnDark: number, btnLabel: string,
        onClick: () => void,
    ): void {
        // Card background
        const cardBg = scene.add.graphics();
        cardBg.fillStyle(0x1a1a2e, 0.9);
        cardBg.fillRoundedRect(cx - CARD_W / 2, topY, CARD_W, CARD_H, CARD_R);
        cardBg.lineStyle(1.5, 0x333355, 0.5);
        cardBg.strokeRoundedRect(cx - CARD_W / 2, topY, CARD_W, CARD_H, CARD_R);
        this.container.add(cardBg);

        // Line 1: "{count} Lucky Rolls" — white, uses buff_lucky/buff_super locale
        const line1 = t(`buff_${buffKey}`, { count });
        const line1Y = topY + 30;
        const countLabel = scene.add.text(cx, line1Y, line1, {
            fontFamily: UI.FONT_STROKE, fontSize: '16px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        fitText(countLabel, CARD_W - 10, 16);
        this.container.add(countLabel);

        // Line 2: "x2 chance" — colored, like buff description
        const line2Y = line1Y + 22;
        const descLabel = scene.add.text(cx, line2Y, t(descKey), {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: descColor,
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        this.container.add(descLabel);

        // Action button at bottom of card
        const btnY = topY + CARD_H - BTN_H / 2 - 10;
        const btnWrap = scene.add.container(cx, btnY);
        this.container.add(btnWrap);

        const bg = scene.add.graphics();
        bg.fillStyle(btnDark, 1);
        bg.fillRoundedRect(-BTN_W / 2, -BTN_H / 2 + BTN_SHADOW, BTN_W, BTN_H, BTN_R);
        bg.fillStyle(btnColor, 1);
        bg.fillRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H - BTN_SHADOW, BTN_R);
        bg.fillStyle(0xffffff, 0.15);
        bg.fillRoundedRect(
            -BTN_W / 2 + 3, -BTN_H / 2 + 1,
            BTN_W - 6, (BTN_H - BTN_SHADOW) * 0.4,
            { tl: BTN_R - 1, tr: BTN_R - 1, bl: 0, br: 0 },
        );
        bg.lineStyle(1.5, 0x000000, 0.25);
        bg.strokeRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, BTN_R);
        btnWrap.add(bg);

        const btnText = scene.add.text(0, -1, btnLabel, {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);
        fitText(btnText, BTN_W - 10, 13);
        btnWrap.add(btnText);

        btnWrap.setSize(BTN_W, BTN_H + BTN_SHADOW);
        btnWrap.setInteractive({ useHandCursor: true });
        btnWrap.on('pointerdown', onClick);
        addButtonFeedback(scene, btnWrap);
    }

    /** Close popup without claiming — CLAIM button stays active */
    private dismiss(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.container.destroy();
        if (this.onDismiss) this.onDismiss();
    }

    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.container.destroy();
    }
}
