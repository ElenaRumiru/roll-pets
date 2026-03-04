import { GameObjects, Scene } from 'phaser';
import { CollectionDef } from '../data/collections';
import { UI } from '../core/config';
import { fitText } from './components/fitText';
import { addButtonFeedback } from './components/buttonFeedback';
import { t } from '../data/locales';

export const COL_CARD_W = 230;
export const COL_CARD_H = 276;
const CARD_R = 14;
const PAD = 8;
const INNER_W = COL_CARD_W - PAD * 2;
const CONTENT_W = Math.round(INNER_W * 0.96); // banner 4% narrower than icon
const BAR_W = Math.round(CONTENT_W * 0.87);   // bar 13% narrower than banner
const BANNER_H = Math.round(CONTENT_W * 0.18);
const CORNER_R = 6;
const BAR_H = Math.round(BANNER_H * 0.75 * 0.95);
const BANNER_BAR_GAP = 6;

const BAR_GREEN = 0x78C828;       // in progress + complete
const BAR_GREEN_DARK = 0x5A9A1E;  // claimed

const BADGE_GREEN = 0x98CD5B;
const BADGE_RED = 0xcc0000;

export class CollectionCard extends GameObjects.Container {
    constructor(
        scene: Scene, x: number, y: number,
        coll: CollectionDef,
        progress: { current: number; total: number },
        isClaimed: boolean, isClaimable: boolean, hasUnseen: boolean,
        claimableCount: number,
        onClick: () => void,
    ) {
        super(scene, x, y);
        const ratio = progress.total > 0 ? progress.current / progress.total : 0;
        const dimmed = progress.current === 0;
        const isComplete = progress.current === progress.total && progress.total > 0;

        // Card background
        const bg = scene.add.graphics();
        bg.fillStyle(0x1a1a2e, dimmed ? 0.5 : 0.9);
        bg.fillRoundedRect(-COL_CARD_W / 2, -COL_CARD_H / 2, COL_CARD_W, COL_CARD_H, CARD_R);
        this.add(bg);

        // Icon — full card width
        const iconY = -COL_CARD_H / 2 + PAD + INNER_W / 2;
        if (scene.textures.exists(coll.icon)) {
            const icon = scene.add.image(0, iconY, coll.icon).setDisplaySize(INNER_W, INNER_W);
            if (dimmed) icon.setAlpha(0.35);
            this.add(icon);
        }

        // Yellow name banner — triple outline: black → yellow → black
        const bannerY = iconY + INNER_W / 2 - BANNER_H * 0.35;
        const bannerGfx = scene.add.graphics();
        bannerGfx.lineStyle(4, 0x000000, 0.9);
        bannerGfx.strokeRoundedRect(
            -CONTENT_W / 2 - 6, bannerY - BANNER_H / 2 - 6,
            CONTENT_W + 12, BANNER_H + 12, CORNER_R + 4,
        );
        bannerGfx.lineStyle(5, 0xFEBF07, dimmed ? 0.4 : 1);
        bannerGfx.strokeRoundedRect(
            -CONTENT_W / 2 - 3, bannerY - BANNER_H / 2 - 3,
            CONTENT_W + 6, BANNER_H + 6, CORNER_R + 2,
        );
        bannerGfx.lineStyle(4, 0x000000, 0.9);
        bannerGfx.strokeRoundedRect(
            -CONTENT_W / 2, bannerY - BANNER_H / 2,
            CONTENT_W, BANNER_H, CORNER_R,
        );
        bannerGfx.fillStyle(0xFEBF07, dimmed ? 0.4 : 1);
        bannerGfx.fillRoundedRect(-CONTENT_W / 2, bannerY - BANNER_H / 2, CONTENT_W, BANNER_H, CORNER_R);
        this.add(bannerGfx);

        const nameText = scene.add.text(0, bannerY, t(coll.nameKey), {
            fontFamily: UI.FONT_STROKE, fontSize: '18px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);
        fitText(nameText, CONTENT_W - 14, 18, 10);
        this.add(nameText);

        // Progress bar — trim 4px from right, left edge stays fixed
        const barY = COL_CARD_H / 2 - BAR_H / 2 - 3;
        const fillColor = isClaimed ? BAR_GREEN_DARK : BAR_GREEN;
        const barGfx = scene.add.graphics();
        const bLeft = -BAR_W / 2;
        const bW = BAR_W - 13;
        const bCx = bLeft + bW / 2;

        barGfx.lineStyle(1.5, 0x000000, 0.9);
        barGfx.strokeRoundedRect(
            bLeft - 4, barY - BAR_H / 2 - 4,
            bW + 8, BAR_H + 8, CORNER_R + 3,
        );
        barGfx.lineStyle(3, 0xFEBF07, 1);
        barGfx.strokeRoundedRect(
            bLeft - 2, barY - BAR_H / 2 - 2,
            bW + 4, BAR_H + 4, CORNER_R + 2,
        );
        barGfx.lineStyle(1.5, 0x000000, 0.9);
        barGfx.strokeRoundedRect(
            bLeft, barY - BAR_H / 2,
            bW, BAR_H, CORNER_R,
        );

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
        const barLabel = isClaimed ? t('col_claimed') : isComplete ? t('col_done') : `${progress.current}/${progress.total}`;
        const countText = scene.add.text(bCx, barY, barLabel, {
            fontFamily: UI.FONT_STROKE, fontSize: '16px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);
        fitText(countText, bW - 16, 16, 10);
        this.add(countText);

        // Gift icon at bar end — when reward not yet claimed
        if (!isClaimed && scene.textures.exists('ui_gift_md')) {
            const giftSz = Math.round(BAR_H * 1.68) + 3;
            const giftX = bLeft + bW - 1;
            const gift = scene.add.image(giftX, barY - 1, 'ui_gift_md').setDisplaySize(giftSz, giftSz);
            if (dimmed) gift.setAlpha(0.35);
            else if (!isClaimable) gift.setTint(0x777777);
            this.add(gift);
        }

        // Notification badges — follow project patterns
        if (isClaimable && claimableCount > 0) {
            this.addBadge(scene, iconY, BADGE_GREEN, String(claimableCount));
        } else if (hasUnseen && !isClaimed) {
            this.addBadge(scene, iconY, BADGE_RED, '!');
        }

        if (dimmed) this.setAlpha(0.6);

        this.setSize(COL_CARD_W, COL_CARD_H);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', onClick);
        addButtonFeedback(scene, this, { clickScale: 0.95 });
        scene.add.existing(this);
    }

    private addBadge(scene: Scene, iconY: number, color: number, label: string): void {
        const r = INNER_W / 2;
        const angle = Math.PI / 4;
        const bx = Math.round(r * Math.sin(angle)) + 3;
        const by = Math.round(iconY - r * Math.cos(angle)) - 3;
        const dotR = 18;
        const g = scene.add.graphics();
        g.fillStyle(color, 1);
        g.fillCircle(bx, by, dotR);
        g.lineStyle(2.5, 0x000000, 0.7);
        g.strokeCircle(bx, by, dotR);
        this.add(g);
        const txt = scene.add.text(bx, by, label, {
            fontFamily: UI.FONT_STROKE, fontSize: '22px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);
        this.add(txt);
    }
}
