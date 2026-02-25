import { GameObjects, Geom, Scene } from 'phaser';
import { UI, GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { fitText } from './components/fitText';

const PANEL_W = 118;
const BG_H = 67;
const TOTAL_H = 93;
const RADIUS = 14;
const GAP_FROM_SHOP = 11;

export class DailyBonusButton extends GameObjects.Container {
    private badgeGfx: GameObjects.Graphics;
    private badgeText: GameObjects.Text;

    constructor(scene: Scene, onClick: () => void) {
        const shopX = GAME_WIDTH - PANEL_W - 15;
        super(scene, shopX - PANEL_W - GAP_FROM_SHOP, GAME_HEIGHT - TOTAL_H - 15);

        const bg = scene.add.graphics();
        bg.fillStyle(0x111122, 0.55);
        bg.fillRoundedRect(0, TOTAL_H - BG_H, PANEL_W, BG_H, RADIUS);
        bg.lineStyle(2, 0xffffff, 0.2);
        bg.strokeRoundedRect(0, TOTAL_H - BG_H, PANEL_W, BG_H, RADIUS);
        this.add(bg);

        const icon = scene.add.image(PANEL_W / 2, 35, 'ui_daily_btn')
            .setScale(0.5);
        this.add(icon);

        const label = scene.add.text(PANEL_W / 2, TOTAL_H - BG_H / 2 + 14, t('daily_bonus_button'), {
            fontFamily: UI.FONT_STROKE,
            fontSize: '19px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(label, PANEL_W - 8, 19);
        this.add(label);

        // Notification badge
        const badgeX = PANEL_W - 2;
        const badgeY = TOTAL_H - BG_H + 7;
        this.badgeGfx = scene.add.graphics();
        this.badgeGfx.fillStyle(0x78C828, 1);
        this.badgeGfx.fillCircle(badgeX, badgeY, 11);
        this.badgeGfx.lineStyle(2, 0x000000, 1);
        this.badgeGfx.strokeCircle(badgeX, badgeY, 11);
        this.badgeGfx.setVisible(false);
        this.add(this.badgeGfx);

        this.badgeText = scene.add.text(badgeX, badgeY, '!', {
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

    updateBadge(hasReward: boolean): void {
        this.badgeGfx.setVisible(hasReward);
        this.badgeText.setVisible(hasReward);
    }
}
