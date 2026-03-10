import { GameObjects, Scene } from 'phaser';
import { UI } from '../../core/config';
import { fitText } from './fitText';
import { addShineEffect } from './shineEffect';
import { addButtonFeedback } from './buttonFeedback';

// ── Shared constants ──

export const FREE_COLOR = 0x78C828;
export const FREE_DARK  = 0x4E8A18;
export const AD_COLOR   = 0x7B2FBE;
export const AD_DARK    = 0x4A1A72;

export const BTN_W = 111;
export const BTN_H = 35;
export const BTN_R = BTN_H / 2;
export const BTN_SHADOW = 2;

// ── Card background ──

export function drawCardBg(
    scene: Scene, container: GameObjects.Container,
    cx: number, topY: number, w: number, h: number, r: number,
): void {
    const g = scene.add.graphics();
    g.fillStyle(0x1a1a2e, 0.9);
    g.fillRoundedRect(cx - w / 2, topY, w, h, r);
    g.lineStyle(1.5, 0x333355, 0.5);
    g.strokeRoundedRect(cx - w / 2, topY, w, h, r);
    container.add(g);
}

// ── Badge ribbon (+300%) ──

export function drawBadgeRibbon(
    scene: Scene, container: GameObjects.Container,
    cx: number, topY: number, label: string,
): void {
    const rw = 64, rh = 22;
    const ry = topY + 5;
    const ribbon = scene.add.graphics();
    ribbon.fillStyle(0xff4444, 1);
    ribbon.fillRoundedRect(cx - rw / 2, ry, rw, rh, 3);
    container.add(ribbon);
    const txt = scene.add.text(cx, ry + rh / 2, label, {
        fontFamily: UI.FONT_STROKE, fontSize: '14px',
        color: '#ffffff', stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5);
    container.add(txt);
}

// ── Choice button ──

export interface ChoiceButtonConfig {
    color: number;
    dark: number;
    label: string;
    onClick: () => void;
    shine?: boolean;
    fontSize?: number;
    strokeThickness?: number;
}

export function buildChoiceButton(
    scene: Scene, container: GameObjects.Container,
    cx: number, btnY: number, cfg: ChoiceButtonConfig,
): { wrap: GameObjects.Container; text: GameObjects.Text } {
    const fontSize = cfg.fontSize ?? 14;
    const stroke = cfg.strokeThickness ?? 1;

    const wrap = scene.add.container(cx, btnY);
    container.add(wrap);

    const bg = scene.add.graphics();
    bg.fillStyle(cfg.dark, 1);
    bg.fillRoundedRect(-BTN_W / 2, -BTN_H / 2 + BTN_SHADOW, BTN_W, BTN_H, BTN_R);
    bg.fillStyle(cfg.color, 1);
    bg.fillRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H - BTN_SHADOW, BTN_R);
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(
        -BTN_W / 2 + 3, -BTN_H / 2 + 1,
        BTN_W - 6, (BTN_H - BTN_SHADOW) * 0.4,
        { tl: BTN_R - 1, tr: BTN_R - 1, bl: 0, br: 0 },
    );
    bg.lineStyle(1.5, 0x000000, 0.25);
    bg.strokeRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, BTN_R);
    wrap.add(bg);

    const text = scene.add.text(0, -1, cfg.label, {
        fontFamily: UI.FONT_STROKE, fontSize: `${fontSize}px`,
        color: '#ffffff', stroke: '#000000', strokeThickness: stroke,
    }).setOrigin(0.5);
    fitText(text, BTN_W - 10, fontSize);
    wrap.add(text);

    wrap.setSize(BTN_W, BTN_H + BTN_SHADOW);
    if (cfg.shine !== false) addShineEffect(scene, wrap, BTN_W, BTN_H, BTN_R);
    wrap.setInteractive({ useHandCursor: true });
    wrap.on('pointerdown', cfg.onClick);
    addButtonFeedback(scene, wrap);

    return { wrap, text };
}
