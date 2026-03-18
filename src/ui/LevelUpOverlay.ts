import { GameObjects, Scene } from 'phaser';
import { UI, LEVELUP_CONFIG } from '../core/config';
import { getLayout } from '../core/layout';
import { isPortrait } from '../core/orientation';
import { LevelUpData } from '../types';
import { AudioSystem } from '../systems/AudioSystem';
import { getEggNameKey, getEggMinOdds } from '../data/eggs';
import { t } from '../data/locales';
import { fitText } from './components/fitText';
import {
    FREE_COLOR, FREE_DARK, AD_COLOR, AD_DARK, BTN_W, BTN_H,
    drawCardBg, drawBadgeRibbon, buildChoiceButton,
} from './components/ChoiceCard';

const DEPTH = 500;          // above autoroll UI (105) and pause (1001 handled separately)

const RING_OUTER = 42;
const RING_INNER = 32;
const RING_COLOR = 0xffc107;

const CARD_W = 136;
const CARD_H = 175;
const CARD_GAP = 20;
const CARD_R = 12;

const FEATURE_INFO: Record<string, { iconKey: string; nameKey: string; descKey: string }> = {
    incubation: { iconKey: 'ui_nests_btn', nameKey: 'feature_incubation', descKey: 'nests_hint' },
    autoroll:   { iconKey: 'ui_automod_on', nameKey: 'feature_autoroll', descKey: 'autoroll_hint' },
};

export class LevelUpOverlay {
    private scene: Scene;
    private elements: GameObjects.GameObject[] = [];
    private timer: Phaser.Time.TimerEvent | null = null;
    private freeBtnText: GameObjects.Text | null = null;

    constructor(scene: Scene, _overlay: GameObjects.Rectangle) {
        this.scene = scene;
    }

    show(data: LevelUpData, onComplete: (chosenCoinAmount: number) => void): void {
        this.cleanup();

        const audio = this.scene.registry.get('audio') as AudioSystem | undefined;
        audio?.playSfx('sfx_levelup');

        const l = getLayout();
        const CX = l.cx;
        const CY = l.cy;
        const port = isPortrait();

        // Fullscreen dark blocker — oversized to avoid sub-pixel gaps
        const blocker = this.scene.add.rectangle(CX, CY, l.gw + 4, l.gh + 4, 0x000000, 0.75)
            .setDepth(DEPTH).setInteractive();
        this.elements.push(blocker);

        const container = this.scene.add.container(CX, CY).setDepth(DEPTH + 1).setScale(0);
        this.elements.push(container);

        // --- Double ring (top) ---
        const ringY = port ? -240 : -173;
        this.buildDoubleRing(container, data.level, ringY);

        // --- "LEVEL UP!" title ---
        const titleY = ringY + RING_OUTER + 30;
        const title = this.scene.add.text(0, titleY, t('levelup_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '32px',
            color: '#ffc107', stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        container.add(title);

        if (data.featureUnlock) {
            this.buildFeatureUnlockVariant(container, blocker, data, titleY, port, onComplete);
        } else if (data.eggChanged) {
            this.buildEggVariant(container, blocker, data, titleY, port, onComplete);
        } else {
            this.buildCoinVariant(container, data, titleY, port, onComplete);
        }

        this.scene.tweens.add({ targets: container, scale: 1, duration: 300, ease: 'Back.easeOut' });
    }

    private buildDoubleRing(container: GameObjects.Container, level: number, cy: number): void {
        const gfx = this.scene.add.graphics();
        gfx.fillStyle(0x1a1a2e, 0.95);
        gfx.fillCircle(0, cy, RING_OUTER);
        gfx.lineStyle(4, RING_COLOR, 1);
        gfx.strokeCircle(0, cy, RING_OUTER);
        gfx.lineStyle(2, RING_COLOR, 0.7);
        gfx.strokeCircle(0, cy, RING_INNER);
        container.add(gfx);

        const text = this.scene.add.text(0, cy, `${level}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '30px',
            color: '#ffc107', stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        container.add(text);
    }

    // ─── EGG VARIANT ────────────────────────────────────────

    private buildEggVariant(
        container: GameObjects.Container,
        blocker: GameObjects.Rectangle,
        data: LevelUpData,
        titleY: number,
        port: boolean,
        onComplete: (chosenCoinAmount: number) => void,
    ): void {
        let y = titleY + (port ? 45 : 35);

        // Subtitle
        const subtitle = this.scene.add.text(0, y, t('levelup_new_egg_unlocked'), {
            fontFamily: UI.FONT_STROKE, fontSize: '18px',
            color: '#ffffff', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        container.add(subtitle);
        y += port ? 35 : 27;

        // Old egg → arrow → new egg
        const eggY = y + (port ? 80 : 62);
        const oldEggTex = `${data.oldEggKey}_sm`;
        if (this.scene.textures.exists(oldEggTex)) {
            container.add(this.scene.add.image(-99, eggY, oldEggTex).setDisplaySize(111, 111));
        }
        const arrow = this.scene.add.image(0, eggY, 'ui_arrow').setDisplaySize(35, 35).setRotation(-Math.PI / 2);
        container.add(arrow);
        const newEggTex = `${data.eggKey}_sm`;
        if (this.scene.textures.exists(newEggTex)) {
            container.add(this.scene.add.image(99, eggY, newEggTex).setDisplaySize(111, 111));
        }
        y = eggY + (port ? 90 : 72);

        // Egg name
        const eggName = this.scene.add.text(0, y, t(getEggNameKey(data.eggKey)), {
            fontFamily: UI.FONT_STROKE, fontSize: '22px',
            color: '#ffc107', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(eggName, 300, 22);
        container.add(eggName);
        y += port ? 35 : 27;

        // Egg characteristic
        const odds = getEggMinOdds(data.level);
        const effect = this.scene.add.text(0, y, t('egg_effect').replace('{odds}', odds), {
            fontFamily: UI.FONT_STROKE, fontSize: '16px',
            color: '#aaaaaa', stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        container.add(effect);
        y += port ? 35 : 27;

        // Countdown
        let seconds = LEVELUP_CONFIG.eggCloseSeconds;
        const countdown = this.scene.add.text(0, y, this.fmtTapClose(seconds), {
            fontFamily: UI.FONT_BODY, fontSize: '16px',
            color: '#888888', stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        fitText(countdown, 350, 16);
        container.add(countdown);

        this.timer = this.scene.time.addEvent({
            delay: 1000, repeat: seconds - 1,
            callback: () => {
                seconds--;
                countdown.setText(this.fmtTapClose(seconds));
                fitText(countdown, 350, 16);
                if (seconds <= 0) this.close(() => onComplete(0));
            },
        });

        // Tap-to-close on the blocker (delayed 1.5s to prevent accidental dismiss)
        this.scene.time.delayedCall(1500, () => {
            blocker.on('pointerdown', () => this.close(() => onComplete(0)));
        });
    }

    private fmtTapClose(s: number): string {
        return t('levelup_tap_close').replace('{seconds}', String(s));
    }

    // ─── FEATURE UNLOCK VARIANT ────────────────────────────

    private buildFeatureUnlockVariant(
        container: GameObjects.Container,
        blocker: GameObjects.Rectangle,
        data: LevelUpData,
        titleY: number,
        port: boolean,
        onComplete: (chosenCoinAmount: number) => void,
    ): void {
        const info = FEATURE_INFO[data.featureUnlock!];
        let y = titleY + (port ? 45 : 35);

        const subtitle = this.scene.add.text(0, y, t('feature_unlocked'), {
            fontFamily: UI.FONT_STROKE, fontSize: '18px',
            color: '#ffffff', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        container.add(subtitle);
        const afterSubtitle = y + (port ? 20 : 14);

        // Icon dimensions (2x size)
        const src = this.scene.textures.get(info.iconKey).getSourceImage();
        const iconW = port ? 220 : 180;
        const iconH = Math.round(iconW * src.height / src.width);

        // Name position — leave room for icon + padding
        const nameY = afterSubtitle + iconH + (port ? 40 : 30);

        // Feature icon — centered between subtitle and name
        const iconY = (afterSubtitle + nameY) / 2;
        const icon = this.scene.add.image(0, iconY, info.iconKey).setDisplaySize(iconW, iconH);
        container.add(icon);

        // Feature name
        const name = this.scene.add.text(0, nameY, t(info.nameKey), {
            fontFamily: UI.FONT_STROKE, fontSize: '22px',
            color: '#ffc107', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        container.add(name);
        y = nameY + (port ? 32 : 25);

        // Description — same font as egg effect line
        const desc = this.scene.add.text(0, y, t(info.descKey), {
            fontFamily: UI.FONT_STROKE, fontSize: '16px',
            color: '#aaaaaa', stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        container.add(desc);
        y += port ? 55 : 42;

        // Countdown
        let seconds = LEVELUP_CONFIG.eggCloseSeconds;
        const countdown = this.scene.add.text(0, y, this.fmtTapClose(seconds), {
            fontFamily: UI.FONT_BODY, fontSize: '16px',
            color: '#888888', stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        fitText(countdown, 350, 16);
        container.add(countdown);

        this.timer = this.scene.time.addEvent({
            delay: 1000, repeat: seconds - 1,
            callback: () => {
                seconds--;
                countdown.setText(this.fmtTapClose(seconds));
                fitText(countdown, 350, 16);
                if (seconds <= 0) this.close(() => onComplete(0));
            },
        });

        this.scene.time.delayedCall(1500, () => {
            blocker.on('pointerdown', () => this.close(() => onComplete(0)));
        });
    }

    // ─── COINS VARIANT ──────────────────────────────────────

    private buildCoinVariant(
        container: GameObjects.Container,
        data: LevelUpData,
        titleY: number,
        port: boolean,
        onComplete: (chosenCoinAmount: number) => void,
    ): void {
        const baseAmount = data.coinReward;
        const adAmount = baseAmount * LEVELUP_CONFIG.adCoinMultiplier;

        let y = titleY + (port ? 80 : 59);

        // Subtitle
        const subtitle = this.scene.add.text(0, y, t('levelup_rewards'), {
            fontFamily: UI.FONT_STROKE, fontSize: '18px',
            color: '#ffffff', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        container.add(subtitle);
        y += port ? 42 : 32;

        // Choice cards
        const cardsY = y;
        const leftX = -CARD_GAP / 2 - CARD_W / 2;
        const rightX = CARD_GAP / 2 + CARD_W / 2;

        let chosen = false;
        const choose = (amount: number) => {
            if (chosen) return;
            chosen = true;
            this.close(() => onComplete(amount));
        };

        // Free card — pass initial label with countdown
        let seconds = LEVELUP_CONFIG.coinAcceptSeconds;
        const freeLabel = `${t('quest_free')} (${seconds})`;
        this.buildCoinCard(container, leftX, cardsY, `+${baseAmount}`,
            FREE_COLOR, FREE_DARK, freeLabel, false, () => choose(baseAmount));

        // Ad card
        this.buildCoinCard(container, rightX, cardsY, `+${adAmount}`,
            AD_COLOR, AD_DARK, t('quest_watch'), true, () => choose(adAmount), 'ui_ad_sm');

        // Timer — updates the FREE button text with countdown
        this.timer = this.scene.time.addEvent({
            delay: 1000, repeat: seconds - 1,
            callback: () => {
                seconds--;
                if (this.freeBtnText) {
                    this.freeBtnText.setText(`${t('quest_free')} (${seconds})`);
                    fitText(this.freeBtnText, BTN_W - 10, 14);
                }
                if (seconds <= 0) choose(baseAmount);
            },
        });
    }

    private buildCoinCard(
        container: GameObjects.Container,
        cx: number, topY: number,
        amountStr: string,
        btnColor: number, btnDark: number,
        btnLabel: string, showBest: boolean,
        onClick: () => void, iconKey?: string,
    ): void {
        drawCardBg(this.scene, container, cx, topY, CARD_W, CARD_H, CARD_R);

        // Coin icon + amount
        const iconY = topY + 59;
        const icon = this.scene.add.image(cx, iconY, 'ui_coin_md').setDisplaySize(42, 42);
        container.add(icon);
        const amtText = this.scene.add.text(cx, iconY + 35, amountStr, {
            fontFamily: UI.FONT_STROKE, fontSize: '20px',
            color: '#ffc107', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        container.add(amtText);

        if (showBest) drawBadgeRibbon(this.scene, container, cx, topY, '+300%');

        // Button
        const { text } = buildChoiceButton(this.scene, container, cx, topY + CARD_H - BTN_H / 2 - 12, {
            color: btnColor, dark: btnDark, label: btnLabel, onClick, iconKey,
        });
        if (!showBest) this.freeBtnText = text;
    }

    // ─── SHARED HELPERS ─────────────────────────────────────

    private close(onDone: () => void): void {
        if (this.timer) { this.timer.destroy(); this.timer = null; }
        this.scene.tweens.add({
            targets: this.elements,
            alpha: 0,
            duration: 250,
            onComplete: () => { this.cleanup(); onDone(); },
        });
    }

    private cleanup(): void {
        if (this.timer) { this.timer.destroy(); this.timer = null; }
        this.freeBtnText = null;
        for (const el of this.elements) el.destroy();
        this.elements = [];
    }
}
