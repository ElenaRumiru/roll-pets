import { GameObjects, Scene } from 'phaser';
import { UI } from '../../core/config';

const SHADOW_OFFSET = 5;

export class Button extends GameObjects.Container {
    private bg: GameObjects.Graphics;
    private label: GameObjects.Text;
    private enabled = true;
    private btnWidth: number;
    private btnHeight: number;
    private btnColor: number;
    private btnColorDark: number;
    private pressed = false;

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

        this.bg = scene.add.graphics();
        this.drawButton(false);
        this.add(this.bg);

        this.label = scene.add.text(0, -Math.floor(SHADOW_OFFSET / 2), text, {
            fontFamily: UI.FONT_MAIN,
            fontSize: `${Math.max(12, Math.floor(height * 0.38))}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add(this.label);

        this.setSize(width, height + SHADOW_OFFSET);
        this.setInteractive({ useHandCursor: true });

        this.on('pointerdown', () => {
            if (!this.enabled) return;
            this.pressed = true;
            this.drawButton(true);
            this.label.setY(Math.floor(SHADOW_OFFSET / 2));
            onClick();
        });

        this.on('pointerup', () => {
            this.pressed = false;
            this.drawButton(false);
            this.label.setY(-Math.floor(SHADOW_OFFSET / 2));
        });

        this.on('pointerout', () => {
            if (this.pressed) {
                this.pressed = false;
                this.drawButton(false);
                this.label.setY(-Math.floor(SHADOW_OFFSET / 2));
            }
        });

        scene.add.existing(this);
    }

    private drawButton(pressed: boolean): void {
        const g = this.bg;
        const w = this.btnWidth;
        const h = this.btnHeight;
        const r = UI.CORNER_RADIUS;
        const shadow = pressed ? 1 : SHADOW_OFFSET;
        const yOff = pressed ? SHADOW_OFFSET - 1 : 0;

        g.clear();

        // Bottom (shadow/3D depth) — darker color
        g.fillStyle(this.btnColorDark, 1);
        g.fillRoundedRect(-w / 2, -h / 2 + SHADOW_OFFSET, w, h - SHADOW_OFFSET, r);

        // Top face — main color
        g.fillStyle(this.btnColor, 1);
        g.fillRoundedRect(-w / 2, -h / 2 + yOff, w, h - SHADOW_OFFSET, r);

        // Highlight line on top (lighter stripe for volume)
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(
            -w / 2 + 4, -h / 2 + yOff + 2,
            w - 8, (h - SHADOW_OFFSET) * 0.35,
            { tl: r - 2, tr: r - 2, bl: 0, br: 0 },
        );

        // Border outline
        g.lineStyle(2, 0x000000, 0.3);
        g.strokeRoundedRect(-w / 2, -h / 2 + yOff, w, h - SHADOW_OFFSET + shadow, r);
    }

    private darkenColor(color: number, factor: number): number {
        const red = Math.floor(((color >> 16) & 0xff) * factor);
        const grn = Math.floor(((color >> 8) & 0xff) * factor);
        const blu = Math.floor((color & 0xff) * factor);
        return (red << 16) | (grn << 8) | blu;
    }

    setText(text: string): void {
        this.label.setText(text);
    }

    setEnabled(value: boolean): void {
        this.enabled = value;
        this.setAlpha(value ? 1 : 0.5);
    }
}
