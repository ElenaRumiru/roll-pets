import { GameObjects, Scene } from 'phaser';
import { UI, GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { getEggTierConfig, formatBuffMultiplier, formatIncubationTime } from '../data/eggTiers';
import { getEggNameKey } from '../data/eggs';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';

const CARD_W = 110;
const CARD_H = 155;
const CARD_GAP = 12;
const CARD_R = 10;
const COLUMNS = 4;
const PAD = 16;

export interface EggOption {
    tier: number;
    count: number;
}

export class EggSelectPopup {
    private container: GameObjects.Container;
    private destroyed = false;

    constructor(
        scene: Scene,
        eggs: EggOption[],
        onSelect: (tier: number) => void,
        onDismiss: () => void,
        onGoToShop?: () => void,
    ) {
        this.container = scene.add.container(0, 0).setDepth(1000);
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // Calculate popup size based on content
        const totalItems = eggs.length + 1;
        const rows = Math.ceil(totalItems / COLUMNS);
        const cols = Math.min(totalItems, COLUMNS);
        const gridW = cols * (CARD_W + CARD_GAP) - CARD_GAP;
        const rowH = CARD_H + CARD_GAP;
        const gridH = rows * rowH - CARD_GAP;

        const POPUP_W = gridW + PAD * 2;
        const titleH = 50;
        const POPUP_H = titleH + gridH + PAD * 2;

        const popLeft = cx - POPUP_W / 2;
        const popTop = cy - POPUP_H / 2;

        // Blocker overlay
        const overlay = scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
        overlay.setInteractive();
        overlay.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.x < popLeft || p.x > popLeft + POPUP_W || p.y < popTop || p.y > popTop + POPUP_H) {
                this.dismiss(onDismiss);
            }
        });
        this.container.add(overlay);

        // Popup bg with visible outline
        const bg = scene.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.97);
        bg.fillRoundedRect(popLeft, popTop, POPUP_W, POPUP_H, 14);
        bg.lineStyle(4, 0x000000, 1);
        bg.strokeRoundedRect(popLeft, popTop, POPUP_W, POPUP_H, 14);
        bg.lineStyle(1.5, 0xFEBF07, 1);
        bg.strokeRoundedRect(popLeft, popTop, POPUP_W, POPUP_H, 14);
        this.container.add(bg);

        // Title
        this.container.add(scene.add.text(cx, popTop + 28, t('nests_select_egg'), {
            fontFamily: UI.FONT_STROKE, fontSize: '22px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5));

        // Grid layout
        const gridStartX = popLeft + PAD + CARD_W / 2;
        const gridStartY = popTop + titleH + PAD + CARD_H / 2;

        // Render egg cards
        eggs.forEach((egg, i) => {
            const col = i % COLUMNS;
            const row = Math.floor(i / COLUMNS);
            const ex = gridStartX + col * (CARD_W + CARD_GAP);
            const ey = gridStartY + row * rowH;
            this.buildEggCell(scene, ex, ey, egg, onSelect);
        });

        // "+" cell to go to shop
        this.buildPlusCell(scene, gridStartX, gridStartY, eggs.length, rowH, onDismiss, onGoToShop);

        // Entrance tween
        this.container.setScale(0);
        scene.tweens.add({
            targets: this.container, scale: 1, duration: 300, ease: 'Back.easeOut',
        });
    }

    private buildEggCell(
        scene: Scene, ex: number, ey: number,
        egg: EggOption, onSelect: (tier: number) => void,
    ): void {
        const card = scene.add.container(ex, ey);

        // Card background (matching shop style)
        const cardBg = scene.add.graphics();
        cardBg.fillStyle(0x2a2a3e, 0.8);
        cardBg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
        cardBg.lineStyle(1.5, 0xffc107, 0.4);
        cardBg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
        card.add(cardBg);

        // Egg image
        card.add(scene.add.image(0, -CARD_H / 2 + 40, `egg_${egg.tier}_sm`)
            .setDisplaySize(70, 70));

        // Egg name
        const nameKey = getEggNameKey(`egg_${egg.tier}`);
        card.add(scene.add.text(0, -CARD_H / 2 + 78, t(nameKey), {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
            wordWrap: { width: CARD_W - 10 }, align: 'center',
        }).setOrigin(0.5));

        // Buff chance line
        const tierCfg = getEggTierConfig(egg.tier);
        const chanceStr = `${formatBuffMultiplier(tierCfg.buffMultiplier)} ${t('egg_chance')}`;
        card.add(scene.add.text(0, -CARD_H / 2 + 100, chanceStr, {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#78C828',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));

        // Time line
        card.add(scene.add.text(0, -CARD_H / 2 + 120, formatIncubationTime(tierCfg.incubationMs), {
            fontFamily: UI.FONT_STROKE, fontSize: '11px', color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));

        // Count badge (top-right corner)
        const badgeX = CARD_W / 2 - 14;
        const badgeY = -CARD_H / 2 + 14;
        const badge = scene.add.graphics();
        badge.fillStyle(0xffc107, 0.9);
        badge.fillCircle(badgeX, badgeY, 12);
        card.add(badge);
        card.add(scene.add.text(badgeX, badgeY, String(egg.count), {
            fontFamily: UI.FONT_MAIN, fontSize: '12px', color: '#000000',
        }).setOrigin(0.5));

        card.setSize(CARD_W, CARD_H);
        card.setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => {
            if (this.destroyed) return;
            this.destroyed = true;
            this.container.destroy();
            onSelect(egg.tier);
        });
        addButtonFeedback(scene, card);
        this.container.add(card);
    }

    private buildPlusCell(
        scene: Scene, gridStartX: number, gridStartY: number,
        idx: number, rowH: number,
        onDismiss: () => void, onGoToShop?: () => void,
    ): void {
        const col = idx % COLUMNS;
        const row = Math.floor(idx / COLUMNS);
        const ex = gridStartX + col * (CARD_W + CARD_GAP);
        const ey = gridStartY + row * rowH;

        const plusCard = scene.add.container(ex, ey);
        const plusBg = scene.add.graphics();
        plusBg.fillStyle(0x3498db, 0.15);
        plusBg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
        plusBg.lineStyle(2, 0x3498db, 0.5);
        plusBg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
        plusCard.add(plusBg);

        plusCard.add(scene.add.text(0, -15, '+', {
            fontFamily: UI.FONT_MAIN, fontSize: '42px', color: '#3498db',
        }).setOrigin(0.5));

        plusCard.add(scene.add.text(0, 30, t('nests_buy_eggs'), {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#3498db',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));

        plusCard.setSize(CARD_W, CARD_H);
        plusCard.setInteractive({ useHandCursor: true });
        plusCard.on('pointerdown', () => {
            if (this.destroyed) return;
            this.destroyed = true;
            this.container.destroy();
            if (onGoToShop) onGoToShop();
            else onDismiss();
        });
        addButtonFeedback(scene, plusCard);
        this.container.add(plusCard);
    }

    private dismiss(onDismiss: () => void): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.container.destroy();
        onDismiss();
    }
}
