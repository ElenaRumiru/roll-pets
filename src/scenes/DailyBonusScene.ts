import { Scene, GameObjects } from 'phaser';
import { UI } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait } from '../core/orientation';
import { GameManager } from '../core/GameManager';
import { t } from '../data/locales';
import { addButtonFeedback } from '../ui/components/buttonFeedback';
import { addShineEffect } from '../ui/components/shineEffect';
import { showToast } from '../ui/components/Toast';
import { createCardGrid, createMilestoneTrack, CARD_H, CARD_GAP } from '../ui/DailyBonusCards';
import { createSceneHeader } from '../ui/SceneHeader';
import { EventBus } from '../core/EventBus';

const GRID_W = 108 * 4 + 10 * 3; // CARD_W * 4 + CARD_GAP * 3
const PORT_CARD_H = 130; // taller cards in portrait (landscape: 100)
const FREE_CLR = 0x78C828;
const FREE_DRK = 0x4E8A18;

export class DailyBonusScene extends Scene {
    private manager!: GameManager;
    private timerText!: GameObjects.Text;
    private timerElapsed = 0;
    private timerAboveBtnY = 0;
    private claimY = 0;

    constructor() { super('DailyBonusScene'); }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.timerElapsed = 0;
        const gw = getGameWidth(), gh = getGameHeight();
        const port = isPortrait();

        let hintY: number, trackY: number, gridTop: number;
        let hintSize: string, trackW: number | undefined;

        if (port) {
            const headerH = 74;
            const portDay7H = PORT_CARD_H * 2 + CARD_GAP;
            const hintH = 20, gapHT = 42, trackAreaH = 55, gapTG = 40;
            const gapGTimer = 40, timerH = 20, gapTimerBtn = 65, btnH = 44;
            const blockH = hintH + gapHT + trackAreaH + gapTG + portDay7H
                + gapGTimer + timerH + gapTimerBtn + btnH;
            const topOffset = headerH + Math.round((gh - headerH - blockH) / 2);
            hintY = topOffset + hintH / 2;
            trackY = Math.round(hintY + hintH / 2 + gapHT);
            gridTop = Math.round(trackY + trackAreaH + gapTG);
            hintSize = '18px';
            trackW = Math.round(GRID_W * 0.85);
        } else {
            hintY = 98;
            trackY = 130;
            gridTop = 200;
            hintSize = '14px';
            trackW = undefined;
        }

        this.add.rectangle(gw / 2, gh / 2, gw, gh, 0x12121e);
        createSceneHeader({
            scene: this, titleKey: 'daily_bonus_title', backKey: 'daily_bonus_back',
            onBack: () => this.scene.start('MainScene'),
            coins: this.manager.progression.coins,
        });
        this.add.text(gw / 2, hintY, t('daily_bonus_hint'), {
            fontFamily: UI.FONT_BODY, fontSize: hintSize, color: '#aaaaaa',
        }).setOrigin(0.5);
        createMilestoneTrack(this, trackY, this.manager, trackW);
        const cardH = port ? PORT_CARD_H : undefined;
        createCardGrid(this, gridTop, this.manager.dailyBonus, cardH);
        const day7h = port ? PORT_CARD_H * 2 + CARD_GAP : CARD_H * 2 + CARD_GAP;
        this.timerAboveBtnY = gridTop + day7h + (port ? 40 : 30);
        this.claimY = this.timerAboveBtnY + (port ? 65 : 42);
        this.createClaimButton();
        this.createTimer();
        EventBus.on('assets-loaded', this.onAssetsLoaded, this);
        this.events.on('shutdown', () => EventBus.off('assets-loaded', this.onAssetsLoaded, this));
    }

    private onAssetsLoaded(type: string): void {
        if (type === 'eggs') this.scene.restart();
    }

    private createClaimButton(): void {
        const db = this.manager.dailyBonus;
        const canClaim = db.hasPending;
        const pending = db.pendingDays;
        const label = canClaim
            ? (pending > 1 ? `${t('daily_bonus_claim')} (${pending})` : t('daily_bonus_claim'))
            : t('daily_bonus_claimed');
        const clr = canClaim ? FREE_CLR : 0x555566;
        const drk = canClaim ? FREE_DRK : 0x333344;
        const bw = 180, bh = 44, br = bh / 2;

        const wrap = this.add.container(getGameWidth() / 2, this.claimY);
        const g = this.add.graphics();
        g.fillStyle(drk, 1);
        g.fillRoundedRect(-bw / 2, -bh / 2 + 2, bw, bh, br);
        g.fillStyle(clr, 1);
        g.fillRoundedRect(-bw / 2, -bh / 2, bw, bh - 2, br);
        if (canClaim) {
            g.fillStyle(0xffffff, 0.15);
            g.fillRoundedRect(-bw / 2 + 3, -bh / 2 + 1, bw - 6, (bh - 2) * 0.4,
                { tl: br - 1, tr: br - 1, bl: 0, br: 0 });
        }
        g.lineStyle(1, 0x000000, 0.2);
        g.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, br);
        wrap.add(g);

        const txt = this.add.text(0, -1, label, {
            fontFamily: UI.FONT_STROKE, fontSize: '18px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        wrap.add(txt);

        if (canClaim) {
            wrap.setSize(bw, bh + 2);
            addShineEffect(this, wrap, bw, bh, br);
            wrap.setInteractive({ useHandCursor: true });
            wrap.on('pointerdown', () => {
                const rewards = this.manager.claimDailyBonus();
                for (const reward of rewards) {
                    if (reward.type === 'egg' && reward.eggTier) {
                        const eggName = t(`egg_tier_${reward.eggTier}`);
                        showToast(this, t('toast_received', { count: reward.count, item: eggName }), 'info');
                    } else if (reward.type === 'buff' && reward.buffType) {
                        const name = t(`badge_${reward.buffType}`);
                        showToast(this, t('toast_received', { count: reward.count, item: name }), 'info');
                    } else if (reward.type === 'coins') {
                        showToast(this, t('toast_received', { count: reward.count, item: t('coins') }), 'info');
                    }
                }
                wrap.disableInteractive();
                this.scene.restart();
            });
            addButtonFeedback(this, wrap);
        }
    }

    private createTimer(): void {
        this.timerText = this.add.text(getGameWidth() / 2, this.timerAboveBtnY, '', {
            fontFamily: UI.FONT_BODY, fontSize: '14px', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.updateTimerText();
    }

    update(_time: number, delta: number): void {
        this.manager.update(delta);
        this.timerElapsed += delta;
        if (this.timerElapsed >= 1000) {
            this.timerElapsed -= 1000;
            this.updateTimerText();
        }
    }

    private updateTimerText(): void {
        const secs = this.manager.dailyBonus.getSecondsUntilReset();
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        this.timerText.setText(t('daily_bonus_timer', { time }));
    }
}
