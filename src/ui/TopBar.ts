import { GameObjects, Geom, Scene } from 'phaser';
import { UI, XP_HUD, THEME } from '../core/config';
import { getLayout } from '../core/layout';
import { ProgressBar } from './components/ProgressBar';
import { addButtonFeedback } from './components/buttonFeedback';

const ICON_X = XP_HUD.iconSize * 0.28;
const CY = XP_HUD.h / 2;
const TEXT_LEFT = XP_HUD.iconSize * 0.6 + 2;
const TEXT_CENTER_X = TEXT_LEFT + (XP_HUD.w - TEXT_LEFT) / 2;

export class TopBar extends GameObjects.Container {
    private levelLabel: GameObjects.Text;
    private xpBar: ProgressBar;
    private xpLabel: GameObjects.Text;

    constructor(scene: Scene, onClick?: () => void) {
        const l = getLayout();
        super(scene, l.topBar.x, l.topBar.y);

        // XP progress bar (pill-shaped, serves as the panel)
        this.xpBar = new ProgressBar(
            scene, 0, CY, XP_HUD.w, XP_HUD.h, THEME.PANEL_BG, 0x3cb8e8,
        );
        this.add(this.xpBar);

        // XP numbers overlay on bar
        this.xpLabel = scene.add.text(TEXT_CENTER_X, CY, '', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '13px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5, 0.5);
        this.add(this.xpLabel);

        // Shield icon overlapping left edge (like coin in CoinDisplay)
        const icon = scene.add.image(ICON_X, CY, 'ui_lvl_md')
            .setDisplaySize(XP_HUD.iconSize, XP_HUD.iconSize);
        this.add(icon);

        // Level number centered inside shield
        this.levelLabel = scene.add.text(ICON_X, CY, '1', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5, 0.5);
        this.add(this.levelLabel);

        // Clickable hit area covering shield + bar
        if (onClick) {
            const hitX = -XP_HUD.iconSize * 0.22;
            this.setInteractive({
                hitArea: new Geom.Rectangle(
                    hitX, 0, XP_HUD.w - hitX, XP_HUD.h,
                ),
                hitAreaCallback: Geom.Rectangle.Contains,
                useHandCursor: true,
            });
            this.on('pointerdown', onClick);
            addButtonFeedback(scene, this);
        }

        scene.add.existing(this);
    }

    updateDisplay(level: number, xpProgress: number, xp: number, xpNeeded: number): void {
        this.levelLabel.setText(`${level}`);
        this.xpBar.setProgress(xpProgress);
        this.xpLabel.setText(`${xp}/${xpNeeded}`);
    }
}
