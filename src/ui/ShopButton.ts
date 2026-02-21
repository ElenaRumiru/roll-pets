import { GameObjects, Geom, Scene } from 'phaser';
import { UI, GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';

const PANEL_W = 118;
const BG_H = 67;
const TOTAL_H = 93;
const RADIUS = 14;

export class ShopButton extends GameObjects.Container {
    constructor(scene: Scene, onClick: () => void) {
        super(scene, GAME_WIDTH - PANEL_W - 15, GAME_HEIGHT - TOTAL_H - 8);

        // Dark panel (lower portion)
        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.55);
        bg.fillRoundedRect(0, TOTAL_H - BG_H, PANEL_W, BG_H, RADIUS);
        this.add(bg);

        // Shop icon — centered, overlaps dark panel top
        const icon = scene.add.image(PANEL_W / 2, 35, 'ui_shop_mid')
            .setDisplaySize(195, 130);
        this.add(icon);

        // "Shop" label — centered in dark panel
        const label = scene.add.text(PANEL_W / 2, TOTAL_H - BG_H / 2 + 14, t('shop_button'), {
            fontFamily: UI.FONT_STROKE,
            fontSize: '19px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add(label);

        this.setInteractive(
            new Geom.Rectangle(-6, -21, PANEL_W + 12, TOTAL_H + 27),
            Geom.Rectangle.Contains,
        );
        this.input!.cursor = 'pointer';
        this.on('pointerdown', onClick);
        addButtonFeedback(scene, this, { pivot: { x: PANEL_W / 2, y: TOTAL_H / 2 } });

        scene.add.existing(this);
    }
}
