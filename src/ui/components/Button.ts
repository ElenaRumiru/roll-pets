import { GameObjects, Scene } from 'phaser';
import { UI } from '../../core/config';
import { AudioSystem } from '../../systems/AudioSystem';
import { fitText } from './fitText';

const SHADOW_OFFSET = 5;

export class Button extends GameObjects.Container {
    private bg: GameObjects.Graphics;
    private outlineGfx: GameObjects.Graphics;
    private label: GameObjects.Text;
    private enabled = true;
    private btnWidth: number;
    private btnHeight: number;
    private btnColor: number;
    private btnColorDark: number;
    private baseFontSize: number;
    private pressed = false;
    private outlineColor: number | null = null;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        text: string,
        color: number,
        onClick: () => void,
    ) {
        super(scene, x, y);
        this.btnWidth = width;
        this.btnHeight = height;
        this.btnColor = color;
        this.btnColorDark = this.darkenColor(color, 0.55);
        this.baseFontSize = Math.max(12, Math.floor(height * 0.38));

        this.outlineGfx = scene.add.graphics();
        this.bg = scene.add.graphics();
        this.drawButton(false);
        this.add(this.outlineGfx);
        this.add(this.bg);

        this.label = scene.add.text(0, -Math.floor(SHADOW_OFFSET / 2), text, {
            fontFamily: UI.FONT_STROKE,
            fontSize: `${this.baseFontSize}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(this.label, width - 10, this.baseFontSize);
        this.add(this.label);

        this.setSize(width, height + SHADOW_OFFSET);
        this.setInteractive({ useHandCursor: true });

        this.on('pointerdown', () => {
            if (!this.enabled) return;
            const audio = scene.registry.get('audio') as AudioSystem | undefined;
            audio?.playSfx('sfx_click', 0.7);
            this.pressed = true;
            this.drawButton(true);
            this.drawOutline();
            this.label.setY(Math.floor(SHADOW_OFFSET / 2));
            onClick();
        });

        this.on('pointerup', () => {
            this.pressed = false;
            this.drawButton(false);
            this.drawOutline();
            this.label.setY(-Math.floor(SHADOW_OFFSET / 2));
        });

        this.on('pointerout', () => {
            if (this.pressed) {
                this.pressed = false;
                this.drawButton(false);
                this.drawOutline();
                this.label.setY(-Math.floor(SHADOW_OFFSET / 2));
            }
        });

        scene.add.existing(this);
    }

    private drawButton(pressed: boolean): void {
        const g = this.bg;
        const w = this.btnWidth;
        const h = this.btnHeight;
        const faceH = h - SHADOW_OFFSET;
        const r = Math.min(UI.CORNER_RADIUS, faceH / 2);
        const shadow = pressed ? 1 : SHADOW_OFFSET;
        const yOff = pressed ? SHADOW_OFFSET - 1 : 0;

        g.clear();

        // Bottom (shadow/3D depth) — darker color
        g.fillStyle(this.btnColorDark, 1);
        g.fillRoundedRect(-w / 2, -h / 2 + SHADOW_OFFSET, w, faceH, r);

        // Top face — main color
        g.fillStyle(this.btnColor, 1);
        g.fillRoundedRect(-w / 2, -h / 2 + yOff, w, faceH, r);

        // Highlight line on top (lighter stripe for volume)
        const hlH = faceH * 0.35;
        const hlR = Math.min(Math.max(r - 2, 0), hlH / 2);
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(
            -w / 2 + 4, -h / 2 + yOff + 2,
            w - 8, hlH,
            { tl: hlR, tr: hlR, bl: 0, br: 0 },
        );

        // Border outline
        const strokeH = faceH + shadow;
        const strokeR = Math.min(r, strokeH / 2);
        g.lineStyle(2, 0x000000, 0.3);
        g.strokeRoundedRect(-w / 2, -h / 2 + yOff, w, strokeH, strokeR);
    }

    private darkenColor(color: number, factor: number): number {
        const red = Math.floor(((color >> 16) & 0xff) * factor);
        const grn = Math.floor(((color >> 8) & 0xff) * factor);
        const blu = Math.floor((color & 0xff) * factor);
        return (red << 16) | (grn << 8) | blu;
    }

    setText(text: string): void {
        this.label.setText(text);
        fitText(this.label, this.btnWidth - 10, this.baseFontSize);
    }

    setColor(color: number): void {
        this.btnColor = color;
        this.btnColorDark = this.darkenColor(color, 0.55);
        this.drawButton(this.pressed);
    }

    setOutline(color: number | null): void {
        this.outlineColor = color;
        this.drawOutline();
    }

    setEnabled(value: boolean): void {
        this.enabled = value;
        this.setAlpha(value ? 1 : 0.5);
    }

    private drawOutline(): void {
        this.outlineGfx.clear();
        if (this.outlineColor === null) return;
        const w = this.btnWidth;
        const h = this.btnHeight;
        const faceH = h - SHADOW_OFFSET;
        const r = Math.min(UI.CORNER_RADIUS, faceH / 2);
        const yOff = this.pressed ? SHADOW_OFFSET - 1 : 0;
        const side = 2;
        const bot = 1;
        const outerW = w + side * 2;
        const outerH = h + side + bot;
        const outerR = Math.min(r + side, outerH / 2);
        this.outlineGfx.fillStyle(this.outlineColor, 1);
        this.outlineGfx.fillRoundedRect(
            -w / 2 - side, -h / 2 + yOff - side,
            outerW, outerH, outerR,
        );
    }
}
