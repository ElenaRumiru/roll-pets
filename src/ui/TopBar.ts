import { GameObjects, Scene } from 'phaser';
import { UI } from '../core/config';
import { ProgressBar } from './components/ProgressBar';
import { t } from '../data/locales';

export class TopBar extends GameObjects.Container {
    private levelBadge: GameObjects.Graphics;
    private levelText: GameObjects.Text;
    private xpBar: ProgressBar;
    private xpLabel: GameObjects.Text;

    constructor(scene: Scene) {
        super(scene, 0, 0);

        // Level badge (rounded rectangle) — top-left
        this.levelBadge = scene.add.graphics();
        this.drawLevelBadge();
        this.add(this.levelBadge);

        this.levelText = scene.add.text(42, 18, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add(this.levelText);

        // XP bar — next to level badge
        const barX = 86;
        const barW = 200;
        this.xpBar = new ProgressBar(scene, barX, 18, barW, 18, 0x222244, 0x4caf50);
        this.add(this.xpBar);

        // XP text (on bar)
        this.xpLabel = scene.add.text(barX + barW / 2, 18, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        this.add(this.xpLabel);

        scene.add.existing(this);
    }

    private drawLevelBadge(): void {
        const g = this.levelBadge;
        g.clear();
        g.fillStyle(UI.ACCENT_ORANGE, 1);
        g.fillRoundedRect(8, 5, 68, 26, 8);
        g.lineStyle(2, 0x000000, 0.3);
        g.strokeRoundedRect(8, 5, 68, 26, 8);
    }

    updateDisplay(level: number, xpProgress: number, xp: number, xpNeeded: number): void {
        this.levelText.setText(`${t('level')} ${level}`);
        this.xpBar.setProgress(xpProgress);
        this.xpLabel.setText(`${xp} / ${xpNeeded} ${t('xp')}`);
    }
}
