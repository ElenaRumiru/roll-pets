import { GameObjects, Scene } from 'phaser';
import { UI, LEVELUP_CONFIG } from '../core/config';
import { getLayout } from '../core/layout';
import { isPortrait } from '../core/orientation';
import { LeaguePromotionData } from '../types';
import { AudioSystem } from '../systems/AudioSystem';
import { LEAGUES } from '../data/leaderboard';
import { t } from '../data/locales';
import { fitText } from './components/fitText';
import { formatCoins } from '../core/formatCoins';
import {
    FREE_COLOR, FREE_DARK, AD_COLOR, AD_DARK, BTN_W, BTN_H,
    drawCardBg, drawBadgeRibbon, buildChoiceButton,
} from './components/ChoiceCard';

const DEPTH = 500;

const ICON_H = 100;

const CARD_W = 136;
const CARD_H = 175;
const CARD_GAP = 20;
const CARD_R = 12;

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

        const l = getLayout();
        const CX = l.cx;
        const CY = l.cy;
        const port = isPortrait();

        const league = LEAGUES.find(l => l.tier === data.tier)!;
        const baseAmount = data.coinReward;
        const adAmount = baseAmount * LEVELUP_CONFIG.adCoinMultiplier;

        const blocker = this.scene.add.rectangle(CX, CY, l.gw + 4, l.gh + 4, 0x000000, 0.75)
            .setDepth(DEPTH).setInteractive();
        this.elements.push(blocker);

        const container = this.scene.add.container(CX, CY).setDepth(DEPTH + 1).setScale(0);
        this.elements.push(container);

        // Rating icon
        const iconScale = port ? 1.2 : 1;
        const iconY = port ? -240 : -170;
        const icon = this.scene.add.image(0, iconY, 'ui_rating');
        const aspectRatio = icon.width / icon.height;
        icon.setDisplaySize(ICON_H * aspectRatio * iconScale, ICON_H * iconScale);
        container.add(icon);

        // Title
        const titleY = iconY + ICON_H * iconScale / 2 + (port ? 30 : 26);
        const title = this.scene.add.text(0, titleY, t('league_promo_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '28px',
            color: league.colorHex, stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        fitText(title, 400, 28);
        container.add(title);

        // Subtitle — league name
        const subY = titleY + (port ? 45 : 35);
        const subText = t('league_promo_subtitle').replace('{league}', t(league.label));
        const subtitle = this.scene.add.text(0, subY, subText, {
            fontFamily: UI.FONT_STROKE, fontSize: '20px',
            color: '#ffffff', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(subtitle, 350, 20);
        container.add(subtitle);

        // Rewards subtitle
        const rewardsY = subY + (port ? 38 : 29);
        const rewardsSub = this.scene.add.text(0, rewardsY, t('levelup_rewards'), {
            fontFamily: UI.FONT_STROKE, fontSize: '16px',
            color: '#aaaaaa', stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        container.add(rewardsSub);

        // Choice cards
        const cardsY = rewardsY + (port ? 30 : 22);
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
        const freeBtn = this.buildCoinCard(container, leftX, cardsY, `+${formatCoins(baseAmount)}`,
            FREE_COLOR, FREE_DARK, freeLabel, false, () => choose(baseAmount));

        const adBtn = this.buildCoinCard(container, rightX, cardsY, `+${formatCoins(adAmount)}`,
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

    private buildCoinCard(
        container: GameObjects.Container,
        cx: number, topY: number,
        amountStr: string,
        btnColor: number, btnDark: number,
        btnLabel: string, showBest: boolean,
        onClick: () => void,
    ): GameObjects.Container {
        drawCardBg(this.scene, container, cx, topY, CARD_W, CARD_H, CARD_R);

        // Coin icon + amount
        const iconY = topY + 59;
        const icon = this.scene.add.image(cx, iconY, 'ui_coin_md').setDisplaySize(42, 42);
        container.add(icon);
        const amtText = this.scene.add.text(cx, iconY + 35, amountStr, {
            fontFamily: UI.FONT_STROKE, fontSize: '20px',
            color: '#ffc107', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(amtText, CARD_W - 16, 20);
        container.add(amtText);

        if (showBest) drawBadgeRibbon(this.scene, container, cx, topY, '+300%');

        const { wrap, text } = buildChoiceButton(this.scene, container, cx, topY + CARD_H - BTN_H / 2 - 12, {
            color: btnColor, dark: btnDark, label: btnLabel, onClick,
        });
        if (!showBest) this.freeBtnText = text;
        return wrap;
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
