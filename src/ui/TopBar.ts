import { GameObjects, Geom, Scene } from 'phaser';
import { UI, LEFT_PANEL } from '../core/config';
import { ProgressBar } from './components/ProgressBar';
import { t } from '../data/locales';

const PANEL_W = LEFT_PANEL.w;
const PANEL_H = 64;
const RADIUS = 10;

export class TopBar extends GameObjects.Container {
    private nicknameText: GameObjects.Text;
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

        // Nickname (top row, prominent)
        this.nicknameText = scene.add.text(12, 7, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        });
        this.add(this.nicknameText);

        // Level text (bottom-left)
        this.levelText = scene.add.text(12, 35, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        });
        this.add(this.levelText);

        // XP bar (bottom-right area)
        const barX = 67;
        const barW = 111;
        this.xpBar = new ProgressBar(scene, barX, 44, barW, 17, 0x222244, 0x4caf50);
        this.add(this.xpBar);

        // XP numbers overlay on bar
        this.xpLabel = scene.add.text(barX + barW / 2, 44, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '11px',
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
