import { GameObjects, Geom, Scene } from 'phaser';
import { UI, GAME_HEIGHT, LEFT_PANEL } from '../core/config';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { fitText } from './components/fitText';

const PANEL_W = 128;
const BG_H = 67;
const TOTAL_H = 93;
const RADIUS = 14;
const GAP_FROM_COLLECTION = 11;
const BADGE_X = PANEL_W - 2;
const BADGE_Y = TOTAL_H - BG_H + 7;
const BADGE_R = 12;

export class NestsButton extends GameObjects.Container {
    private badgeGfx: GameObjects.Graphics;
    private badgeText: GameObjects.Text;

    constructor(scene: Scene, onClick: () => void) {
        super(scene, LEFT_PANEL.x + PANEL_W + GAP_FROM_COLLECTION, GAME_HEIGHT - TOTAL_H - 15);

        const bg = scene.add.graphics();
        bg.fillStyle(0x111122, 0.55);
        bg.fillRoundedRect(0, TOTAL_H - BG_H, PANEL_W, BG_H, RADIUS);
        bg.lineStyle(2, 0xffffff, 0.2);
        bg.strokeRoundedRect(0, TOTAL_H - BG_H, PANEL_W, BG_H, RADIUS);
        this.add(bg);

        // Icon — centered, overlaps dark panel top
        const src = scene.textures.get('ui_nests_btn').getSourceImage();
        const iconW = 110;
        const iconH = Math.round(iconW * src.height / src.width);
        const icon = scene.add.image(PANEL_W / 2, 31, 'ui_nests_btn')
            .setDisplaySize(iconW, iconH);
        this.add(icon);

        const label = scene.add.text(PANEL_W / 2, TOTAL_H - BG_H / 2 + 14, t('nests_button'), {
            fontFamily: UI.FONT_STROKE,
            fontSize: '17px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(label, PANEL_W - 8, 17);
        this.add(label);

        // Badge (drawn dynamically)
        this.badgeGfx = scene.add.graphics();
        this.badgeGfx.setVisible(false);
        this.add(this.badgeGfx);

        this.badgeText = scene.add.text(BADGE_X, BADGE_Y, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setVisible(false);
        this.add(this.badgeText);

        this.setInteractive(
            new Geom.Rectangle(-6, -21, PANEL_W + 12, TOTAL_H + 27),
            Geom.Rectangle.Contains,
        );
        this.input!.cursor = 'pointer';
        this.on('pointerdown', onClick);
        addButtonFeedback(scene, this, { pivot: { x: PANEL_W / 2, y: TOTAL_H / 2 } });

        scene.add.existing(this);
    }

    updateBadge(readyCount: number, hasEmpty: boolean): void {
        if (readyCount > 0) {
            // Green badge with count
            this.badgeGfx.clear();
            this.badgeGfx.fillStyle(0x27ae60, 1);
            this.badgeGfx.fillCircle(BADGE_X, BADGE_Y, BADGE_R);
            this.badgeGfx.lineStyle(2, 0x000000, 1);
            this.badgeGfx.strokeCircle(BADGE_X, BADGE_Y, BADGE_R);
            this.badgeGfx.setVisible(true);
            this.badgeText.setText(String(readyCount));
            this.badgeText.setVisible(true);
        } else if (hasEmpty) {
            // Red badge with "!"
            this.badgeGfx.clear();
            this.badgeGfx.fillStyle(0xcc0000, 1);
            this.badgeGfx.fillCircle(BADGE_X, BADGE_Y, BADGE_R);
            this.badgeGfx.lineStyle(2, 0x000000, 1);
            this.badgeGfx.strokeCircle(BADGE_X, BADGE_Y, BADGE_R);
            this.badgeGfx.setVisible(true);
            this.badgeText.setText('!');
            this.badgeText.setVisible(true);
        } else {
            this.badgeGfx.setVisible(false);
            this.badgeText.setVisible(false);
        }
    }
}
