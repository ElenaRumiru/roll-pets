import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI, LEVELUP_CONFIG } from '../core/config';
import { LeaguePromotionData } from '../types';
import { AudioSystem } from '../systems/AudioSystem';
import { LEAGUES } from '../data/leaderboard';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { fitText } from './components/fitText';
import { addShineEffect } from './components/shineEffect';
import { formatCoins } from '../core/formatCoins';

const CX = GAME_WIDTH / 2;
const CY = GAME_HEIGHT / 2;
const DEPTH = 500;

const ICON_H = 100;

const CARD_W = 136;
const CARD_H = 175;
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

export class LeaguePromotionOverlay {
    private scene: Scene;
    private elements: GameObjects.GameObject[] = [];
    private timer: Phaser.Time.TimerEvent | null = null;
    private freeBtnText: GameObjects.Text | null = null;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    show(data: LeaguePromotionData, onComplete: (chosenCoinAmount: number) => void): void {
        this.cleanup();

        const audio = this.scene.registry.get('audio') as AudioSystem | undefined;
        audio?.playSfx('sfx_levelup');

        const league = LEAGUES.find(l => l.tier === data.tier)!;
        const baseAmount = data.coinReward;
        const adAmount = baseAmount * LEVELUP_CONFIG.adCoinMultiplier;

        const blocker = this.scene.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
            .setDepth(DEPTH).setInteractive();
        this.elements.push(blocker);

        const container = this.scene.add.container(CX, CY).setDepth(DEPTH + 1).setScale(0);
        this.elements.push(container);

        // Rating icon
        const iconY = -170;
        const icon = this.scene.add.image(0, iconY, 'ui_rating');
        const aspectRatio = icon.width / icon.height;
        icon.setDisplaySize(ICON_H * aspectRatio, ICON_H);
        container.add(icon);

        // Title
        const titleY = iconY + ICON_H / 2 + 26;
        const title = this.scene.add.text(0, titleY, t('league_promo_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '28px',
            color: league.colorHex, stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        fitText(title, 400, 28);
        container.add(title);

        // Subtitle — league name
        const subY = titleY + 35;
        const subText = t('league_promo_subtitle').replace('{league}', t(league.label));
        const subtitle = this.scene.add.text(0, subY, subText, {
            fontFamily: UI.FONT_STROKE, fontSize: '20px',
            color: '#ffffff', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(subtitle, 350, 20);
        container.add(subtitle);

        // Rewards subtitle
        const rewardsY = subY + 29;
        const rewardsSub = this.scene.add.text(0, rewardsY, t('levelup_rewards'), {
            fontFamily: UI.FONT_STROKE, fontSize: '16px',
            color: '#aaaaaa', stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        container.add(rewardsSub);

        // Choice cards
        const cardsY = rewardsY + 22;
        const leftX = -CARD_GAP / 2 - CARD_W / 2;
        const rightX = CARD_GAP / 2 + CARD_W / 2;

        let chosen = false;
        const choose = (amount: number) => {
            if (chosen) return;
            chosen = true;
            this.close(() => onComplete(amount));
        };

        let seconds = LEVELUP_CONFIG.coinAcceptSeconds;
        const freeLabel = `${t('quest_free')} (${seconds})`;
        const freeBtn = this.buildChoiceCard(container, leftX, cardsY, `+${formatCoins(baseAmount)}`,
            FREE_COLOR, FREE_DARK, freeLabel, false, () => choose(baseAmount));

        const adBtn = this.buildChoiceCard(container, rightX, cardsY, `+${formatCoins(adAmount)}`,
            AD_COLOR, AD_DARK, t('quest_watch'), true, () => choose(adAmount));

        // Delay button interactivity to prevent accidental dismiss
        freeBtn.disableInteractive();
        adBtn.disableInteractive();
        this.scene.time.delayedCall(1500, () => {
            freeBtn.setInteractive({ useHandCursor: true });
            adBtn.setInteractive({ useHandCursor: true });
        });

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

        this.scene.tweens.add({ targets: container, scale: 1, duration: 300, ease: 'Back.easeOut' });
    }

    private buildChoiceCard(
        container: GameObjects.Container,
        cx: number, topY: number,
        amountStr: string,
        btnColor: number, btnDark: number,
        btnLabel: string, showBest: boolean,
        onClick: () => void,
    ): GameObjects.Container {
        const cardBg = this.scene.add.graphics();
        cardBg.fillStyle(0x1a1a2e, 0.9);
        cardBg.fillRoundedRect(cx - CARD_W / 2, topY, CARD_W, CARD_H, CARD_R);
        cardBg.lineStyle(1.5, 0x333355, 0.5);
        cardBg.strokeRoundedRect(cx - CARD_W / 2, topY, CARD_W, CARD_H, CARD_R);
        container.add(cardBg);

        const iconY = topY + 59;
        const icon = this.scene.add.image(cx, iconY, 'ui_coin_md').setDisplaySize(42, 42);
        container.add(icon);

        const amtText = this.scene.add.text(cx, iconY + 35, amountStr, {
            fontFamily: UI.FONT_STROKE, fontSize: '20px',
            color: '#ffc107', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(amtText, CARD_W - 16, 20);
        container.add(amtText);

        if (showBest) {
            const rw = 64, rh = 22;
            const rx = cx;
            const ry = topY + 5;
            const ribbon = this.scene.add.graphics();
            ribbon.fillStyle(0xff4444, 1);
            ribbon.fillRoundedRect(rx - rw / 2, ry, rw, rh, 3);
            container.add(ribbon);
            const bestTxt = this.scene.add.text(rx, ry + rh / 2, '+300%', {
                fontFamily: UI.FONT_STROKE, fontSize: '14px',
                color: '#ffffff', stroke: '#000000', strokeThickness: 1,
            }).setOrigin(0.5);
            container.add(bestTxt);
        }

        const btnY = topY + CARD_H - BTN_H / 2 - 12;
        const btnWrap = this.scene.add.container(cx, btnY);
        container.add(btnWrap);

        const bg = this.scene.add.graphics();
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

        const btnText = this.scene.add.text(0, -1, btnLabel, {
            fontFamily: UI.FONT_STROKE, fontSize: '14px',
            color: '#ffffff', stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        fitText(btnText, BTN_W - 10, 14);
        btnWrap.add(btnText);

        if (!showBest) this.freeBtnText = btnText;

        btnWrap.setSize(BTN_W, BTN_H + BTN_SHADOW);
        addShineEffect(this.scene, btnWrap, BTN_W, BTN_H, BTN_R);
        btnWrap.setInteractive({ useHandCursor: true });
        btnWrap.on('pointerdown', onClick);
        addButtonFeedback(this.scene, btnWrap);
        return btnWrap;
    }

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
