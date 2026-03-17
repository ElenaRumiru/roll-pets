import { GameObjects, Scene } from 'phaser';
import { UI, BUFF_CONFIG, QuestStepReward } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait } from '../core/orientation';
import { t } from '../data/locales';
import { fitText } from './components/fitText';
import {
    FREE_COLOR, FREE_DARK, AD_COLOR, AD_DARK, BTN_H,
    drawCardBg, buildChoiceButton,
} from './components/ChoiceCard';

const POPUP_W = 345;
const POPUP_H = 210;
const CARD_W = 136;
const CARD_H = 138;
const CARD_GAP = 20;
const CARD_R = 12;

export class QuestClaimPopup {
    private container: GameObjects.Container;
    private destroyed = false;

    constructor(
        scene: Scene,
        _questType: 'roll' | 'grade' | 'online',
        reward: QuestStepReward,
        onFree: () => void,
        onAd: () => void,
        private onDismiss?: () => void,
    ) {
        this.container = scene.add.container(0, 0).setDepth(1000);

        const port = isPortrait();
        const pw = port ? 370 : POPUP_W;
        const ph = port ? 250 : POPUP_H;
        const cx = getGameWidth() / 2;
        const cy = getGameHeight() / 2;
        const popLeft = cx - pw / 2;
        const popTop = cy - ph / 2;

        // Overlay — tap outside popup to dismiss
        const overlay = scene.add.rectangle(cx, cy, getGameWidth(), getGameHeight(), 0x000000, 0.7);
        overlay.setInteractive();
        overlay.on('pointerdown', (p: Phaser.Input.Pointer) => {
            const lx = p.x, ly = p.y;
            if (lx < popLeft || lx > popLeft + pw || ly < popTop || ly > popTop + ph) {
                this.dismiss();
            }
        });
        this.container.add(overlay);

        // Popup background
        const popBg = scene.add.graphics();
        popBg.fillStyle(0x000000, 0.95);
        popBg.fillRoundedRect(popLeft, popTop, pw, ph, 14);
        this.container.add(popBg);

        // Title
        const titleY = popTop + (port ? 28 : 23);
        const title = scene.add.text(cx, titleY, t('quest_complete'), {
            fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.container.add(title);

        // Subtitle
        const subY = titleY + (port ? 25 : 21);
        const sub = scene.add.text(cx, subY, t('quest_choose'), {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        this.container.add(sub);

        // Reward config
        const cfg = reward;
        const buffKey = cfg.buffType;
        const descKey = `buff_desc_${buffKey}`;
        const descColor = BUFF_CONFIG[buffKey].colorHex;

        // Cards area
        const cardsY = subY + (port ? 20 : 15);
        const leftX = cx - CARD_GAP / 2 - CARD_W / 2;
        const rightX = cx + CARD_GAP / 2 + CARD_W / 2;

        // Free card
        this.createCard(scene, leftX, cardsY, cfg.freeCount, buffKey, descKey, descColor,
            FREE_COLOR, FREE_DARK, t('quest_free'),
            () => { this.destroy(); onFree(); });

        // Ad card
        this.createCard(scene, rightX, cardsY, cfg.adCount, buffKey, descKey, descColor,
            AD_COLOR, AD_DARK, t('quest_watch'),
            () => { this.destroy(); onAd(); }, 'ui_ad_sm');
    }

    private createCard(
        scene: Scene, cx: number, topY: number,
        count: number, buffKey: string, descKey: string, descColor: string,
        btnColor: number, btnDark: number, btnLabel: string,
        onClick: () => void, iconKey?: string,
    ): void {
        drawCardBg(scene, this.container, cx, topY, CARD_W, CARD_H, CARD_R);

        // Line 1: "{count} Lucky Rolls"
        const line1Y = topY + 30;
        const countLabel = scene.add.text(cx, line1Y, t(`buff_${buffKey}`, { count }), {
            fontFamily: UI.FONT_STROKE, fontSize: '16px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        fitText(countLabel, CARD_W - 10, 16);
        this.container.add(countLabel);

        // Line 2: "x2 chance"
        const descLabel = scene.add.text(cx, line1Y + 22, t(descKey), {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: descColor,
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        this.container.add(descLabel);

        buildChoiceButton(scene, this.container, cx, topY + CARD_H - BTN_H / 2 - 10, {
            color: btnColor, dark: btnDark, label: btnLabel, onClick,
            shine: false, fontSize: 13, strokeThickness: 2, iconKey,
        });
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
