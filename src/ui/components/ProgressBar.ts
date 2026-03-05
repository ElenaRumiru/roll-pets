import { GameObjects, Scene } from 'phaser';

export class ProgressBar extends GameObjects.Container {
    private gfx: GameObjects.Graphics;
    private barWidth: number;
    private barHeight: number;
    private fillColor: number;
    private bgColor: number;
    private progress = 0;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        bgColor: number,
        fillColor: number,
    ) {
        super(scene, x, y);
        this.barWidth = width;
        this.barHeight = height;
        this.fillColor = fillColor;
        this.bgColor = bgColor;

        this.gfx = scene.add.graphics();
        this.add(this.gfx);
        this.draw();

        scene.add.existing(this);
    }

    private draw(): void {
        const g = this.gfx;
        const w = this.barWidth;
        const h = this.barHeight;
        const r = h / 2;
        const fillW = Math.max(0, this.progress * w);

        g.clear();

        // Background
        g.fillStyle(this.bgColor, 0.5);
        g.fillRoundedRect(0, -h / 2, w, h, r);
        g.lineStyle(2, 0x000000, 0.7);
        g.strokeRoundedRect(0, -h / 2, w, h, r);

        // Fill
        if (fillW > 2) {
            const fw = Math.min(fillW, w - 2);
            const fr = fw >= h ? r - 1 : 0;
            g.fillStyle(this.fillColor, 1);
            g.fillRoundedRect(1, -h / 2 + 1, fw, h - 2, fr);

            // Highlight on fill
            if (fw > 4) {
                const hr = fw >= h ? { tl: r - 2, tr: r - 2, bl: 0, br: 0 } : 0;
                g.fillStyle(0xffffff, 0.2);
                g.fillRoundedRect(2, -h / 2 + 2, fw - 2, (h - 4) * 0.4, hr);
            }
        }
    }

    setProgress(value: number): void {
        this.progress = Math.max(0, Math.min(1, value));
        this.draw();
    }

    animateTo(value: number, duration = 300): void {
        const target = Math.max(0, Math.min(1, value));
        this.scene.tweens.add({
            targets: this,
            progress: target,
            duration,
            ease: 'Power2',
            onUpdate: () => this.draw(),
        });
    }
}
