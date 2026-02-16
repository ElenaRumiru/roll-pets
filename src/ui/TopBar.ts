import { GameObjects, Scene } from 'phaser';
import { UI, LEFT_PANEL } from '../core/config';
import { ProgressBar } from './components/ProgressBar';
import { t } from '../data/locales';

const PANEL_W = LEFT_PANEL.w;
const PANEL_H = 52;
const RADIUS = 10;

export class TopBar extends GameObjects.Container {
    private nicknameText: GameObjects.Text;
    private levelText: GameObjects.Text;
    private xpBar: ProgressBar;
    private xpLabel: GameObjects.Text;

    constructor(scene: Scene) {
        super(scene, LEFT_PANEL.x, 8);

        // Semi-transparent black panel
        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.75);
        bg.fillRoundedRect(0, 0, PANEL_W, PANEL_H, RADIUS);
        this.add(bg);

        // Nickname (top row, prominent)
        this.nicknameText = scene.add.text(10, 6, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '13px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        });
        this.add(this.nicknameText);

        // Level text (bottom-left)
        this.levelText = scene.add.text(10, 28, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        });
        this.add(this.levelText);

        // XP bar (bottom-right area)
        const barX = 54;
        const barW = 90;
        this.xpBar = new ProgressBar(scene, barX, 36, barW, 14, 0x222244, 0x4caf50);
        this.add(this.xpBar);

        // XP numbers overlay on bar
        this.xpLabel = scene.add.text(barX + barW / 2, 36, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '9px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        this.add(this.xpLabel);

        scene.add.existing(this);
    }

    setNickname(name: string): void {
        this.nicknameText.setText(name);
    }

    updateDisplay(level: number, xpProgress: number, xp: number, xpNeeded: number): void {
        this.levelText.setText(`${t('level')} ${level}`);
        this.xpBar.setProgress(xpProgress);
        this.xpLabel.setText(`${xp}/${xpNeeded}`);
    }
}
