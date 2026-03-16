import { Scene, GameObjects } from 'phaser';
import { UI, QUEST_CONFIG } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait } from '../core/orientation';
import { GameManager } from '../core/GameManager';
import { QuestType } from '../systems/QuestSystem';
import { createSceneHeader } from '../ui/SceneHeader';
import { buildQuestCards, CARD_H, CARD_GAP } from '../ui/QuestCards';
import { t } from '../data/locales';
import { formatCoins } from '../core/formatCoins';
import { addButtonFeedback } from '../ui/components/buttonFeedback';

const HEADER_H = 74;
const TRACK_H = 20, TRACK_R = 5;

export class QuestScene extends Scene {
    private manager!: GameManager;
    private timerText!: GameObjects.Text;
    private timerElapsed = 0;

    constructor() { super('QuestScene'); }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.timerElapsed = 0;
        const gw = getGameWidth(), gh = getGameHeight(), port = isPortrait();

        this.add.rectangle(gw / 2, gh / 2, gw, gh, 0x12121e);
        createSceneHeader({
            scene: this, titleKey: 'quest_scene_title', backKey: 'quest_back',
            onBack: () => this.scene.start('MainScene'),
            coins: this.manager.progression.coins,
        });

        // Layout: center content block vertically in portrait
        const trackAreaH = 80, gapTC = 40, gapCT = 30, timerH = 20;
        const cardsH = 3 * CARD_H + 2 * CARD_GAP;
        const blockH = trackAreaH + gapTC + cardsH + gapCT + timerH;
        let mY: number, qY: number, tY: number;
        if (port) {
            const top = HEADER_H + Math.round((gh - HEADER_H - blockH) / 2);
            mY = top; qY = top + trackAreaH + gapTC; tY = qY + cardsH + gapCT;
        } else {
            mY = 100; qY = 235; tY = gh - 30;
        }

        this.createMilestoneTrack(gw, mY, port);
        const ct = this.add.container(0, 0);
        buildQuestCards(this, ct, gw / 2, qY, this.manager.quests,
            (type, ad) => this.handleClaim(type, ad));

        this.timerText = this.add.text(gw / 2, tY, '', {
            fontFamily: UI.FONT_BODY, fontSize: '16px', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.updateTimerText();
    }

    private handleClaim(type: QuestType, ad: boolean): void {
        if (ad) {
            const sdk = this.registry.get('platformSDK') as
                import('../platform/PlatformSDK').PlatformSDK | undefined;
            if (sdk) {
                sdk.showRewardedBreak().then((ok: boolean) => {
                    this.manager.claimQuestReward(type, ok);
                    this.scene.restart();
                });
                return;
            }
        }
        this.manager.claimQuestReward(type, false);
        this.scene.restart();
    }

    /* ── Milestone Track (DailyBonus-style triple outline) ── */

    private createMilestoneTrack(gw: number, baseY: number, port: boolean): void {
        const ms = this.manager.quests.getMilestones();
        const mAt = QUEST_CONFIG.milestonesAt;
        const maxVal = mAt[mAt.length - 1];
        const trackW = port ? 460 : 600;
        const trackX = gw / 2 - trackW / 2;
        const barY = baseY + 36;

        this.add.text(gw / 2, baseY - 2, t('quest_daily_progress'), {
            fontFamily: UI.FONT_STROKE, fontSize: port ? '16px' : '15px',
            color: '#aaaaaa', stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);

        // Triple outline: black → gold → black (same as DailyBonusCards)
        const bg = this.add.graphics();
        bg.lineStyle(1.5, 0x000000, 0.9);
        bg.strokeRoundedRect(trackX - 4, barY - 4, trackW + 8, TRACK_H + 8, TRACK_R + 3);
        bg.lineStyle(3, 0xFEBF07, 1);
        bg.strokeRoundedRect(trackX - 2, barY - 2, trackW + 4, TRACK_H + 4, TRACK_R + 2);
        bg.lineStyle(1.5, 0x000000, 0.9);
        bg.strokeRoundedRect(trackX, barY, trackW, TRACK_H, TRACK_R);
        bg.fillStyle(0x222244, 0.6);
        bg.fillRoundedRect(trackX, barY, trackW, TRACK_H, TRACK_R);

        // Green fill with white highlight
        const fillW = Math.max(0, trackW * Math.min(1, ms.completedCount / maxVal));
        if (fillW > 0) {
            const fw = Math.min(fillW, trackW - 1);
            const fr = fw >= TRACK_H ? TRACK_R : Math.min(fw / 2, TRACK_R);
            const fill = this.add.graphics();
            fill.fillStyle(0x78C828, 1);
            fill.fillRoundedRect(trackX + 1, barY + 1, fw, TRACK_H - 2, fr);
            if (fw > 6) {
                const hlR = fw >= TRACK_H ? { tl: TRACK_R - 1, tr: TRACK_R - 1, bl: 0, br: 0 } : 0;
                fill.fillStyle(0xffffff, 0.18);
                fill.fillRoundedRect(trackX + 2, barY + 2, fw - 2, (TRACK_H - 4) * 0.4, hlR);
            }
        }

        const barCenterY = barY + TRACK_H / 2 - 1;
        for (let i = 0; i < mAt.length; i++) {
            this.createGift(trackX + trackW * (mAt[i] / maxVal), barCenterY, i,
                ms.completedCount, ms.claimedMilestones);
        }
    }

    private createGift(x: number, y: number, idx: number, done: number, claimed: number[]): void {
        const threshold = QUEST_CONFIG.milestonesAt[idx];
        const reward = QUEST_CONFIG.milestoneRewards[idx];
        const reached = done >= threshold, isClaimed = claimed.includes(idx);

        if (isClaimed) {
            const check = this.add.image(x, y, 'ui_ok_md').setDisplaySize(30, 30).setScale(0);
            this.tweens.add({ targets: check, scale: check.displayWidth / check.width,
                duration: 350, ease: 'Back.easeOut' });
        } else {
            const gift = this.add.image(x, y, 'ui_gift_md').setDisplaySize(38, 38);
            if (!reached) gift.setTint(0xaaaaaa);
            if (reached) {
                const bs = gift.scale, ps = bs * 1.08;
                const pulse = () => {
                    this.tweens.add({ targets: gift, scale: ps, duration: 150, yoyo: true,
                        ease: 'Sine.easeInOut',
                        onComplete: () => this.tweens.add({ targets: gift, scale: ps,
                            duration: 150, yoyo: true, ease: 'Sine.easeInOut' }),
                    });
                };
                pulse();
                this.time.addEvent({ delay: 2000, callback: pulse, loop: true });
                gift.setInteractive({ useHandCursor: true });
                addButtonFeedback(this, gift);
                gift.on('pointerdown', () => {
                    const c = this.manager.claimQuestMilestone(idx);
                    if (c > 0) {
                        this.showCoinGain(x, y, c);
                        this.time.delayedCall(800, () => this.scene.restart());
                    }
                });
            }
        }

        // Coin icon + amount label under gift
        const label = this.add.text(0, 0, formatCoins(reward), {
            fontFamily: UI.FONT_STROKE, fontSize: '11px',
            color: reached ? '#ffc107' : '#666688', stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0, 0.5);
        const iw = 14, gap = 2, tw = iw + gap + label.width, sx = x - tw / 2;
        label.setPosition(sx + iw + gap, y + 28);
        const ci = this.add.image(sx + iw / 2, y + 28, 'ui_coin_sm').setDisplaySize(14, 14);
        if (!reached) ci.setTint(0xaaaaaa);
    }

    update(_time: number, delta: number): void {
        this.manager.update(delta);
        this.timerElapsed += delta;
        if (this.timerElapsed >= 1000) { this.timerElapsed -= 1000; this.updateTimerText(); }
    }

    private updateTimerText(): void {
        const s = this.manager.quests.getSecondsUntilReset();
        const pad = (n: number) => String(n).padStart(2, '0');
        this.timerText.setText(t('quest_timer', {
            time: `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`,
        }));
    }

    private showCoinGain(wx: number, wy: number, amount: number): void {
        const icon = this.add.image(wx - 10, wy, 'ui_coin_sm').setDisplaySize(18, 18).setDepth(10);
        const txt = this.add.text(wx + 6, wy, `+${formatCoins(amount)}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '16px', color: '#ffc107',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0, 0.5).setDepth(10);
        this.tweens.add({ targets: [icon, txt], y: wy - 35, alpha: 0, duration: 800, ease: 'Power2',
            onComplete: () => { icon.destroy(); txt.destroy(); },
        });
    }
}
