import { GameObjects, Geom, Scene } from 'phaser';
import { UI, THEME } from '../core/config';
import { getLayout } from '../core/layout';
import { isPortrait } from '../core/orientation';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { fitText } from './components/fitText';

const BG_H = 67;
const TOTAL_H = 93;
const RADIUS = 14;

export class DailyBonusButton extends GameObjects.Container {
    private badgeGfx: GameObjects.Graphics;
    private badgeText: GameObjects.Text;

    constructor(scene: Scene, onClick: () => void) {
        const l = getLayout();
        super(scene, l.dailyBonusBtn.x, l.dailyBonusBtn.y);
        const pw = l.btnW;

        const bg = scene.add.graphics();
        bg.fillStyle(THEME.PANEL_BG, THEME.PANEL_ALPHA);
        bg.fillRoundedRect(0, TOTAL_H - BG_H, pw, BG_H, RADIUS);
        bg.lineStyle(4, 0x000000, 1);
        bg.strokeRoundedRect(0, TOTAL_H - BG_H, pw, BG_H, RADIUS);
        bg.lineStyle(1.5, 0xFEBF07, 1);
        bg.strokeRoundedRect(0, TOTAL_H - BG_H, pw, BG_H, RADIUS);
        this.add(bg);

        const icon = scene.add.image(pw / 2, 35, 'ui_daily_btn')
            .setScale(0.5 * pw / 118);
        this.add(icon);

        const label = scene.add.text(pw / 2, TOTAL_H - BG_H / 2 + 14, t('daily_bonus_button'), {
            fontFamily: UI.FONT_STROKE,
            fontSize: '19px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(label, pw - 8, 19);
        this.add(label);

        const portrait = isPortrait();
        const badgeX = portrait ? 7 : pw - 2;
        const badgeY = portrait ? TOTAL_H - BG_H + 5 : TOTAL_H - BG_H + 4;
        const badgeR = portrait ? 9 : 11;
        this.badgeGfx = scene.add.graphics();
        this.badgeGfx.fillStyle(0x000000, 1);
        this.badgeGfx.fillCircle(badgeX, badgeY, badgeR + 1.5);
        this.badgeGfx.fillStyle(0x98CD5B, 1);
        this.badgeGfx.fillCircle(badgeX, badgeY, badgeR);
        this.badgeGfx.setVisible(false);
        this.add(this.badgeGfx);

        this.badgeText = scene.add.text(badgeX, badgeY, '!', {
            fontFamily: UI.FONT_STROKE, fontSize: portrait ? '11px' : '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setVisible(false);
        this.add(this.badgeText);

        this.setInteractive(
            new Geom.Rectangle(-6, -21, pw + 12, TOTAL_H + 27),
            Geom.Rectangle.Contains,
        );
        this.input!.cursor = 'pointer';
        this.on('pointerdown', onClick);
        addButtonFeedback(scene, this, { pivot: { x: pw / 2, y: TOTAL_H / 2 } });

        if (isPortrait()) this.setDepth(2);
        scene.add.existing(this);
    }

    updateBadge(hasReward: boolean, pendingCount = 0): void {
        this.badgeGfx.setVisible(hasReward);
        this.badgeText.setText(pendingCount > 1 ? String(pendingCount) : '!');
        this.badgeText.setVisible(hasReward);
    }
}
