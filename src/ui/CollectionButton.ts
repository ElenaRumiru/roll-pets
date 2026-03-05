import { GameObjects, Geom, Scene } from 'phaser';
import { UI, GAME_HEIGHT, LEFT_PANEL, THEME } from '../core/config';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { fitText } from './components/fitText';

const PANEL_W = 118;
const BG_H = 67;
const TOTAL_H = 93;
const RADIUS = 14;

export class CollectionButton extends GameObjects.Container {
    private badgeGfx: GameObjects.Graphics;
    private badgeText: GameObjects.Text;

    constructor(scene: Scene, onClick: () => void) {
        super(scene, LEFT_PANEL.x, GAME_HEIGHT - TOTAL_H - 15);

        // Dark panel (lower portion)
        const bg = scene.add.graphics();
        bg.fillStyle(THEME.PANEL_BG, THEME.PANEL_ALPHA);
        bg.fillRoundedRect(0, TOTAL_H - BG_H, PANEL_W, BG_H, RADIUS);
        bg.lineStyle(4, 0x000000, 1);
        bg.strokeRoundedRect(0, TOTAL_H - BG_H, PANEL_W, BG_H, RADIUS);
        bg.lineStyle(1.5, 0xFEBF07, 1);
        bg.strokeRoundedRect(0, TOTAL_H - BG_H, PANEL_W, BG_H, RADIUS);
        this.add(bg);

        // Book icon — centered, overlaps dark panel top
        const icon = scene.add.image(PANEL_W / 2, 39, 'ui_collections')
            .setDisplaySize(118, 98);
        this.add(icon);

        // "Collection" label — centered in dark panel
        const label = scene.add.text(PANEL_W / 2, TOTAL_H - BG_H / 2 + 14, t('collection_button'), {
            fontFamily: UI.FONT_STROKE,
            fontSize: '17px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(label, PANEL_W - 8, 17);
        this.add(label);

        // Notification badge (top-right corner of dark panel)
        const badgeX = PANEL_W - 2;
        const badgeY = TOTAL_H - BG_H + 7;
        const badgeR = 12;
        this.badgeGfx = scene.add.graphics();
        this.badgeGfx.fillStyle(0x000000, 1);
        this.badgeGfx.fillCircle(badgeX, badgeY, badgeR + 1.5);
        this.badgeGfx.fillStyle(0xcc0000, 1);
        this.badgeGfx.fillCircle(badgeX, badgeY, badgeR);
        this.add(this.badgeGfx);

        this.badgeText = scene.add.text(badgeX, badgeY, '', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '13px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5);
        this.add(this.badgeText);

        this.badgeGfx.setVisible(false);
        this.badgeText.setVisible(false);

        this.setInteractive(
            new Geom.Rectangle(-6, -21, PANEL_W + 12, TOTAL_H + 27),
            Geom.Rectangle.Contains,
        );
        this.input!.cursor = 'pointer';
        this.on('pointerdown', onClick);
        addButtonFeedback(scene, this, { pivot: { x: PANEL_W / 2, y: TOTAL_H / 2 } });

        scene.add.existing(this);
    }

    updateBadge(hasUnseen: boolean, claimableCount: number): void {
        const badgeX = PANEL_W - 2;
        const badgeY = TOTAL_H - BG_H + 7;
        const badgeR = 12;

        if (claimableCount > 0) {
            this.badgeGfx.clear();
            this.badgeGfx.fillStyle(0x000000, 1);
            this.badgeGfx.fillCircle(badgeX, badgeY, badgeR + 1.5);
            this.badgeGfx.fillStyle(0x98CD5B, 1);
            this.badgeGfx.fillCircle(badgeX, badgeY, badgeR);
            this.badgeText.setText(String(claimableCount));
            this.badgeText.setFontSize(claimableCount >= 10 ? '11px' : '13px');
            this.badgeGfx.setVisible(true);
            this.badgeText.setVisible(true);
        } else if (hasUnseen) {
            this.badgeGfx.clear();
            this.badgeGfx.fillStyle(0x000000, 1);
            this.badgeGfx.fillCircle(badgeX, badgeY, badgeR + 1.5);
            this.badgeGfx.fillStyle(0xcc0000, 1);
            this.badgeGfx.fillCircle(badgeX, badgeY, badgeR);
            this.badgeText.setText('!');
            this.badgeText.setFontSize('13px');
            this.badgeGfx.setVisible(true);
            this.badgeText.setVisible(true);
        } else {
            this.badgeGfx.setVisible(false);
            this.badgeText.setVisible(false);
        }
    }
}
