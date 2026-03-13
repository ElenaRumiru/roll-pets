import { GameObjects, Scene } from 'phaser';
import { CollectionDef } from '../data/collections';
import { UI } from '../core/config';
import { fitText } from './components/fitText';
import { addButtonFeedback } from './components/buttonFeedback';
import { t } from '../data/locales';

export const COL_CARD_W = 184;
export const COL_CARD_H = 221;

const BADGE_GREEN = 0x98CD5B;
const BADGE_RED = 0xcc0000;

function formatReward(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
    return String(n);
}

export interface CollectionCardOpts {
    cardW?: number;
    cardH?: number;
}

export class CollectionCard extends GameObjects.Container {
    constructor(
        scene: Scene, x: number, y: number,
        coll: CollectionDef,
        progress: { current: number; total: number },
        isClaimed: boolean, isClaimable: boolean, hasUnseen: boolean,
        claimableCount: number,
        onClick: () => void,
        opts?: CollectionCardOpts,
    ) {
        super(scene, x, y);
        const W = opts?.cardW ?? COL_CARD_W;
        const H = opts?.cardH ?? COL_CARD_H;
        const s = W / COL_CARD_W; // scale factor

        const CARD_R = Math.round(11 * s);
        const PAD = Math.round(6 * s);
        const INNER_W = W - PAD * 2;
        const CONTENT_W = Math.round(INNER_W * 0.96);
        const BAR_W = Math.round(CONTENT_W * 0.87);
        const BANNER_H = Math.round(CONTENT_W * 0.18);
        const CORNER_R = Math.round(5 * s);
        const BAR_H = Math.round(BANNER_H * 0.75 * 0.95);
        const BAR_GREEN = 0x78C828;
        const BAR_GREEN_DARK = 0x5A9A1E;

        const ratio = progress.total > 0 ? progress.current / progress.total : 0;
        const dimmed = progress.current === 0;
        const isComplete = progress.current === progress.total && progress.total > 0;

        // Card background
        const bg = scene.add.graphics();
        bg.fillStyle(0x1a1a2e, dimmed ? 0.5 : 0.9);
        bg.fillRoundedRect(-W / 2, -H / 2, W, H, CARD_R);
        this.add(bg);

        // Icon — full card width
        const iconY = -H / 2 + PAD + INNER_W / 2;
        if (scene.textures.exists(coll.icon)) {
            const icon = scene.add.image(0, iconY, coll.icon).setDisplaySize(INNER_W, INNER_W);
            if (dimmed) icon.setAlpha(0.35);
            this.add(icon);
        }

        // Yellow name banner — triple outline
        const bannerY = iconY + INNER_W / 2 - BANNER_H * 0.35;
        const bannerGfx = scene.add.graphics();
        bannerGfx.lineStyle(3 * s, 0x000000, 0.9);
        bannerGfx.strokeRoundedRect(
            -CONTENT_W / 2 - 5 * s, bannerY - BANNER_H / 2 - 5 * s,
            CONTENT_W + 10 * s, BANNER_H + 10 * s, CORNER_R + 4,
        );
        bannerGfx.lineStyle(4 * s, 0xFEBF07, dimmed ? 0.4 : 1);
        bannerGfx.strokeRoundedRect(
            -CONTENT_W / 2 - 3 * s, bannerY - BANNER_H / 2 - 3 * s,
            CONTENT_W + 6 * s, BANNER_H + 6 * s, CORNER_R + 2,
        );
        bannerGfx.lineStyle(3 * s, 0x000000, 0.9);
        bannerGfx.strokeRoundedRect(
            -CONTENT_W / 2, bannerY - BANNER_H / 2,
            CONTENT_W, BANNER_H, CORNER_R,
        );
        bannerGfx.fillStyle(0xFEBF07, dimmed ? 0.4 : 1);
        bannerGfx.fillRoundedRect(-CONTENT_W / 2, bannerY - BANNER_H / 2, CONTENT_W, BANNER_H, CORNER_R);
        this.add(bannerGfx);

        const nameFontSz = Math.round(15 * s);
        const nameText = scene.add.text(0, bannerY, t(coll.nameKey), {
            fontFamily: UI.FONT_STROKE, fontSize: `${nameFontSz}px`, color: '#ffffff',
            stroke: '#000000', strokeThickness: Math.round(3 * s),
        }).setOrigin(0.5);
        fitText(nameText, CONTENT_W - 12 * s, nameFontSz, Math.round(9 * s));
        this.add(nameText);

        // Progress bar
        const barY = H / 2 - BAR_H / 2 - 3 * s;
        const fillColor = isClaimed ? BAR_GREEN_DARK : BAR_GREEN;
        const barGfx = scene.add.graphics();
        const bLeft = -BAR_W / 2;
        const bW = BAR_W - Math.round(10 * s);
        const bCx = bLeft + bW / 2;

        barGfx.lineStyle(1.5, 0x000000, 0.9);
        barGfx.strokeRoundedRect(bLeft - 4, barY - BAR_H / 2 - 4, bW + 8, BAR_H + 8, CORNER_R + 3);
        barGfx.lineStyle(3, 0xFEBF07, 1);
        barGfx.strokeRoundedRect(bLeft - 2, barY - BAR_H / 2 - 2, bW + 4, BAR_H + 4, CORNER_R + 2);
        barGfx.lineStyle(1.5, 0x000000, 0.9);
        barGfx.strokeRoundedRect(bLeft, barY - BAR_H / 2, bW, BAR_H, CORNER_R);

        barGfx.fillStyle(0x222244, 0.6);
        barGfx.fillRoundedRect(bLeft, barY - BAR_H / 2, bW, BAR_H, CORNER_R);

        const fillW = Math.max(0, ratio * bW);
        if (fillW > 2) {
            const fw = Math.min(fillW, bW - 1);
            const fr = fw >= BAR_H ? CORNER_R : Math.min(fw / 2, CORNER_R);
            barGfx.fillStyle(fillColor, 1);
            barGfx.fillRoundedRect(bLeft + 1, barY - BAR_H / 2 + 1, fw, BAR_H - 2, fr);
            if (fw > 6) {
                const hlR = fw >= BAR_H ? { tl: CORNER_R - 1, tr: CORNER_R - 1, bl: 0, br: 0 } : 0;
                barGfx.fillStyle(0xffffff, 0.18);
                barGfx.fillRoundedRect(bLeft + 2, barY - BAR_H / 2 + 2, fw - 2, (BAR_H - 4) * 0.4, hlR);
            }
        }
        this.add(barGfx);

        // Count text inside bar
        const countFontSz = Math.round(13 * s);
        const barLabel = isClaimed ? t('col_claimed') : isComplete ? t('col_done') : `${progress.current}/${progress.total}`;
        const countText = scene.add.text(bCx, barY, barLabel, {
            fontFamily: UI.FONT_STROKE, fontSize: `${countFontSz}px`, color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);
        fitText(countText, bW - 12, countFontSz, Math.round(9 * s));
        this.add(countText);

        // Circle at bar end
        const circleR = Math.round(14 * s);
        const circleX = bLeft + bW;
        const circleY = barY;
        const circleGfx = scene.add.graphics();
        circleGfx.lineStyle(1.5, 0x000000, 0.9);
        circleGfx.strokeCircle(circleX, circleY, circleR + 3.5);
        circleGfx.lineStyle(1.5, 0xFEBF07, dimmed ? 0.4 : 1);
        circleGfx.strokeCircle(circleX, circleY, circleR + 1.5);
        circleGfx.lineStyle(1.5, 0x000000, 0.9);
        circleGfx.strokeCircle(circleX, circleY, circleR);
        circleGfx.fillStyle(0x12121e, 1);
        circleGfx.fillCircle(circleX, circleY, circleR);
        this.add(circleGfx);

        if (isClaimed) {
            if (scene.textures.exists('ui_ok_sm')) {
                const okSz = Math.round(24 * s);
                this.add(scene.add.image(circleX, circleY + 1, 'ui_ok_sm').setDisplaySize(okSz, okSz));
            }
        } else {
            if (scene.textures.exists('ui_coin_md')) {
                const coinSz = Math.round(21 * s);
                const coin = scene.add.image(circleX, circleY - 4 * s, 'ui_coin_md').setDisplaySize(coinSz, coinSz);
                if (dimmed) coin.setAlpha(0.35);
                this.add(coin);
            }
            const rewardFontSz = Math.max(7, Math.round(9 * s));
            const amountText = scene.add.text(circleX, circleY + 8 * s, formatReward(coll.reward.coins), {
                fontFamily: UI.FONT_STROKE, fontSize: `${rewardFontSz}px`, color: '#f5c842',
                stroke: '#000000', strokeThickness: 2,
            }).setOrigin(0.5);
            if (dimmed) amountText.setAlpha(0.35);
            this.add(amountText);
        }

        // Difficulty stars
        this.addStars(scene, coll.difficulty, isClaimed, dimmed, W, H, s);

        // Notification badges
        if (isClaimable && claimableCount > 0) {
            this.addBadge(scene, iconY, BADGE_GREEN, String(claimableCount), INNER_W, s);
        } else if (hasUnseen && !isClaimed) {
            this.addBadge(scene, iconY, BADGE_RED, '!', INNER_W, s);
        }

        if (dimmed) this.setAlpha(0.6);

        this.setSize(W, H);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', onClick);
        addButtonFeedback(scene, this, { clickScale: 0.95 });
        scene.add.existing(this);
    }

    private addStars(
        scene: Scene, difficulty: 'easy' | 'medium' | 'hard',
        claimed: boolean, dimmed: boolean,
        _W: number, H: number, s: number,
    ): void {
        const count = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
        const tex = claimed ? 'ui_star_active' : 'ui_star_inactive';
        if (!scene.textures.exists(tex)) return;
        const sz = Math.round(22 * s);
        const starY = -H / 2 + sz / 2 - 2;
        const gap = sz * 0.75;

        if (count === 1) {
            const star = scene.add.image(0, starY, tex).setDisplaySize(sz, sz);
            if (dimmed) star.setAlpha(0.35);
            this.add(star);
        } else if (count === 2) {
            for (const side of [-1, 1]) {
                const star = scene.add.image(side * gap * 0.55, starY, tex).setDisplaySize(sz, sz);
                if (dimmed) star.setAlpha(0.35);
                this.add(star);
            }
        } else {
            for (const side of [-1, 1]) {
                const star = scene.add.image(side * gap * 1.07, starY + 4 * s, tex).setDisplaySize(sz, sz);
                star.setAngle(side * 12);
                if (dimmed) star.setAlpha(0.35);
                this.add(star);
            }
            const c = scene.add.image(0, starY, tex).setDisplaySize(sz, sz);
            if (dimmed) c.setAlpha(0.35);
            this.add(c);
        }
    }

    private addBadge(scene: Scene, iconY: number, color: number, label: string, innerW: number, s: number): void {
        const r = innerW / 2;
        const angle = Math.PI / 4;
        const bx = Math.round(r * Math.sin(angle)) + 3;
        const by = Math.round(iconY - r * Math.cos(angle)) - 3;
        const dotR = Math.round(15 * s);
        const g = scene.add.graphics();
        g.fillStyle(0x000000, 1);
        g.fillCircle(bx, by, dotR + 1.5);
        g.fillStyle(color, 1);
        g.fillCircle(bx, by, dotR);
        this.add(g);
        const fontSize = Math.round(18 * s);
        const txt = scene.add.text(bx, by, label, {
            fontFamily: UI.FONT_STROKE, fontSize: `${fontSize}px`, color: '#ffffff',
            stroke: '#000000', strokeThickness: Math.round(3 * s),
        }).setOrigin(0.5);
        this.add(txt);
    }
}
