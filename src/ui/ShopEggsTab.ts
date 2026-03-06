import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI, VISUAL_TIERS } from '../core/config';
import { EGG_TIERS, formatBuffMultiplier, formatIncubationTime } from '../data/eggTiers';
import { getEggNameKey } from '../data/eggs';
import { Button } from './components/Button';
import { t } from '../data/locales';
import { showToast } from './components/Toast';
import { formatCoins } from '../core/formatCoins';

const CARD_W = 141;
const CARD_H = 160;
const CARD_GAP = 17;
const CARD_R = 15;
const COLS = 5;
const BTN_W = 140;
const BTN_H = 44;
const BTN_GAP = 8;
const ROW_GAP = 18;
const CELL_H = CARD_H + BTN_GAP + BTN_H;

export interface EggTabResult {
    scrollContainer: GameObjects.Container;
    cleanup: () => void;
}

export function buildEggCards(
    scene: Scene,
    container: GameObjects.Container,
    playerLevel: number,
    _eggInventory: Record<string, number>,
    coins: number,
    contentY: number,
    _buyBtnY: number,
    onBuy: (tier: number) => void,
): EggTabResult {
    container.removeAll(true);

    const scrollContainer = scene.add.container(0, 0);
    container.add(scrollContainer);

    const gridW = COLS * CARD_W + (COLS - 1) * CARD_GAP;
    const startX = (GAME_WIDTH - gridW) / 2 + CARD_W / 2;
    const startY = contentY - 10;
    const rows = Math.ceil(EGG_TIERS.length / COLS);

    for (let i = 0; i < EGG_TIERS.length; i++) {
        const cfg = EGG_TIERS[i];
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = startX + col * (CARD_W + CARD_GAP);
        const y = startY + row * (CELL_H + ROW_GAP);
        const btnY = y + CARD_H / 2 + BTN_GAP + BTN_H / 2;
        const reqLevel = VISUAL_TIERS[cfg.tier - 1] ?? 1;
        const unlocked = playerLevel >= reqLevel;
        renderEggCard(scene, scrollContainer, x, y, btnY,
            cfg.tier, cfg.price, cfg.buffMultiplier, cfg.incubationMs,
            unlocked, coins, reqLevel, onBuy);
    }

    // Mask for vertical scrolling
    const maskTop = startY - CARD_H / 2 - 10;
    const maskBottom = GAME_HEIGHT - 10;
    const maskGfx = scene.make.graphics({});
    maskGfx.fillRect(0, maskTop, GAME_WIDTH, maskBottom - maskTop);
    scrollContainer.setMask(maskGfx.createGeometryMask());

    // Scroll state
    let scrollOffset = 0;
    const totalH = rows * (CELL_H + ROW_GAP) - ROW_GAP;
    const visibleH = maskBottom - maskTop;
    const maxScroll = Math.max(0, totalH - visibleH + 20);

    function clampScroll(): void {
        scrollOffset = Phaser.Math.Clamp(scrollOffset, 0, maxScroll);
        scrollContainer.y = -scrollOffset;
    }

    const onWheel = (
        _p: Phaser.Input.Pointer,
        _go: Phaser.GameObjects.GameObject[],
        _dx: number,
        dy: number,
    ) => {
        scrollOffset += dy * 0.8;
        clampScroll();
    };
    scene.input.on('wheel', onWheel);

    let dragY = 0;
    let startOff = 0;
    const onDown = (p: Phaser.Input.Pointer) => {
        if (p.y > maskTop) { dragY = p.y; startOff = scrollOffset; }
    };
    const onMove = (p: Phaser.Input.Pointer) => {
        if (p.isDown && dragY > 0) {
            scrollOffset = startOff - (p.y - dragY);
            clampScroll();
        }
    };
    const onUp = () => { dragY = 0; };

    scene.input.on('pointerdown', onDown);
    scene.input.on('pointermove', onMove);
    scene.input.on('pointerup', onUp);

    const cleanup = () => {
        scene.input.off('wheel', onWheel);
        scene.input.off('pointerdown', onDown);
        scene.input.off('pointermove', onMove);
        scene.input.off('pointerup', onUp);
    };

    return { scrollContainer, cleanup };
}

function renderEggCard(
    scene: Scene, container: GameObjects.Container,
    x: number, y: number, btnY: number,
    tier: number, price: number, buffMult: number, incubMs: number,
    unlocked: boolean, coins: number, reqLevel: number,
    onBuy: (tier: number) => void,
): void {
    const c = scene.add.container(x, y);
    const bg = scene.add.graphics();

    if (unlocked) {
        bg.fillStyle(0x2a2a3e, 1);
        bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
        bg.lineStyle(1.5, 0x000000, 0.9);
        bg.strokeRoundedRect(-CARD_W / 2 - 4, -CARD_H / 2 - 4, CARD_W + 8, CARD_H + 8, CARD_R + 3);
        bg.lineStyle(3, 0xFEBF07, 1);
        bg.strokeRoundedRect(-CARD_W / 2 - 2, -CARD_H / 2 - 2, CARD_W + 4, CARD_H + 4, CARD_R + 2);
        bg.lineStyle(1.5, 0x000000, 0.9);
        bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
    } else {
        bg.fillStyle(0x1a1a2e, 0.7);
        bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
        bg.lineStyle(2, 0x555566, 0.3);
        bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
    }
    c.add(bg);

    if (unlocked) {
        c.add(scene.add.image(0, -22, `egg_${tier}_sm`).setDisplaySize(115, 115));

        const nameKey = getEggNameKey(`egg_${tier}`);
        c.add(scene.add.text(0, CARD_H / 2 - 47, t(nameKey), {
            fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
            wordWrap: { width: CARD_W - 14 }, align: 'center',
        }).setOrigin(0.5));

        const chanceStr = `${t('egg_chance')} ${formatBuffMultiplier(buffMult)}`;
        c.add(scene.add.text(0, CARD_H / 2 - 29, chanceStr, {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#78C828',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));

        const timeStr = t('egg_duration', { time: formatIncubationTime(incubMs) });
        c.add(scene.add.text(0, CARD_H / 2 - 15, timeStr, {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));
    } else {
        c.add(scene.add.image(0, -20, 'ui_lock_md').setDisplaySize(48, 48));
        c.add(scene.add.text(0, 24, t('egg_req_level', { level: reqLevel }), {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: '#666688',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));
        c.setSize(CARD_W, CARD_H);
        c.setInteractive();
        c.on('pointerdown', () => {
            showToast(scene, t('toast_level_required', { level: reqLevel }), 'error');
        });
    }

    container.add(c);

    // Buy button for all cards
    const canAfford = unlocked && coins >= price;
    const btnColor = canAfford ? 0x27ae60 : 0x555566;
    const priceStr = formatCoins(price);
    const btn = new Button(scene, x, btnY, BTN_W, BTN_H, priceStr, btnColor, () => {
        if (unlocked) onBuy(tier);
        else showToast(scene, t('toast_level_required', { level: reqLevel }), 'error');
    });

    const label = btn.list[2] as GameObjects.Text;
    const textW = label.width;
    const iconSize = 20, gap = 3;
    const groupW = iconSize + gap + textW;
    const iconX = -groupW / 2 + iconSize / 2;
    label.setX(iconX + iconSize / 2 + gap + textW / 2).setY(-3);
    btn.add(scene.add.image(iconX, -3, 'ui_coin_md').setDisplaySize(iconSize, iconSize));
    if (!canAfford) btn.setEnabled(false);
    container.add(btn);
}
