import { GameObjects, Geom, Scene } from 'phaser';
import { UI, NEST_CONFIG, THEME } from '../core/config';
import { getLayout } from '../core/layout';
import { isPortrait } from '../core/orientation';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { showToast } from './components/Toast';
import { fitText } from './components/fitText';

const BG_H = 67;
const TOTAL_H = 93;
const RADIUS = 14;
const BADGE_R_LANDSCAPE = 11;
const BADGE_R_PORTRAIT = 9;

export class NestsButton extends GameObjects.Container {
    private badgeGfx: GameObjects.Graphics;
    private badgeText: GameObjects.Text;
    private icon: GameObjects.Image;
    private label: GameObjects.Text;
    private lockIcon: GameObjects.Image;
    private lockLabel: GameObjects.Text;
    private isLocked: boolean;
    private badgeX: number;
    private badgeY: number;
    private badgeR: number;

    constructor(scene: Scene, locked: boolean, onClick: () => void) {
        const l = getLayout();
        super(scene, l.nestsBtn.x, l.nestsBtn.y);
        this.isLocked = locked;
        const pw = l.btnW;
        const portrait = isPortrait();
        this.badgeX = portrait ? pw - 7 : pw - 2;
        this.badgeY = portrait ? TOTAL_H - BG_H + 5 : TOTAL_H - BG_H + 4;
        this.badgeR = portrait ? BADGE_R_PORTRAIT : BADGE_R_LANDSCAPE;

        const bg = scene.add.graphics();
        bg.fillStyle(THEME.PANEL_BG, THEME.PANEL_ALPHA);
        bg.fillRoundedRect(0, TOTAL_H - BG_H, pw, BG_H, RADIUS);
        bg.lineStyle(4, 0x000000, 1);
        bg.strokeRoundedRect(0, TOTAL_H - BG_H, pw, BG_H, RADIUS);
        bg.lineStyle(1.5, 0xFEBF07, 1);
        bg.strokeRoundedRect(0, TOTAL_H - BG_H, pw, BG_H, RADIUS);
        this.add(bg);

        const src = scene.textures.get('ui_nests_btn').getSourceImage();
        const iconW = Math.round(98 * pw / 118);
        const iconH = Math.round(iconW * src.height / src.width);
        this.icon = scene.add.image(pw / 2, 31, 'ui_nests_btn')
            .setDisplaySize(iconW, iconH).setVisible(!locked);
        this.add(this.icon);

        this.lockIcon = scene.add.image(pw / 2, TOTAL_H - BG_H / 2 - 22, 'ui_lock_md')
            .setDisplaySize(44, 44).setVisible(locked);
        this.add(this.lockIcon);

        const lvlStr = t('nests_locked_level', { level: NEST_CONFIG.unlockLevel });
        this.lockLabel = scene.add.text(pw / 2, TOTAL_H - BG_H / 2 + 14, lvlStr, {
            fontFamily: UI.FONT_STROKE,
            fontSize: '17px',
            color: '#999999',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5).setVisible(locked);
        fitText(this.lockLabel, pw - 8, 17);
        this.add(this.lockLabel);

        this.label = scene.add.text(pw / 2, TOTAL_H - BG_H / 2 + 14, t('nests_button'), {
            fontFamily: UI.FONT_STROKE,
            fontSize: '17px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5).setVisible(!locked);
        fitText(this.label, pw - 8, 17);
        this.add(this.label);

        this.badgeGfx = scene.add.graphics();
        this.badgeGfx.setVisible(false);
        this.add(this.badgeGfx);

        this.badgeText = scene.add.text(this.badgeX, this.badgeY, '', {
            fontFamily: UI.FONT_STROKE, fontSize: portrait ? '11px' : '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setVisible(false);
        this.add(this.badgeText);

        this.setInteractive(
            new Geom.Rectangle(-6, -21, pw + 12, TOTAL_H + 27),
            Geom.Rectangle.Contains,
        );
        this.input!.cursor = locked ? 'default' : 'pointer';
        this.on('pointerdown', () => {
            if (this.isLocked) {
                showToast(scene, t('toast_level_required', { level: NEST_CONFIG.unlockLevel }), 'error');
                return;
            }
            onClick();
        });
        addButtonFeedback(scene, this, { pivot: { x: pw / 2, y: TOTAL_H / 2 } });

        if (isPortrait()) this.setDepth(2);
        scene.add.existing(this);
    }

    setLocked(locked: boolean): void {
        if (this.isLocked === locked) return;
        this.isLocked = locked;
        this.icon.setVisible(!locked);
        this.lockIcon.setVisible(locked);
        this.lockLabel.setVisible(locked);
        this.label.setVisible(!locked);
        if (this.input) this.input.cursor = locked ? 'default' : 'pointer';
    }

    updateBadge(readyCount: number, hasEmpty: boolean): void {
        if (this.isLocked) {
            this.badgeGfx.setVisible(false);
            this.badgeText.setVisible(false);
            return;
        }
        if (readyCount > 0) {
            this.badgeGfx.clear();
            this.badgeGfx.fillStyle(0x000000, 1);
            this.badgeGfx.fillCircle(this.badgeX, this.badgeY, this.badgeR + 1.5);
            this.badgeGfx.fillStyle(0x98CD5B, 1);
            this.badgeGfx.fillCircle(this.badgeX, this.badgeY, this.badgeR);
            this.badgeGfx.setVisible(true);
            this.badgeText.setText(String(readyCount));
            this.badgeText.setVisible(true);
        } else if (hasEmpty) {
            this.badgeGfx.clear();
            this.badgeGfx.fillStyle(0x000000, 1);
            this.badgeGfx.fillCircle(this.badgeX, this.badgeY, this.badgeR + 1.5);
            this.badgeGfx.fillStyle(0xcc0000, 1);
            this.badgeGfx.fillCircle(this.badgeX, this.badgeY, this.badgeR);
            this.badgeGfx.setVisible(true);
            this.badgeText.setText('!');
            this.badgeText.setVisible(true);
        } else {
            this.badgeGfx.setVisible(false);
            this.badgeText.setVisible(false);
        }
    }
}
