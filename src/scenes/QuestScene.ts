import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI, QUEST_CONFIG } from '../core/config';
import { GameManager } from '../core/GameManager';
import { QuestType } from '../systems/QuestSystem';
import { Button } from '../ui/components/Button';
import { t } from '../data/locales';
import { fitText } from '../ui/components/fitText';
import { addButtonFeedback } from '../ui/components/buttonFeedback';
import { addShineEffect } from '../ui/components/shineEffect';

const HEADER_H = 74;
const MILESTONE_Y = 120;
const QUEST_START_Y = 215;
const CARD_W = 700;
const CARD_H = 90;
const CARD_H_EXP = CARD_H;
const CARD_GAP = 12;
const CARD_R = 14;
const BAR_W = 280;
const BAR_H = 20;
const BAR_R = BAR_H / 2;
const BAR_COLOR = 0xffc107;
const FREE_CLR = 0x78C828;
const FREE_DRK = 0x4E8A18;
const AD_CLR = 0x7B2FBE;
const AD_DRK = 0x4A1A72;
const BUFF_ICON: Record<string, string> = {
    lucky: 'luck_x2_lg', super: 'luck_x3_lg', epic: 'luck_x5_lg',
};
const BUFF_CLR: Record<string, string> = {
    lucky: '#78C828', super: '#4FC3F7', epic: '#ffc107',
};
const MBTN_W = 100;
const MBTN_H = 28;
const MBTN_R = MBTN_H / 2;
const MINI_W = 155;
const MINI_GAP = 10;
const MINI_R = 10;

export class QuestScene extends Scene {
    private manager!: GameManager;
    private timerText!: GameObjects.Text;
    private timerElapsed = 0;
    private milestoneGifts: GameObjects.Container[] = [];
    private questCards!: GameObjects.Container;

    constructor() { super('QuestScene'); }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.timerElapsed = 0;
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);
        this.createHeader();
        this.createMilestoneTrack();
        this.questCards = this.add.container(0, 0);
        this.buildQuestCards();
        this.createTimer();
    }

    private createHeader(): void {
        const hdr = this.add.graphics();
        hdr.fillStyle(0x000000, 0.5);
        hdr.fillRect(0, 0, GAME_WIDTH, HEADER_H);
        hdr.lineStyle(1, UI.PANEL_BORDER, 0.3);
        hdr.lineBetween(0, HEADER_H, GAME_WIDTH, HEADER_H);
        new Button(this, 68, 37, 111, 39, `\u2190 ${t('quest_back')}`, 0x444455, () => {
            this.scene.start('MainScene');
        });
        this.add.text(GAME_WIDTH / 2, 37, t('quest_scene_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '25px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add.image(GAME_WIDTH - 123, 37, 'ui_coin_md').setDisplaySize(35, 35);
        this.add.text(GAME_WIDTH - 101, 37, this.formatCoins(this.manager.progression.coins), {
            fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0, 0.5);
    }

    private createMilestoneTrack(): void {
        const ms = this.manager.quests.getMilestones();
        const milestoneAt = QUEST_CONFIG.milestonesAt;
        const maxVal = milestoneAt[milestoneAt.length - 1];
        const trackW = 600, trackH = 8;
        const trackX = GAME_WIDTH / 2 - trackW / 2;
        const trackY = MILESTONE_Y + 36;

        this.add.text(GAME_WIDTH / 2, MILESTONE_Y - 18, t('quest_daily_progress'), {
            fontFamily: UI.FONT_STROKE, fontSize: '15px', color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);

        const trackBg = this.add.graphics();
        trackBg.fillStyle(0x222244, 0.6);
        trackBg.fillRoundedRect(trackX, trackY, trackW, trackH, trackH / 2);

        const progress = Math.min(1, ms.completedCount / maxVal);
        const fillW = Math.max(0, trackW * progress);
        if (fillW > 0) {
            const trackFill = this.add.graphics();
            trackFill.fillStyle(0x78C828, 1);
            trackFill.fillRoundedRect(trackX, trackY, fillW, trackH, trackH / 2);
        }

        this.add.text(GAME_WIDTH / 2, trackY + trackH + 15, `${ms.completedCount}/${maxVal}`, {
            fontFamily: UI.FONT_BODY, fontSize: '13px', color: '#aaaaaa',
        }).setOrigin(0.5);

        this.milestoneGifts = [];
        for (let i = 0; i < milestoneAt.length; i++) {
            const pct = milestoneAt[i] / maxVal;
            const gx = trackX + trackW * pct;
            const gy = trackY - 5;
            this.createMilestoneGift(gx, gy, i, ms.completedCount, ms.claimedMilestones);
        }
    }

    private createMilestoneGift(x: number, y: number, index: number, completed: number, claimed: number[]): void {
        const threshold = QUEST_CONFIG.milestonesAt[index];
        const reward = QUEST_CONFIG.milestoneRewards[index];
        const reached = completed >= threshold;
        const isClaimed = claimed.includes(index);
        const claimable = reached && !isClaimed;
        const container = this.add.container(x, y);

        if (isClaimed) {
            container.add(this.add.image(0, -14, 'ui_ok_md').setDisplaySize(30, 30));
        } else {
            const gift = this.add.image(0, -14, 'ui_gift_md').setDisplaySize(38, 38);
            if (!reached) gift.setTint(0x555555);
            container.add(gift);
            if (claimable) {
                // Double-pulse animation every 2 seconds
                const baseScale = gift.scale;
                const pulseScale = baseScale * 1.08;
                const doublePulse = () => {
                    this.tweens.add({
                        targets: gift, scale: pulseScale,
                        duration: 150, yoyo: true, ease: 'Sine.easeInOut',
                        onComplete: () => {
                            this.tweens.add({
                                targets: gift, scale: pulseScale,
                                duration: 150, yoyo: true, ease: 'Sine.easeInOut',
                            });
                        },
                    });
                };
                doublePulse();
                this.time.addEvent({ delay: 2000, callback: doublePulse, loop: true });
                gift.setInteractive({ useHandCursor: true });
                gift.on('pointerdown', () => {
                    const coins = this.manager.claimQuestMilestone(index);
                    if (coins > 0) {
                        this.showCoinGain(x, y - 14, coins);
                        this.time.delayedCall(800, () => this.scene.restart());
                    }
                });
            }
        }

        // Coin icon + gold amount centered under gift
        const coinLabel = this.add.text(0, 24, this.formatCoins(reward), {
            fontFamily: UI.FONT_STROKE, fontSize: '11px',
            color: reached ? '#ffc107' : '#666688',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0, 0.5);
        const iconW = 14, gap = 2;
        const totalW = iconW + gap + coinLabel.width;
        const startX = -totalW / 2;
        coinLabel.setX(startX + iconW + gap);
        const coinIcon = this.add.image(startX + iconW / 2, 24, 'ui_coin_sm').setDisplaySize(14, 14);
        if (!reached) coinIcon.setTint(0x555555);
        container.add(coinIcon);
        container.add(coinLabel);
        this.milestoneGifts.push(container);
    }

    private buildQuestCards(): void {
        this.questCards.removeAll(true);
        const types: QuestType[] = ['roll', 'grade', 'online'];
        const cx = GAME_WIDTH / 2;
        let y = QUEST_START_Y;
        for (const type of types) {
            const done = this.isQuestDone(type);
            const h = done ? CARD_H_EXP : CARD_H;
            this.createQuestCard(cx, y, type, done, h);
            y += h + CARD_GAP;
        }
    }

    private isQuestDone(type: QuestType): boolean {
        const q = this.manager.quests;
        if (type === 'roll') return q.isRollQuestComplete();
        if (type === 'grade') return q.isGradeQuestComplete();
        return q.isOnlineComplete();
    }

    private createQuestCard(cx: number, topY: number, type: QuestType, complete: boolean, cardH: number): void {
        const quests = this.manager.quests;
        const container = this.add.container(0, 0);
        const cfg = this.manager.quests.getReward(type);

        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.9);
        bg.fillRoundedRect(cx - CARD_W / 2, topY, CARD_W, cardH, CARD_R);
        bg.lineStyle(1.5, 0x333355, 0.5);
        bg.strokeRoundedRect(cx - CARD_W / 2, topY, CARD_W, cardH, CARD_R);
        container.add(bg);

        // Quest data
        let questName: string, current: number, target: number;
        if (type === 'roll') {
            const rq = quests.getRollQuest();
            questName = `\u25C6 ${t('quest_roll', { target: String(rq.target) })}`;
            current = rq.current; target = rq.target;
        } else if (type === 'grade') {
            const gq = quests.getGradeQuest();
            const gradeName = t(`grade_${quests.getRequiredGrade()}`);
            const key = gq.target > 1 ? 'quest_grade_n' : 'quest_grade';
            questName = `\u25C6 ${t(key, { grade: gradeName, target: String(gq.target) })}`;
            current = gq.current; target = gq.target;
        } else {
            const oq = quests.getOnlineQuest();
            questName = `\u25C6 ${t('quest_online', { target: String(Math.round(oq.target / 60)) })}`;
            current = Math.floor(oq.current); target = oq.target;
        }

        // Left: quest title
        const nameY = complete ? topY + 22 : topY + 20;
        const nameText = this.add.text(cx - CARD_W / 2 + 20, nameY, questName, {
            fontFamily: UI.FONT_STROKE, fontSize: '16px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0, 0.5);
        fitText(nameText, 280, 16);
        container.add(nameText);

        // Left: progress bar
        const barX = cx - CARD_W / 2 + 20;
        const barY = topY + 50;
        this.drawProgressBar(container, barX, barY, current, target, BAR_COLOR);

        // Progress text on bar
        let progressStr: string;
        if (type === 'online') {
            const cm = Math.floor(current / 60), cs = current % 60;
            const tm = Math.floor(target / 60), ts = target % 60;
            progressStr = `${cm}:${String(cs).padStart(2, '0')} / ${tm}:${String(ts).padStart(2, '0')}`;
        } else {
            progressStr = `${current}/${target}`;
        }
        container.add(this.add.text(barX + BAR_W / 2, barY + BAR_H / 2, progressStr, {
            fontFamily: UI.FONT_STROKE, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));

        if (complete) {
            this.addInlineRewards(container, cx, topY, cardH, type, cfg);
        } else {
            // "Reward" header + large buff icon on the right
            const rightCX = cx + CARD_W / 2 - 70;
            container.add(this.add.text(rightCX, topY + 14, `${t('quest_reward')}:`, {
                fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
                stroke: '#000000', strokeThickness: UI.STROKE_THIN,
            }).setOrigin(0.5));
            const iconKey = BUFF_ICON[cfg.buffType] || 'luck_x2_lg';
            container.add(this.add.image(rightCX, topY + 54, iconKey).setDisplaySize(57, 57));
        }
        this.questCards.add(container);
    }

    private addInlineRewards(
        ct: GameObjects.Container, cx: number, topY: number, cardH: number,
        type: QuestType, cfg: { freeCount: number; adCount: number; buffType: string },
    ): void {
        const buffKey = cfg.buffType;
        const rEnd = cx + CARD_W / 2 - 12;
        const aX = rEnd - MINI_W / 2;
        const fX = aX - MINI_W - MINI_GAP;
        const miniTop = topY + 6;
        const miniH = cardH - 12;
        const buffClr = BUFF_CLR[buffKey] || '#ffffff';

        // Mini-card backgrounds
        const mcg = this.add.graphics();
        mcg.fillStyle(0x111122, 0.8);
        mcg.fillRoundedRect(fX - MINI_W / 2, miniTop, MINI_W, miniH, MINI_R);
        mcg.lineStyle(1, 0x78C828, 0.35);
        mcg.strokeRoundedRect(fX - MINI_W / 2, miniTop, MINI_W, miniH, MINI_R);
        mcg.fillRoundedRect(aX - MINI_W / 2, miniTop, MINI_W, miniH, MINI_R);
        mcg.lineStyle(1, 0x7B2FBE, 0.35);
        mcg.strokeRoundedRect(aX - MINI_W / 2, miniTop, MINI_W, miniH, MINI_R);
        ct.add(mcg);

        // FREE column — reward header + colored chance + button
        const fd = this.add.text(fX, miniTop + 16, t(`buff_${buffKey}`, { count: cfg.freeCount }), {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1.5,
        }).setOrigin(0.5);
        fitText(fd, MINI_W - 12, 14);
        ct.add(fd);
        ct.add(this.add.text(fX, miniTop + 30, t(`buff_desc_${buffKey}`), {
            fontFamily: UI.FONT_STROKE, fontSize: '10px', color: buffClr,
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));
        this.addMiniBtn(ct, fX, miniTop + 54, t('quest_claim'), FREE_CLR, FREE_DRK, () => {
            this.manager.claimQuestReward(type, false);
            this.scene.restart();
        });

        // AD column — reward header + colored chance + button
        const ad = this.add.text(aX, miniTop + 16, t(`buff_${buffKey}`, { count: cfg.adCount }), {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1.5,
        }).setOrigin(0.5);
        fitText(ad, MINI_W - 12, 14);
        ct.add(ad);
        ct.add(this.add.text(aX, miniTop + 30, t(`buff_desc_${buffKey}`), {
            fontFamily: UI.FONT_STROKE, fontSize: '10px', color: buffClr,
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));
        this.addMiniBtn(ct, aX, miniTop + 54, t('quest_watch'), AD_CLR, AD_DRK, () => {
            const sdk = this.registry.get('platformSDK') as
                import('../platform/PlatformSDK').PlatformSDK | undefined;
            if (sdk) {
                sdk.showRewardedBreak().then((ok: boolean) => {
                    this.manager.claimQuestReward(type, ok);
                    this.scene.restart();
                });
            } else {
                this.manager.claimQuestReward(type, true);
                this.scene.restart();
            }
        });
    }

    private addMiniBtn(
        ct: GameObjects.Container, cx: number, cy: number,
        label: string, clr: number, drk: number, onClick: () => void,
    ): void {
        const wrap = this.add.container(cx, cy);
        const g = this.add.graphics();
        g.fillStyle(drk, 1);
        g.fillRoundedRect(-MBTN_W / 2, -MBTN_H / 2 + 2, MBTN_W, MBTN_H, MBTN_R);
        g.fillStyle(clr, 1);
        g.fillRoundedRect(-MBTN_W / 2, -MBTN_H / 2, MBTN_W, MBTN_H - 2, MBTN_R);
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(-MBTN_W / 2 + 3, -MBTN_H / 2 + 1, MBTN_W - 6, (MBTN_H - 2) * 0.4,
            { tl: MBTN_R - 1, tr: MBTN_R - 1, bl: 0, br: 0 });
        g.lineStyle(1, 0x000000, 0.2);
        g.strokeRoundedRect(-MBTN_W / 2, -MBTN_H / 2, MBTN_W, MBTN_H, MBTN_R);
        wrap.add(g);
        const txt = this.add.text(0, -1, label, {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1.5,
        }).setOrigin(0.5);
        fitText(txt, MBTN_W - 10, 12);
        wrap.add(txt);
        wrap.setSize(MBTN_W, MBTN_H + 2);
        addShineEffect(this, wrap, MBTN_W, MBTN_H, MBTN_R);
        wrap.setInteractive({ useHandCursor: true });
        wrap.on('pointerdown', onClick);
        addButtonFeedback(this, wrap);
        ct.add(wrap);
    }

    private drawProgressBar(container: GameObjects.Container, x: number, y: number,
        current: number, target: number, color: number): void {
        const bg = this.add.graphics();
        bg.fillStyle(0x222244, 0.5);
        bg.fillRoundedRect(x, y, BAR_W, BAR_H, BAR_R);
        bg.lineStyle(2, 0x000000, 0.3);
        bg.strokeRoundedRect(x, y, BAR_W, BAR_H, BAR_R);
        container.add(bg);

        const progress = Math.min(1, target > 0 ? current / target : 0);
        const fillW = Math.max(0, (BAR_W - 4) * progress);
        if (fillW >= 4) {
            const fill = this.add.graphics();
            const r = Math.min(BAR_R - 1, fillW / 2);
            fill.fillStyle(color, 1);
            fill.fillRoundedRect(x + 2, y + 2, fillW, BAR_H - 4, r);
            if (fillW > 4) {
                const hr = fillW >= BAR_H - 4 ? { tl: r - 1, tr: r - 1, bl: 0, br: 0 } : 0;
                fill.fillStyle(0xffffff, 0.2);
                fill.fillRoundedRect(x + 3, y + 3, fillW - 2, (BAR_H - 6) * 0.4, hr);
            }
            container.add(fill);
        }
    }

    private createTimer(): void {
        this.timerText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '', {
            fontFamily: UI.FONT_BODY, fontSize: '16px', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.updateTimerText();
    }

    update(_time: number, delta: number): void {
        this.timerElapsed += delta;
        if (this.timerElapsed >= 1000) {
            this.timerElapsed -= 1000;
            this.updateTimerText();
        }
    }

    private updateTimerText(): void {
        const secs = this.manager.quests.getSecondsUntilReset();
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        this.timerText.setText(t('quest_timer', { time }));
    }

    private showCoinGain(worldX: number, worldY: number, amount: number): void {
        const icon = this.add.image(worldX - 10, worldY, 'ui_coin_sm')
            .setDisplaySize(18, 18).setDepth(10);
        const txt = this.add.text(worldX + 6, worldY, `+${this.formatCoins(amount)}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '16px', color: '#ffc107',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0, 0.5).setDepth(10);
        this.tweens.add({
            targets: [icon, txt], y: worldY - 35, alpha: 0,
            duration: 800, ease: 'Power2',
            onComplete: () => { icon.destroy(); txt.destroy(); },
        });
    }

    private formatCoins(n: number): string {
        if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
        return n.toLocaleString('en-US');
    }
}
