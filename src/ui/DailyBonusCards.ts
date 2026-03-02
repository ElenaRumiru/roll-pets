import { Scene } from 'phaser';
import { GAME_WIDTH, UI, DAILY_BONUS_CONFIG } from '../core/config';
import { DailyBonusSystem } from '../systems/DailyBonusSystem';
import { GameManager } from '../core/GameManager';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { fitText } from './components/fitText';
import { DailyBonusReward } from '../types';

const CARD_W = 108, CARD_H = 100, CARD_GAP = 10, CARD_R = 12, trackH = 8;
const DAY7_H = CARD_H * 2 + CARD_GAP;
const BUFF_ICON: Record<string, string> = {
    lucky: 'ui_x2simple_mid', super: 'ui_x3wow_mid', epic: 'ui_x5wow_mid',
};
const BUFF_CLR: Record<string, string> = {
    lucky: '#78C828', super: '#4FC3F7', epic: '#ffc107',
};

export { CARD_H, CARD_GAP };

export function createCardGrid(scene: Scene, gridTop: number, db: DailyBonusSystem): void {
    const gridW = CARD_W * 4 + CARD_GAP * 3;
    const startX = GAME_WIDTH / 2 - gridW / 2;

    for (let i = 0; i < 7; i++) {
        let cx: number, cy: number, w: number, h: number;
        if (i < 3) {
            cx = startX + i * (CARD_W + CARD_GAP) + CARD_W / 2;
            cy = gridTop + CARD_H / 2;
            w = CARD_W; h = CARD_H;
        } else if (i < 6) {
            cx = startX + (i - 3) * (CARD_W + CARD_GAP) + CARD_W / 2;
            cy = gridTop + CARD_H + CARD_GAP + CARD_H / 2;
            w = CARD_W; h = CARD_H;
        } else {
            cx = startX + 3 * (CARD_W + CARD_GAP) + CARD_W / 2;
            cy = gridTop + DAY7_H / 2;
            w = CARD_W; h = DAY7_H;
        }
        drawCard(scene, cx, cy, w, h, i, db);
    }
}

function drawCard(scene: Scene, cx: number, cy: number, w: number, h: number,
    dayIdx: number, db: DailyBonusSystem): void {
    const isPast = dayIdx < db.weekDay;
    const isToday = dayIdx === db.weekDay;
    const isTomorrow = dayIdx === db.weekDay + 1 && db.claimedToday;
    const isDone = isPast || (isToday && db.claimedToday);
    const reward = db.getRewardForDay(dayIdx);

    // Background
    const g = scene.add.graphics();
    const bgClr = isToday && !db.claimedToday ? 0x1a2a1a : (isDone ? 0x222233 : 0x1a1a2e);
    const bgAlpha = isDone ? 0.8 : (isToday && !db.claimedToday ? 1 : 0.9);
    g.fillStyle(bgClr, bgAlpha);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, CARD_R);
    if (isToday && !db.claimedToday) {
        g.lineStyle(2.5, 0x78C828, 0.9);
    } else {
        g.lineStyle(1.5, 0x333355, 0.5);
    }
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, CARD_R);

    // Day label
    let dayLabel: string;
    if (isToday) dayLabel = t('daily_bonus_today');
    else if (isTomorrow) dayLabel = t('daily_bonus_tomorrow');
    else dayLabel = t('daily_bonus_day', { day: String(dayIdx + 1) });

    const labelClr = isToday && !db.claimedToday ? '#78C828' : (isDone ? '#888899' : '#ffffff');
    scene.add.text(cx, cy - h / 2 + 16, dayLabel, {
        fontFamily: UI.FONT_STROKE, fontSize: '13px', color: labelClr,
        stroke: '#000000', strokeThickness: 1.5,
    }).setOrigin(0.5);

    // Center icon
    const iconY = cy + 2;
    const iconSize = dayIdx === 6 ? 64 : 46;

    if (isDone) {
        drawRewardIcon(scene, cx, iconY, iconSize, reward, 0.5);
        scene.add.image(cx + iconSize / 3, cy - iconSize / 3, 'ui_ok_sm').setDisplaySize(20, 20);
    } else {
        const giftSize = dayIdx === 6 ? 76 : 50;
        const gift = scene.add.image(cx, iconY, 'ui_gift_md').setDisplaySize(giftSize, giftSize);
        if (!isToday) gift.setAlpha(0.7);
    }

    // Reward text — fixed for days 1-6, icon-relative for day 7
    const textY = dayIdx === 6 ? iconY + 52 : cy + h / 2 - 16;
    const desc = rewardText(reward);
    const descClr = isDone ? '#666688' : getRewardColor(reward);
    const descText = scene.add.text(cx, textY, desc, {
        fontFamily: UI.FONT_STROKE, fontSize: '11px', color: descClr,
        stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    fitText(descText, w - 10, 11);
}

function drawRewardIcon(scene: Scene, cx: number, cy: number,
    size: number, reward: DailyBonusReward, alpha: number): void {
    if (reward.type === 'egg' && reward.eggTier) {
        const eggSize = Math.round(size * 1.3);
        scene.add.image(cx, cy, `egg_${reward.eggTier}_sm`)
            .setDisplaySize(eggSize, eggSize).setAlpha(alpha);
    } else if (reward.type === 'buff' && reward.buffType) {
        scene.add.image(cx, cy, BUFF_ICON[reward.buffType] || 'ui_x2simple_mid')
            .setDisplaySize(size, size).setAlpha(alpha);
    } else {
        scene.add.image(cx, cy, 'ui_coin_md').setDisplaySize(size, size).setAlpha(alpha);
    }
}

function getRewardColor(reward: DailyBonusReward): string {
    if (reward.type === 'buff' && reward.buffType) return BUFF_CLR[reward.buffType] || '#ffffff';
    if (reward.type === 'egg') return '#e0a050';
    return '#ffc107';
}

function rewardText(r: DailyBonusReward): string {
    if (r.type === 'coins') return `${r.count} ${t('coins')}`;
    if (r.type === 'egg' && r.eggTier) return `${r.count}x ${t(`egg_tier_${r.eggTier}`)}`;
    const name = r.buffType === 'lucky' ? 'Lucky' : r.buffType === 'super' ? 'Super' : 'Epic';
    return `${r.count}x ${name}`;
}

export function createMilestoneTrack(scene: Scene, trackY: number, manager: GameManager): void {
    const db = manager.dailyBonus;
    const cfg = DAILY_BONUS_CONFIG;
    const maxVal = cfg.monthCycleDays;
    const trackW = CARD_W * 4 + CARD_GAP * 3;
    const trackX = GAME_WIDTH / 2 - trackW / 2;
    const barY = trackY + 14;

    const bg = scene.add.graphics();
    bg.fillStyle(0x222244, 0.6);
    bg.fillRoundedRect(trackX, barY, trackW, trackH, trackH / 2);

    const fillW = Math.max(0, trackW * Math.min(1, db.totalLogins / maxVal));
    if (fillW > 0) {
        const fill = scene.add.graphics();
        fill.fillStyle(0x78C828, 1);
        fill.fillRoundedRect(trackX, barY, fillW, trackH, trackH / 2);
    }

    for (let i = 0; i < cfg.milestoneThresholds.length; i++) {
        const pct = cfg.milestoneThresholds[i] / maxVal;
        drawMilestoneGift(scene, trackX + trackW * pct, barY - 5, i, manager);
    }
}

function drawMilestoneGift(scene: Scene, x: number, y: number,
    index: number, manager: GameManager): void {
    const cfg = DAILY_BONUS_CONFIG;
    const db = manager.dailyBonus;
    const threshold = cfg.milestoneThresholds[index];
    const reached = db.totalLogins >= threshold;
    const isClaimed = db.monthMilestonesClaimed[index];
    const claimable = reached && !isClaimed;

    if (isClaimed) {
        scene.add.image(x, y - 14, 'ui_ok_md').setDisplaySize(30, 30);
    } else {
        const gift = scene.add.image(x, y - 14, 'ui_gift_md').setDisplaySize(38, 38);
        if (!reached) gift.setTint(0x555555);
        if (claimable) {
            const base = gift.scale, pulse = base * 1.08;
            const doPulse = () => {
                scene.tweens.add({
                    targets: gift, scale: pulse, duration: 150, yoyo: true,
                    ease: 'Sine.easeInOut',
                    onComplete: () => scene.tweens.add({
                        targets: gift, scale: pulse, duration: 150, yoyo: true,
                        ease: 'Sine.easeInOut',
                    }),
                });
            };
            doPulse();
            scene.time.addEvent({ delay: 2000, callback: doPulse, loop: true });
            gift.setInteractive({ useHandCursor: true });
            addButtonFeedback(scene, gift);
            gift.on('pointerdown', () => {
                const coins = manager.claimDailyMilestone(index);
                if (coins > 0) {
                    showCoinGain(scene, x, y - 14, coins);
                    scene.time.delayedCall(800, () => scene.scene.restart());
                }
            });
        }
    }

    scene.add.text(x, y + 24, t('daily_bonus_day', { day: String(threshold) }), {
        fontFamily: UI.FONT_STROKE, fontSize: '11px',
        color: reached ? '#ffffff' : '#666688',
        stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
}

function showCoinGain(scene: Scene, wx: number, wy: number, amount: number): void {
    const icon = scene.add.image(wx - 10, wy, 'ui_coin_sm').setDisplaySize(18, 18).setDepth(10);
    const txt = scene.add.text(wx + 6, wy, `+${fmtCoins(amount)}`, {
        fontFamily: UI.FONT_STROKE, fontSize: '16px', color: '#ffc107',
        stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5).setDepth(10);
    scene.tweens.add({
        targets: [icon, txt], y: wy - 35, alpha: 0, duration: 800, ease: 'Power2',
        onComplete: () => { icon.destroy(); txt.destroy(); },
    });
}

function fmtCoins(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString('en-US');
}
