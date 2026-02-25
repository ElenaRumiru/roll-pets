import { Scene, GameObjects } from 'phaser';
import { UI, NEST_CONFIG } from '../core/config';
import { NestSlot } from '../types';
import { NestSystem } from '../systems/NestSystem';
import { Button } from './components/Button';
import { t } from '../data/locales';

const SLOT_W = 200;
const SLOT_H = 250;
const CARD_R = 14;
const NEST_W = 154;      // 140 * 1.10
const EGG_SIZE = 120;    // 80 * 1.50
const NEST_Y = 50;       // lower third of card
const EGG_Y = 15;        // above nest center
const TIMER_Y = -SLOT_H / 2 + 25;  // top of card

export interface SlotLayout {
    slotY: number;
    btnY: number;
    btnW: number;
    btnH: number;
}

function nestHeight(scene: Scene): number {
    const src = scene.textures.get('ui_nest_mid').getSourceImage();
    return Math.round(NEST_W * src.height / src.width);
}

export function renderEmptySlot(
    scene: Scene, container: GameObjects.Container, x: number, layout: SlotLayout,
    onSelect: () => void,
): void {
    const c = scene.add.container(x, layout.slotY);
    const bg = scene.add.graphics();
    bg.fillStyle(0x2a2a3e, 1);
    bg.fillRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, CARD_R);
    bg.lineStyle(2, 0xffffff, 0.2);
    bg.strokeRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, CARD_R);
    c.add(bg);
    c.add(scene.add.image(0, NEST_Y, 'ui_nest_mid').setDisplaySize(NEST_W, nestHeight(scene)));
    c.add(scene.add.text(0, TIMER_Y, t('nests_empty'), {
        fontFamily: UI.FONT_STROKE, fontSize: '16px', color: '#666688',
    }).setOrigin(0.5));
    container.add(c);
    const btn = new Button(scene, x, layout.btnY, layout.btnW, layout.btnH, t('nests_select'), 0x3498db, onSelect);
    container.add(btn);
}

export function renderIncubatingSlot(
    scene: Scene, container: GameObjects.Container, x: number, layout: SlotLayout,
    slot: NestSlot, nests: NestSystem, index: number, formatTime: (ms: number) => string,
    onSpeedUp: () => void,
): void {
    const c = scene.add.container(x, layout.slotY);
    const bg = scene.add.graphics();
    bg.fillStyle(0x2a2a3e, 1);
    bg.fillRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, CARD_R);
    bg.lineStyle(2, 0xffc107, 0.4);
    bg.strokeRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, CARD_R);
    c.add(bg);
    c.add(scene.add.image(0, NEST_Y, 'ui_nest_mid').setDisplaySize(NEST_W, nestHeight(scene)));
    if (slot.eggTier) c.add(scene.add.image(0, EGG_Y, `egg_${slot.eggTier}`).setDisplaySize(EGG_SIZE, EGG_SIZE));
    const timerText = scene.add.text(0, TIMER_Y,
        formatTime(nests.getTimeRemainingMs(index)), {
            fontFamily: UI.FONT_STROKE, fontSize: '18px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
    timerText.setData('nestIndex', index);
    c.add(timerText);
    container.add(c);

    if (slot.boosted) {
        // Already boosted — disabled "In Progress" button
        const btn = new Button(scene, x, layout.btnY, layout.btnW, layout.btnH, t('nests_in_progress'), 0xd4a017, () => {});
        btn.setEnabled(false);
        container.add(btn);
    } else {
        // Purple ad button: "▶ Speed +30%"
        const btn = new Button(scene, x, layout.btnY, layout.btnW, layout.btnH,
            `\u25B6 ${t('nests_speed_up')}`, 0x7B2FBE, onSpeedUp);
        container.add(btn);
    }
}

export function renderReadySlot(
    scene: Scene, container: GameObjects.Container, x: number, layout: SlotLayout,
    slot: NestSlot, onCollect: () => void,
): void {
    const c = scene.add.container(x, layout.slotY);
    const bg = scene.add.graphics();
    bg.fillStyle(0x2a2a3e, 1);
    bg.fillRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, CARD_R);
    bg.lineStyle(2, 0x78C828, 0.6);
    bg.strokeRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, CARD_R);
    c.add(bg);
    const nestImg = scene.add.image(0, NEST_Y, 'ui_nest_mid').setDisplaySize(NEST_W, nestHeight(scene));
    c.add(nestImg);
    if (slot.eggTier) {
        const eggImg = scene.add.image(0, EGG_Y, `egg_${slot.eggTier}`).setDisplaySize(EGG_SIZE, EGG_SIZE);
        c.add(eggImg);
        scene.tweens.add({
            targets: [nestImg, eggImg], scaleX: '*=1.05', scaleY: '*=1.05',
            duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut',
        });
    }
    c.add(scene.add.text(0, TIMER_Y, t('nests_ready'), {
        fontFamily: UI.FONT_STROKE, fontSize: '18px', color: '#78C828',
        stroke: '#000000', strokeThickness: UI.STROKE_THIN,
    }).setOrigin(0.5));
    container.add(c);
    const btn = new Button(scene, x, layout.btnY, layout.btnW, layout.btnH, t('nests_collect'), 0x78C828, onCollect);
    container.add(btn);
}

export function renderLockedSlot(
    scene: Scene, container: GameObjects.Container, x: number, layout: SlotLayout,
    index: number, coins: number, onBuy: () => void, formatCoins: (n: number) => string,
): void {
    const c = scene.add.container(x, layout.slotY);
    const bg = scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.5);
    bg.fillRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, CARD_R);
    bg.lineStyle(2, 0x666666, 0.15);
    bg.strokeRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, CARD_R);
    c.add(bg);
    c.add(scene.add.image(0, -10, 'ui_lock_md').setDisplaySize(56, 56));
    container.add(c);

    const price = NEST_CONFIG.slotPrices[index] ?? 0;
    const canAfford = coins >= price;
    const btn = new Button(scene, x, layout.btnY, layout.btnW, layout.btnH,
        formatCoins(price), canAfford ? 0x27ae60 : 0x555566, onBuy);
    const label = btn.list[2] as GameObjects.Text;
    const textW = label.width;
    const iconSize = 20, gap = 4;
    const groupW = iconSize + gap + textW;
    const iconX = -groupW / 2 + iconSize / 2;
    label.setX(iconX + iconSize / 2 + gap + textW / 2).setY(-3);
    btn.add(scene.add.image(iconX, -3, 'ui_coin_md').setDisplaySize(iconSize, iconSize));
    if (!canAfford) btn.setEnabled(false);
    container.add(btn);
}
