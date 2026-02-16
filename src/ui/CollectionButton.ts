import { GameObjects, Geom, Scene } from 'phaser';
import { UI, GAME_HEIGHT, LEFT_PANEL } from '../core/config';
import { t } from '../data/locales';

const PANEL_W = LEFT_PANEL.w;
const BG_H = 81;
const TOTAL_H = 112;
const RADIUS = 14;

export class CollectionButton extends GameObjects.Container {
    private badgeText: GameObjects.Text;

    constructor(scene: Scene, onClick: () => void) {
        super(scene, LEFT_PANEL.x, GAME_HEIGHT - TOTAL_H - 8);

        // Dark panel (lower portion)
        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.55);
        bg.fillRoundedRect(0, TOTAL_H - BG_H, PANEL_W, BG_H, RADIUS);
        this.add(bg);

        // Book icon — large, centered, overlaps dark panel top
        const icon = scene.add.image(PANEL_W / 2, 42, 'ui_collections')
            .setDisplaySize(160, 133);
        this.add(icon);

        // "Collection" label — centered in dark panel
        const label = scene.add.text(PANEL_W / 2, TOTAL_H - BG_H / 2 + 12, t('collection_button'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add(label);

        // Notification badge (top-right corner of dark panel)
        const badgeX = PANEL_W - 2;
        const badgeY = TOTAL_H - BG_H + 6;
        const badgeR = 10;
        const badge = scene.add.graphics();
        badge.lineStyle(2, 0x000000, 1);
        badge.fillStyle(0xcc0000, 1);
        badge.fillCircle(badgeX, badgeY, badgeR);
        badge.strokeCircle(badgeX, badgeY, badgeR);
        this.add(badge);

        this.badgeText = scene.add.text(badgeX, badgeY - 1, '3', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1,
        }).setOrigin(0.5);
        this.add(this.badgeText);

        this.setInteractive(
            new Geom.Rectangle(-5, -25, PANEL_W + 10, TOTAL_H + 30),
            Geom.Rectangle.Contains,
        );
        this.input!.cursor = 'pointer';
        this.on('pointerdown', onClick);

        scene.add.existing(this);
    }

    updateCount(_n: number): void {
        // Counter removed by design — badge is a stub
    }
}
