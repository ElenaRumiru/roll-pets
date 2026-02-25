import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, UI, VISUAL_TIERS } from '../core/config';
import { EGG_TIERS, formatBuffMultiplier, formatIncubationTime } from '../data/eggTiers';
import { getEggNameKey } from '../data/eggs';
import { Button } from './components/Button';
import { t } from '../data/locales';

const CARD_W = 156;
const CARD_H = 186;
const CARD_GAP = 14;
const CARD_R = 14;

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
    buyBtnY: number,
    onBuy: (tier: number) => void,
    formatCoins: (n: number) => string,
): EggTabResult {
    container.removeAll(true);

    const scrollContainer = scene.add.container(0, 0);
    container.add(scrollContainer);

    const totalW = EGG_TIERS.length * (CARD_W + CARD_GAP) - CARD_GAP;
    const startX = CARD_W / 2 + 20;

    for (let i = 0; i < EGG_TIERS.length; i++) {
        const cfg = EGG_TIERS[i];
        const x = startX + i * (CARD_W + CARD_GAP);
        const reqLevel = VISUAL_TIERS[cfg.tier - 1] ?? 1;
        const unlocked = playerLevel >= reqLevel;
        renderEggCard(scene, scrollContainer, x, contentY, buyBtnY,
            cfg.tier, cfg.price, cfg.buffMultiplier, cfg.incubationMs,
            unlocked, coins, reqLevel, onBuy, formatCoins);
    }

    // Mask for horizontal scrolling
    const maskGfx = scene.make.graphics({});
    maskGfx.fillRect(0, contentY - CARD_H / 2 - 10, GAME_WIDTH, CARD_H + buyBtnY - contentY + 60);
    scrollContainer.setMask(maskGfx.createGeometryMask());

    // Scroll state
    let scrollOffset = 0;
    const maxScroll = Math.max(0, totalW + 40 - GAME_WIDTH);

    function clampScroll(): void {
        scrollOffset = Phaser.Math.Clamp(scrollOffset, 0, maxScroll);
        scrollContainer.x = -scrollOffset;
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

    let dragX = 0;
    let startOff = 0;
    const onDown = (p: Phaser.Input.Pointer) => {
        if (p.y > contentY - CARD_H / 2 - 10) { dragX = p.x; startOff = scrollOffset; }
    };
    const onMove = (p: Phaser.Input.Pointer) => {
        if (p.isDown && dragX > 0) {
            scrollOffset = startOff - (p.x - dragX);
            clampScroll();
        }
    };
    const onUp = () => { dragX = 0; };

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
    x: number, y: number, buyBtnY: number,
    tier: number, price: number, buffMult: number, incubMs: number,
    unlocked: boolean, coins: number, reqLevel: number,
    onBuy: (tier: number) => void, formatCoins: (n: number) => string,
): void {
    const c = scene.add.container(x, y);
    const bg = scene.add.graphics();

    if (unlocked) {
        bg.fillStyle(0x2a2a3e, 1);
        bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
        bg.lineStyle(2, 0xffc107, 0.6);
        bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
    } else {
        bg.fillStyle(0x1a1a2e, 0.7);
        bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
        bg.lineStyle(2, 0x555566, 0.3);
        bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
    }
    c.add(bg);

    if (unlocked) {
        // Egg image
        c.add(scene.add.image(0, -CARD_H / 2 + 50, `egg_${tier}_sm`).setDisplaySize(86, 86));

        // Egg name (can wrap to 2 lines)
        const nameKey = getEggNameKey(`egg_${tier}`);
        c.add(scene.add.text(0, -CARD_H / 2 + 98, t(nameKey), {
            fontFamily: UI.FONT_STROKE, fontSize: '15px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
            wordWrap: { width: CARD_W - 14 }, align: 'center',
        }).setOrigin(0.5));

        // Buff line with "chance" word
        const chanceStr = `${formatBuffMultiplier(buffMult)} ${t('egg_chance')}`;
        c.add(scene.add.text(0, -CARD_H / 2 + 124, chanceStr, {
            fontFamily: UI.FONT_STROKE, fontSize: '15px', color: '#78C828',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));

        // Time line
        c.add(scene.add.text(0, -CARD_H / 2 + 148, formatIncubationTime(incubMs), {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));
    } else {
        // Locked card
        c.add(scene.add.image(0, -20, 'ui_lock_md').setDisplaySize(48, 48));
        c.add(scene.add.text(0, 24, t('egg_req_level', { level: reqLevel }), {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: '#666688',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));
    }

    container.add(c);

    // Buy button (only for unlocked)
    if (unlocked) {
        const canAfford = coins >= price;
        const btnColor = canAfford ? 0x27ae60 : 0x555566;
        const priceStr = formatCoins(price);
        const btn = new Button(scene, x, buyBtnY, 140, 44, priceStr, btnColor, () => onBuy(tier));

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
}
