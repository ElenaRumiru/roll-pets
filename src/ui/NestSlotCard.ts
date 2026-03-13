import { Scene, GameObjects } from 'phaser';
import { UI, NEST_CONFIG } from '../core/config';
import { NestSlot } from '../types';
import { NestSystem } from '../systems/NestSystem';
import { Button } from './components/Button';
import { t } from '../data/locales';
import { formatCoins } from '../core/formatCoins';

const SLOT_W = 200;
const SLOT_H = 250;
const CARD_R = 14;
const NEST_W = 154;      // 140 * 1.10
const EGG_SIZE = 135;    // +12% from 120
const NEST_Y = 50;       // lower third of card
const EGG_Y = 11;        // above nest center
const TIMER_Y = -SLOT_H / 2 + 25;  // top of card

export interface SlotLayout {
    slotY: number;
    btnY: number;
    btnW: number;
    btnH: number;
    cardScale?: number;
}

function applyScale(layout: SlotLayout, card: GameObjects.Container, btn: GameObjects.Container): void {
    const s = layout.cardScale ?? 1;
    if (s !== 1) { card.setScale(s); btn.setScale(s); }
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
    bg.lineStyle(4, 0x000000, 1);
    bg.strokeRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, CARD_R);
    bg.lineStyle(1.5, 0xFEBF07, 1);
    bg.strokeRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, CARD_R);
    c.add(bg);
    c.add(scene.add.image(0, NEST_Y, 'ui_nest_mid').setDisplaySize(NEST_W, nestHeight(scene)));
    c.add(scene.add.text(0, TIMER_Y, t('nests_empty'), {
        fontFamily: UI.FONT_STROKE, fontSize: '16px', color: '#666688',
    }).setOrigin(0.5));
    container.add(c);
    const btn = new Button(scene, x, layout.btnY, layout.btnW, layout.btnH, t('nests_select'), 0x3498db, onSelect);
    container.add(btn);
    applyScale(layout, c, btn);
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
    if (slot.eggTier) c.add(scene.add.image(0, EGG_Y, `egg_${slot.eggTier}_sm`).setDisplaySize(EGG_SIZE, EGG_SIZE));
    const timerText = scene.add.text(0, TIMER_Y,
        formatTime(nests.getTimeRemainingMs(index)), {
            fontFamily: UI.FONT_STROKE, fontSize: '18px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
    timerText.setData('nestIndex', index);
    c.add(timerText);
    container.add(c);

    let btn: Button;
    if (slot.boosted) {
        btn = new Button(scene, x, layout.btnY, layout.btnW, layout.btnH, t('nests_in_progress'), 0xd4a017, () => {});
        btn.setEnabled(false);
    } else {
        btn = new Button(scene, x, layout.btnY, layout.btnW, layout.btnH,
            `\u25B6 ${t('nests_speed_up')}`, 0x7B2FBE, onSpeedUp);
    }
    container.add(btn);
    applyScale(layout, c, btn);
}

// Shock particle spawn positions: upper third of egg, rotation so bottom→center
const HALF_PI = Math.PI / 2;
const SHOCK_SPOTS = [
    { x: -35, y: EGG_Y - 48, rot: Math.atan2(48, 35) + Math.PI + HALF_PI },
    { x: 35, y: EGG_Y - 48, rot: Math.atan2(48, -35) + Math.PI + HALF_PI },
    { x: -45, y: EGG_Y - 22, rot: Math.atan2(22, 45) + Math.PI + HALF_PI },
    { x: 45, y: EGG_Y - 22, rot: Math.atan2(22, -45) + Math.PI + HALF_PI },
];

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
    c.add(scene.add.image(0, NEST_Y, 'ui_nest_mid').setDisplaySize(NEST_W, nestHeight(scene)));
    if (slot.eggTier) {
        const eggImg = scene.add.image(0, EGG_Y, `egg_${slot.eggTier}_sm`)
            .setDisplaySize(EGG_SIZE, EGG_SIZE);
        c.add(eggImg);
        // Knock animation: sharp tilt alternating left/right every ~1s
        let dir = 1;
        const knock = () => {
            const angle = dir * 0.12; // ~7 degrees
            dir *= -1;
            scene.tweens.add({
                targets: eggImg, rotation: angle,
                duration: 80, ease: 'Sine.easeOut',
                onComplete: () => scene.tweens.add({
                    targets: eggImg, rotation: 0,
                    duration: 120, ease: 'Sine.easeIn',
                }),
            });
            // Shock particle at peak
            const spot = SHOCK_SPOTS[Math.floor(Math.random() * SHOCK_SPOTS.length)];
            const shock = scene.add.image(spot.x, spot.y, 'ui_shock_sm')
                .setDisplaySize(28, 28).setRotation(spot.rot).setAlpha(0.9);
            c.add(shock);
            scene.tweens.add({
                targets: shock, alpha: 0, duration: 350, delay: 80,
                ease: 'Power2', onComplete: () => shock.destroy(),
            });
        };
        knock();
        scene.time.addEvent({ delay: 1000, callback: knock, loop: true });
    }
    c.add(scene.add.text(0, TIMER_Y, t('nests_ready'), {
        fontFamily: UI.FONT_STROKE, fontSize: '18px', color: '#78C828',
        stroke: '#000000', strokeThickness: UI.STROKE_THIN,
    }).setOrigin(0.5));
    container.add(c);
    const btn = new Button(scene, x, layout.btnY, layout.btnW, layout.btnH, t('nests_collect'), 0x78C828, onCollect);
    container.add(btn);
    applyScale(layout, c, btn);
}

export function renderLockedSlot(
    scene: Scene, container: GameObjects.Container, x: number, layout: SlotLayout,
    index: number, coins: number, onBuy: () => void,
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
    applyScale(layout, c, btn);
}
