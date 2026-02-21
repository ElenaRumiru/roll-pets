import { GameObjects, Geom, Scene } from 'phaser';
import { UI, LEFT_PANEL } from '../core/config';
import { ProgressBar } from './components/ProgressBar';
import { t } from '../data/locales';

const PANEL_W = LEFT_PANEL.w;
const PANEL_H = 42;
const RADIUS = 10;

export class TopBar extends GameObjects.Container {
    private levelText: GameObjects.Text;
    private xpBar: ProgressBar;
    private xpLabel: GameObjects.Text;

    constructor(scene: Scene, onClick?: () => void) {
        super(scene, LEFT_PANEL.x, 10);

        // Semi-transparent black panel
        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.75);
        bg.fillRoundedRect(0, 0, PANEL_W, PANEL_H, RADIUS);
        this.add(bg);

        // Make entire panel clickable
        if (onClick) {
            this.setInteractive({
                hitArea: new Geom.Rectangle(0, 0, PANEL_W, PANEL_H),
                hitAreaCallback: Geom.Rectangle.Contains,
                useHandCursor: true,
            });
            this.on('pointerdown', onClick);
        }

        // Level text (top row)
        this.levelText = scene.add.text(12, 12, '', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        });
        this.add(this.levelText);

        // XP bar
        const barX = 67;
        const barW = 111;
        this.xpBar = new ProgressBar(scene, barX, 30, barW, 17, 0x222244, 0x4caf50);
        this.add(this.xpBar);

        // XP numbers overlay on bar
        this.xpLabel = scene.add.text(barX + barW / 2, 30, '', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        this.add(this.xpLabel);

        scene.add.existing(this);
    }

    updateDisplay(level: number, xpProgress: number, xp: number, xpNeeded: number): void {
        this.levelText.setText(`${t('level')} ${level}`);
        this.xpBar.setProgress(xpProgress);
        this.xpLabel.setText(`${xp}/${xpNeeded}`);
    }
}
