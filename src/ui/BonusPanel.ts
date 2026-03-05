import { GameObjects, Geom, Scene } from 'phaser';
import { UI, BONUS_PANEL, BUFF_CONFIG } from '../core/config';
import { BuffSystem } from '../systems/BuffSystem';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { fitText } from './components/fitText';
import { addShineEffect } from './components/shineEffect';

const ROW_W = BONUS_PANEL.w;
const ICON_SZ = 54;
const ACCENT_H = 1;
const PAD = 4;
const ICON_PAD = 8;
export const OFFER_CARD_H = ICON_SZ + PAD * 2 + ACCENT_H + 10;
const RADIUS = 10;
const BTN_W = 82;
const BTN_H = 26;
const BTN_SHADOW = 2;
const AD_COLOR = 0x7B2FBE;
const AD_COLOR_DARK = 0x4A1A72;
const AREA_LEFT = ICON_PAD + ICON_SZ + 4;
const AREA_CX = AREA_LEFT + (ROW_W - AREA_LEFT - PAD) / 2;
const CONTENT_TOP = ACCENT_H + 6;
const CONTENT_CY = CONTENT_TOP + (OFFER_CARD_H - CONTENT_TOP) / 2;
const TAB_W = 53;
const TAB_H = 17;
const TAB_R = 6;

type OfferBuff = 'lucky' | 'super' | 'epic';
const BUFF_ICON: Record<OfferBuff, string> = {
    lucky: 'luck_x2_lg', super: 'luck_x3_lg', epic: 'luck_x5_lg',
};
const BUFF_DESC_KEY: Record<OfferBuff, string> = {
    lucky: 'buff_desc_lucky', super: 'buff_desc_super', epic: 'buff_desc_epic',
};
const BUFF_LABEL_KEY: Record<OfferBuff, string> = {
    lucky: 'buff_lucky', super: 'buff_super', epic: 'buff_epic',
};
const TOOLTIP_KEYS: Record<OfferBuff, string> = {
    lucky: 'tip_lucky', super: 'tip_super', epic: 'tip_epic',
};
const ICON_SIZES: Record<OfferBuff, number> = { lucky: 54, super: 54, epic: 54 };

export class BonusPanel extends GameObjects.Container {
    private card: GameObjects.Container;
    private bg: GameObjects.Graphics;
    private icon: GameObjects.Image;
    private label: GameObjects.Text;
    private desc: GameObjects.Text;
    private btnWrap: GameObjects.Container;
    private timerTabBg: GameObjects.Graphics;
    private timerTab: GameObjects.Container;
    private timerText: GameObjects.Text;
    private currentType: OfferBuff = 'lucky';
    private wasOfferActive = false;
    private lastSec = -1;
    private tooltipBg: GameObjects.Graphics;
    private tooltipText: GameObjects.Text;
    private longPressTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Scene, private onBuff: (type: string) => void) {
        super(scene, BONUS_PANEL.x, 0);

        this.tooltipBg = scene.add.graphics().setDepth(200).setVisible(false);
        this.tooltipText = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
            align: 'center', wordWrap: { width: 173 },
        }).setOrigin(0.5).setDepth(200).setVisible(false);

        this.card = scene.add.container(ROW_W + 20, 0);
        this.add(this.card);

        this.bg = scene.add.graphics();
        this.card.add(this.bg);

        this.card.setInteractive(
            new Geom.Rectangle(0, 0, ROW_W, OFFER_CARD_H), Geom.Rectangle.Contains,
        );
        this.card.on('pointerdown', () => {
            this.longPressTimer = scene.time.delayedCall(300, () => {
                this.showTooltip();
            });
        });
        this.card.on('pointerup', () => this.cancelTooltip());
        this.card.on('pointerout', () => this.cancelTooltip());

        this.icon = scene.add.image(ICON_PAD + ICON_SZ / 2 - 4, CONTENT_CY, BUFF_ICON.lucky)
            .setDisplaySize(ICON_SZ, ICON_SZ);
        this.card.add(this.icon);

        this.label = scene.add.text(AREA_CX - 5, CONTENT_TOP + 14, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5, 0.5);
        this.card.add(this.label);

        this.desc = scene.add.text(AREA_CX - 3, CONTENT_TOP + 27, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5, 0.5);
        this.card.add(this.desc);

        const btnCY = OFFER_CARD_H - PAD - BTN_H / 2 - BTN_SHADOW + 1;
        this.btnWrap = scene.add.container(AREA_CX - 2, btnCY);
        this.card.add(this.btnWrap);
        const btnBg = scene.add.graphics();
        this.draw3DButton(btnBg);
        this.btnWrap.add(btnBg);
        const btnText = scene.add.text(0, -Math.floor(BTN_SHADOW / 2), `▶ ${t('buff_watch')}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5, 0.5);
        fitText(btnText, BTN_W - 8, 13);
        this.btnWrap.add(btnText);
        this.btnWrap.setSize(BTN_W, BTN_H + BTN_SHADOW);
        addShineEffect(scene, this.btnWrap, BTN_W, BTN_H, BTN_H / 2);
        this.btnWrap.setInteractive({ useHandCursor: true });
        this.btnWrap.disableInteractive();
        this.btnWrap.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev: Phaser.Types.Input.EventData) => {
            ev.stopPropagation();
            this.cancelTooltip();
            this.onBuff(this.currentType);
        });
        addButtonFeedback(scene, this.btnWrap);

        this.timerTab = scene.add.container(ROW_W / 2, OFFER_CARD_H + 2).setVisible(false);
        this.timerTabBg = scene.add.graphics();
        this.timerTab.add(this.timerTabBg);
        this.timerText = scene.add.text(0, TAB_H / 2, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5, 0.5);
        this.timerTab.add(this.timerText);
        this.card.add(this.timerTab);

        scene.add.existing(this);
    }

    private configureCard(type: OfferBuff): void {
        this.currentType = type;
        const color = BUFF_CONFIG[type].color;
        const colorHex = BUFF_CONFIG[type].colorHex;
        const iconSize = ICON_SIZES[type];

        this.icon.setTexture(BUFF_ICON[type]).setDisplaySize(iconSize, iconSize).setY(CONTENT_CY);
        this.label.setText(t(BUFF_LABEL_KEY[type], { count: BUFF_CONFIG[type].rollsPerAd }));
        fitText(this.label, ROW_W - AREA_LEFT - PAD + 12, 13);
        this.desc.setText(t(BUFF_DESC_KEY[type])).setColor(colorHex);

        this.bg.clear();
        this.bg.fillStyle(0x1a1a2e, 0.9);
        this.bg.fillRoundedRect(0, 0, ROW_W, OFFER_CARD_H, RADIUS);
        this.bg.fillStyle(color, 0.7);
        this.bg.fillRoundedRect(0, 0, ROW_W, ACCENT_H, { tl: RADIUS, tr: RADIUS, bl: 0, br: 0 });
        this.bg.lineStyle(4, 0x000000, 1);
        this.bg.strokeRoundedRect(0, 0, ROW_W, OFFER_CARD_H, RADIUS);
        this.bg.lineStyle(1.5, color, 1);
        this.bg.strokeRoundedRect(0, 0, ROW_W, OFFER_CARD_H, RADIUS);

        this.drawTimerTab(color);
    }

    private drawTimerTab(color: number): void {
        this.timerTabBg.clear();
        this.timerTabBg.fillStyle(color, 0.9);
        this.timerTabBg.fillRoundedRect(-TAB_W / 2, 0, TAB_W, TAB_H, { tl: 0, tr: 0, bl: TAB_R, br: TAB_R });
        this.timerTabBg.lineStyle(1.5, 0x000000, 1);
        this.timerTabBg.strokeRoundedRect(-TAB_W / 2, 0, TAB_W, TAB_H, { tl: 0, tr: 0, bl: TAB_R, br: TAB_R });
        this.timerTabBg.fillStyle(0xffffff, 0.12);
        this.timerTabBg.fillRect(-TAB_W / 2 + 2, 1, TAB_W - 4, 4);
    }

    updateBuffDisplay(buffs: BuffSystem): void {
        const offered = buffs.isOfferActive();

        if (offered && !this.wasOfferActive) {
            this.configureCard(buffs.getCurrentOffer() as OfferBuff);
            this.lastSec = -1;
            this.timerTab.setVisible(true);
            this.card.x = ROW_W + 20;
            this.scene.tweens.add({
                targets: this.card, x: 0, duration: 300, ease: 'Back.easeOut',
                onComplete: () => { this.btnWrap.setInteractive({ useHandCursor: true }); },
            });
        } else if (!offered && this.wasOfferActive) {
            this.slideOut('right');
        }
        this.wasOfferActive = offered;

        if (offered) {
            const remaining = buffs.getOfferRemaining();
            const sec = Math.ceil(remaining / 1000);
            this.timerText.setText(t('buff_timer', { n: sec }));
            if (sec !== this.lastSec && this.lastSec !== -1) {
                this.scene.tweens.add({
                    targets: this.timerTab,
                    scaleX: 1.1, scaleY: 1.1,
                    duration: 80, yoyo: true, ease: 'Quad.easeOut',
                });
            }
            this.lastSec = sec;
        }
    }

    onOfferAccepted(): void {
        this.wasOfferActive = false;
        this.slideOut('left');
    }

    private slideOut(direction: 'left' | 'right'): void {
        this.btnWrap.disableInteractive();
        this.timerTab.setVisible(false);
        const targetX = direction === 'left' ? -(ROW_W + 20) : ROW_W + 20;
        this.scene.tweens.add({
            targets: this.card, x: targetX, duration: 300, ease: 'Cubic.easeIn',
            onComplete: () => {
                this.card.x = ROW_W + 20;
            },
        });
    }

    private draw3DButton(g: GameObjects.Graphics): void {
        const w = BTN_W, h = BTN_H, r = h / 2;
        g.clear();
        g.fillStyle(AD_COLOR_DARK, 1);
        g.fillRoundedRect(-w / 2, -h / 2 + BTN_SHADOW, w, h, r);
        g.fillStyle(AD_COLOR, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h - BTN_SHADOW, r);
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(
            -w / 2 + 3, -h / 2 + 1, w - 6, (h - BTN_SHADOW) * 0.4,
            { tl: r - 1, tr: r - 1, bl: 0, br: 0 },
        );
        g.lineStyle(1.5, 0x000000, 0.25);
        g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    }

    private showTooltip(): void {
        const text = t(TOOLTIP_KEYS[this.currentType]);
        if (!text) return;
        this.tooltipText.setText(text);
        const padX = 14, padY = 10;
        const tw = this.tooltipText.width + padX * 2;
        const th = this.tooltipText.height + padY * 2;
        const worldX = this.x + this.card.x + ROW_W / 2;
        const worldY = this.y + this.card.y - th / 2 - 6;
        this.tooltipText.setPosition(worldX, worldY);
        this.tooltipBg.clear();
        this.tooltipBg.fillStyle(0x000000, 0.85);
        this.tooltipBg.fillRoundedRect(worldX - tw / 2, worldY - th / 2, tw, th, 6);
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
}
