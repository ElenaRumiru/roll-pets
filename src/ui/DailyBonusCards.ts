import { Scene } from 'phaser';
import { UI, DAILY_BONUS_CONFIG } from '../core/config';
import { getGameWidth } from '../core/orientation';
import { DailyBonusSystem } from '../systems/DailyBonusSystem';
import { GameManager } from '../core/GameManager';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { fitText } from './components/fitText';
import { DailyBonusReward } from '../types';

const CARD_W = 108, CARD_H = 100, CARD_GAP = 10, CARD_R = 12;
const TRACK_H = 20, TRACK_R = 5;
const BUFF_ICON: Record<string, string> = {
    lucky: 'luck_x2_lg', super: 'luck_x3_lg', epic: 'luck_x5_lg',
};
const BUFF_CLR: Record<string, string> = {
    lucky: '#78C828', super: '#4FC3F7', epic: '#ffc107',
};

export { CARD_H, CARD_GAP };

export function createCardGrid(scene: Scene, gridTop: number, db: DailyBonusSystem,
    cardHeight?: number): void {
    const ch = cardHeight ?? CARD_H;
    const day7h = ch * 2 + CARD_GAP;
    const gridW = CARD_W * 4 + CARD_GAP * 3;
    const startX = getGameWidth() / 2 - gridW / 2;

    for (let i = 0; i < 7; i++) {
        let cx: number, cy: number, w: number, h: number;
        if (i < 3) {
            cx = startX + i * (CARD_W + CARD_GAP) + CARD_W / 2;
            cy = gridTop + ch / 2;
            w = CARD_W; h = ch;
        } else if (i < 6) {
            cx = startX + (i - 3) * (CARD_W + CARD_GAP) + CARD_W / 2;
            cy = gridTop + ch + CARD_GAP + ch / 2;
            w = CARD_W; h = ch;
        } else {
            cx = startX + 3 * (CARD_W + CARD_GAP) + CARD_W / 2;
            cy = gridTop + day7h / 2;
            w = CARD_W; h = day7h;
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
        // Triple black-yellow-black outline
        g.lineStyle(1.5, 0x000000, 0.9);
        g.strokeRoundedRect(cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8, CARD_R + 3);
        g.lineStyle(3, 0xFEBF07, 1);
        g.strokeRoundedRect(cx - w / 2 - 2, cy - h / 2 - 2, w + 4, h + 4, CARD_R + 2);
        g.lineStyle(1.5, 0x000000, 0.9);
        g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, CARD_R);
    } else {
        g.lineStyle(1.5, 0x333355, 0.5);
        g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, CARD_R);
    }

    // Day label
    let dayLabel: string;
    if (isToday) dayLabel = t('daily_bonus_today');
    else if (isTomorrow) dayLabel = t('daily_bonus_tomorrow');
    else dayLabel = t('daily_bonus_day', { day: String(dayIdx + 1) });

    const labelClr = isToday && !db.claimedToday ? '#FEBf07' : (isDone ? '#888899' : '#ffffff');
    scene.add.text(cx, cy - h / 2 + 16, dayLabel, {
        fontFamily: UI.FONT_STROKE, fontSize: '13px', color: labelClr,
        stroke: '#000000', strokeThickness: 1.5,
    }).setOrigin(0.5);

    // Center icon
    const iconY = cy + 2;
    const iconSize = dayIdx === 6 ? 64 : 46;

    if (isDone) {
        drawRewardIcon(scene, cx, iconY, iconSize, reward, 0.5);
        const check = scene.add.image(cx + iconSize / 3, cy - iconSize / 3, 'ui_ok_sm')
            .setDisplaySize(20, 20);
        if (isToday) {
            const targetScale = check.scale;
            check.setScale(0);
            scene.tweens.add({ targets: check, scale: targetScale,
                duration: 350, ease: 'Back.easeOut' });
        }
    } else if (isToday && !db.claimedToday) {
        drawRewardIcon(scene, cx, iconY, iconSize, reward, 1);
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
        const eggTex = `egg_${reward.eggTier}_sm`;
        if (!scene.textures.exists(eggTex)) return;
        const eggSize = Math.round(size * 1.3);
        scene.add.image(cx, cy, eggTex)
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
    if (reward.type === 'egg') return '#ffffff';
    return '#ffc107';
}

function rewardText(r: DailyBonusReward): string {
    if (r.type === 'coins') return `${r.count} ${t('coins')}`;
    if (r.type === 'egg' && r.eggTier) return `${r.count}x ${t(`egg_tier_${r.eggTier}`)}`;
    const name = r.buffType === 'lucky' ? 'Lucky' : r.buffType === 'super' ? 'Super' : 'Epic';
    return `${r.count}x ${name}`;
}

export function createMilestoneTrack(scene: Scene, trackY: number, manager: GameManager,
    trackWidth?: number): void {
    const db = manager.dailyBonus;
    const cfg = DAILY_BONUS_CONFIG;
    const maxVal = cfg.monthCycleDays;
    const trackW = trackWidth ?? (CARD_W * 4 + CARD_GAP * 3);
    const trackX = getGameWidth() / 2 - trackW / 2;
    const barY = trackY + 2;

    // Triple outline (black → yellow → black)
    const bg = scene.add.graphics();
    bg.lineStyle(1.5, 0x000000, 0.9);
    bg.strokeRoundedRect(trackX - 4, barY - 4, trackW + 8, TRACK_H + 8, TRACK_R + 3);
    bg.lineStyle(3, 0xFEBF07, 1);
    bg.strokeRoundedRect(trackX - 2, barY - 2, trackW + 4, TRACK_H + 4, TRACK_R + 2);
    bg.lineStyle(1.5, 0x000000, 0.9);
    bg.strokeRoundedRect(trackX, barY, trackW, TRACK_H, TRACK_R);

    bg.fillStyle(0x222244, 0.6);
    bg.fillRoundedRect(trackX, barY, trackW, TRACK_H, TRACK_R);

    const fillW = Math.max(0, trackW * Math.min(1, db.totalLogins / maxVal));
    if (fillW > 0) {
        const fw = Math.min(fillW, trackW - 1);
        const fr = fw >= TRACK_H ? TRACK_R : Math.min(fw / 2, TRACK_R);
        const fill = scene.add.graphics();
        fill.fillStyle(0x78C828, 1);
        fill.fillRoundedRect(trackX + 1, barY + 1, fw, TRACK_H - 2, fr);
        if (fw > 6) {
            const hlR = fw >= TRACK_H ? { tl: TRACK_R - 1, tr: TRACK_R - 1, bl: 0, br: 0 } : 0;
            fill.fillStyle(0xffffff, 0.18);
            fill.fillRoundedRect(trackX + 2, barY + 2, fw - 2, (TRACK_H - 4) * 0.4, hlR);
        }
    }

    const barCenterY = barY + TRACK_H / 2 - 1;
    const count = cfg.milestoneThresholds.length;
    for (let i = 0; i < count; i++) {
        const pct = (i + 1) / count;
        drawMilestoneGift(scene, trackX + trackW * pct, barCenterY, i, manager);
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
        scene.add.image(x, y, 'ui_ok_md').setDisplaySize(30, 30);
    } else {
        const gift = scene.add.image(x, y, 'ui_gift_md').setDisplaySize(38, 38);
        if (!reached) gift.setTint(0xaaaaaa);
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
                    showCoinGain(scene, x, y, coins);
                    scene.time.delayedCall(0, () => scene.scene.restart());
                }
            });
        }
    }

    scene.add.text(x, y + 28, t('daily_bonus_day', { day: String(threshold) }), {
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
