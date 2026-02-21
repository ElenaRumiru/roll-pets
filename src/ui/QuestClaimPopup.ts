import { GameObjects, Scene } from 'phaser';
import { UI, GAME_WIDTH, GAME_HEIGHT, QUEST_CONFIG } from '../core/config';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';

const POPUP_W = 345;
const POPUP_H = 234;
const CARD_W = 136;
const CARD_H = 148;
const CARD_GAP = 20;
const CARD_R = 12;
const BTN_W = 111;
const BTN_H = 35;
const BTN_R = BTN_H / 2;
const BTN_SHADOW = 2;
const ICON_SZ = 49;

const FREE_COLOR = 0x4CAF50;
const FREE_DARK = 0x2E7D32;
const AD_COLOR = 0x7B2FBE;
const AD_DARK = 0x4A1A72;

export class QuestClaimPopup {
    private container: GameObjects.Container;
    private tooltipBg: GameObjects.Graphics;
    private tooltipText: GameObjects.Text;
    private longPressTimer: Phaser.Time.TimerEvent | null = null;

    constructor(
        scene: Scene,
        questType: 'roll' | 'grade',
        onFree: () => void,
        onAd: () => void,
    ) {
        this.container = scene.add.container(0, 0).setDepth(1000);

        // Shared tooltip (above everything)
        this.tooltipBg = scene.add.graphics().setDepth(1001).setVisible(false);
        this.tooltipText = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_MAIN, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
            align: 'center', wordWrap: { width: 150 },
        }).setOrigin(0.5).setDepth(1001).setVisible(false);
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // Overlay
        const overlay = scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
        overlay.setInteractive();
        this.container.add(overlay);

        // Popup background — black
        const popBg = scene.add.graphics();
        popBg.fillStyle(0x000000, 0.95);
        popBg.fillRoundedRect(cx - POPUP_W / 2, cy - POPUP_H / 2, POPUP_W, POPUP_H, 14);
        this.container.add(popBg);

        // Title
        const titleY = cy - POPUP_H / 2 + 25;
        const title = scene.add.text(cx, titleY, t('quest_complete'), {
            fontFamily: UI.FONT_MAIN, fontSize: '17px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.container.add(title);

        // Subtitle
        const subY = titleY + 22;
        const sub = scene.add.text(cx, subY, t('quest_choose'), {
            fontFamily: UI.FONT_MAIN, fontSize: '14px', color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        this.container.add(sub);

        // Reward info
        const cfg = QUEST_CONFIG.rewards[questType];
        const iconKey = cfg.buffType === 'lucky' ? 'ui_x2simple_mid' : 'ui_x3wow_mid';
        const buffName = cfg.buffType === 'lucky' ? t('buff_lucky') : t('buff_super');
        const tipKey = cfg.buffType === 'lucky' ? 'tip_lucky' : 'tip_super';

        // Cards area
        const cardsY = subY + 17;
        const leftX = cx - CARD_GAP / 2 - CARD_W / 2;
        const rightX = cx + CARD_GAP / 2 + CARD_W / 2;

        // Free reward card
        this.createCard(scene, leftX, cardsY, iconKey, buffName, cfg.freeCount,
            FREE_COLOR, FREE_DARK, t('quest_free'), tipKey,
            () => { this.destroy(); onFree(); });

        // Ad reward card
        this.createCard(scene, rightX, cardsY, iconKey, buffName, cfg.adCount,
            AD_COLOR, AD_DARK, t('quest_watch'), tipKey,
            () => { this.destroy(); onAd(); });
    }

    private createCard(
        scene: Scene, cx: number, topY: number,
        iconKey: string, buffName: string, count: number,
        btnColor: number, btnDark: number, btnLabel: string,
        tipKey: string, onClick: () => void,
    ): void {
        // Card background
        const cardBg = scene.add.graphics();
        cardBg.fillStyle(0x1a1a2e, 0.9);
        cardBg.fillRoundedRect(cx - CARD_W / 2, topY, CARD_W, CARD_H, CARD_R);
        cardBg.lineStyle(1.5, 0x333355, 0.5);
        cardBg.strokeRoundedRect(cx - CARD_W / 2, topY, CARD_W, CARD_H, CARD_R);
        this.container.add(cardBg);

        // Icon — interactive with long-press tooltip
        const iconY = topY + 30;
        const icon = scene.add.image(cx, iconY, iconKey).setDisplaySize(ICON_SZ, ICON_SZ);
        icon.setInteractive({ useHandCursor: true });
        icon.on('pointerdown', () => {
            this.longPressTimer = scene.time.delayedCall(300, () => {
                this.showTooltip(cx, iconY - ICON_SZ / 2 - 8, tipKey);
            });
        });
        icon.on('pointerup', () => this.cancelTooltip());
        icon.on('pointerout', () => this.cancelTooltip());
        this.container.add(icon);

        // Count + name label: "1 Roll" or "3 Rolls"
        const countText = count > 1
            ? t('quest_rolls_plural', { count: String(count) })
            : t('quest_rolls', { count: String(count) });
        const label = scene.add.text(cx, iconY + ICON_SZ / 2 + 15, countText, {
            fontFamily: UI.FONT_MAIN, fontSize: '15px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        this.container.add(label);

        // Buff name below count
        const nameLabel = scene.add.text(cx, label.y + 17, buffName, {
            fontFamily: UI.FONT_MAIN, fontSize: '11px', color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        this.container.add(nameLabel);

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
            fontFamily: UI.FONT_MAIN, fontSize: '12px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        btnWrap.add(btnText);

        btnWrap.setSize(BTN_W, BTN_H + BTN_SHADOW);
        btnWrap.setInteractive({ useHandCursor: true });
        btnWrap.on('pointerdown', onClick);
        addButtonFeedback(scene, btnWrap);
    }

    private showTooltip(x: number, y: number, localeKey: string): void {
        const text = t(localeKey);
        if (!text) return;
        this.tooltipText.setText(text);
        const padX = 14, padY = 10;
        const tw = this.tooltipText.width + padX * 2;
        const th = this.tooltipText.height + padY * 2;
        this.tooltipText.setPosition(x, y - th / 2);
        this.tooltipBg.clear();
        this.tooltipBg.fillStyle(0x000000, 0.9);
        this.tooltipBg.fillRoundedRect(x - tw / 2, y - th, tw, th, 6);
        this.tooltipBg.setVisible(true);
        this.tooltipText.setVisible(true);
    }

    private cancelTooltip(): void {
        if (this.longPressTimer) {
            this.longPressTimer.destroy();
            this.longPressTimer = null;
        }
        this.tooltipBg.setVisible(false);
        this.tooltipText.setVisible(false);
    }

    destroy(): void {
        this.cancelTooltip();
        this.tooltipBg.destroy();
        this.tooltipText.destroy();
        this.container.destroy();
    }
}
