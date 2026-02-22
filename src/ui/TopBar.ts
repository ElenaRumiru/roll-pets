import { GameObjects, Geom, Scene } from 'phaser';
import { UI, LEFT_PANEL } from '../core/config';
import { ProgressBar } from './components/ProgressBar';
import { t } from '../data/locales';

const PANEL_W = LEFT_PANEL.w;
const PANEL_H = 32;
const RADIUS = 10;
const BAR_X = 67;
const BAR_W = 111;
const BAR_H = 17;

export class TopBar extends GameObjects.Container {
    private levelText: GameObjects.Text;
    private xpBar: ProgressBar;
    private xpLabel: GameObjects.Text;

    constructor(scene: Scene, onClick?: () => void) {
        super(scene, LEFT_PANEL.x, 15);

        // Semi-transparent black panel
        const bg = scene.add.graphics();
        bg.fillStyle(0x111122, 0.75);
        bg.fillRoundedRect(0, 0, PANEL_W, PANEL_H, RADIUS);
        bg.lineStyle(2, 0xffffff, 0.2);
        bg.strokeRoundedRect(0, 0, PANEL_W, PANEL_H, RADIUS);
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

        const cy = PANEL_H / 2;

        // Level text (left side, vertically centered)
        this.levelText = scene.add.text(12, cy, '', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0, 0.5);
        this.add(this.levelText);

        // XP bar (right side, vertically centered)
        this.xpBar = new ProgressBar(scene, BAR_X, cy + 1, BAR_W, BAR_H, 0x222244, 0x78C828);
        this.add(this.xpBar);

        // XP numbers overlay on bar
        this.xpLabel = scene.add.text(BAR_X + BAR_W / 2, cy + 1, '', {
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
