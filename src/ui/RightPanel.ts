import { GameObjects, Geom, Scene } from 'phaser';
import { UI, AUTOROLL_TOGGLE } from '../core/config';
import { getLayout } from '../core/layout';
import { BuffBadges } from './BuffBadges';
import { BuffSystem } from '../systems/BuffSystem';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { showToast } from './components/Toast';
import { fitText } from './components/fitText';

export class RightPanel extends GameObjects.Container {
    private rollWrap: GameObjects.Container;
    private rollBg: GameObjects.Image;
    private rollLabel: GameObjects.Text;
    private badges: BuffBadges;
    private toggleImg: GameObjects.Image;
    private autorollEnabled = false;
    private autorollRunning = false;
    private isLocked = false;
    private lockOverlay!: GameObjects.Graphics;
    private lockIcon!: GameObjects.Image;
    private lockLabel!: GameObjects.Text;
    private rollW: number;

    private onRoll: () => void;
    private onStopAutoroll: () => void;
    private onStartAutoroll: () => void;
    private onToggleAutoroll: (enabled: boolean) => void;

    constructor(
        scene: Scene,
        onRoll: () => void,
        onStopAutoroll: () => void,
        onStartAutoroll: () => void,
        onToggleAutoroll: (enabled: boolean) => void,
    ) {
        super(scene, 0, 0);

        this.onRoll = onRoll;
        this.onStopAutoroll = onStopAutoroll;
        this.onStartAutoroll = onStartAutoroll;
        this.onToggleAutoroll = onToggleAutoroll;

        const l = getLayout();
        const rb = l.rollBtn;
        const ar = l.autoroll;
        this.rollW = rb.w;

        // Roll button wrapper (for scaling image + text together)
        this.rollWrap = scene.add.container(rb.x, rb.y);
        this.add(this.rollWrap);

        this.rollBg = scene.add.image(0, 0, rb.texture);
        const texSrc = scene.textures.get(rb.texture).getSourceImage();
        const texRatio = texSrc.height / texSrc.width;
        const rollH = Math.round(rb.w * texRatio);
        this.rollBg.setDisplaySize(rb.w, rollH)
            .setInteractive({ useHandCursor: true });
        this.rollBg.on('pointerdown', () => this.handleRollClick());
        this.rollWrap.add(this.rollBg);

        this.rollLabel = scene.add.text(0, -1, t('roll_button'), {
            fontFamily: UI.FONT_STROKE,
            fontSize: rb.fontSize,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true },
        }).setOrigin(0.5);
        fitText(this.rollLabel, rb.w - 25, parseInt(rb.fontSize));
        this.rollWrap.add(this.rollLabel);


        addButtonFeedback(scene, this.rollBg, { scaleTarget: this.rollWrap });

        // Autoroll toggle button
        const toggleX = ar.x;
        const toggleY = ar.y;
        this.toggleImg = scene.add.image(toggleX, toggleY, 'ui_automod_off')
            .setDisplaySize(ar.w, ar.h)
            .setInteractive({ useHandCursor: true });
        this.toggleImg.on('pointerdown', () => this.handleToggleClick());
        this.add(this.toggleImg);
        addButtonFeedback(scene, this.toggleImg);

        // Lock overlay for autoroll toggle
        this.lockOverlay = scene.add.graphics();
        this.lockOverlay.fillStyle(0x111122, 0.75);
        this.lockOverlay.fillRoundedRect(
            toggleX - ar.w / 2,
            toggleY - ar.h / 2,
            ar.w,
            ar.h,
            8,
        );
        this.lockOverlay.setInteractive(
            new Geom.Rectangle(
                toggleX - ar.w / 2,
                toggleY - ar.h / 2,
                ar.w,
                ar.h,
            ),
            Geom.Rectangle.Contains,
        );
        this.lockOverlay.on('pointerdown', () => this.handleToggleClick());
        this.add(this.lockOverlay);

        this.lockIcon = scene.add.image(toggleX, toggleY - 22, 'ui_lock_md')
            .setDisplaySize(44, 44);
        this.add(this.lockIcon);

        this.lockLabel = scene.add.text(toggleX, toggleY + 14, t('autoroll_locked_level', { level: String(AUTOROLL_TOGGLE.unlockLevel) }), {
            fontFamily: UI.FONT_STROKE, fontSize: '17px',
            color: '#999999', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add(this.lockLabel);

        this.lockOverlay.setVisible(false);
        this.lockIcon.setVisible(false);
        this.lockLabel.setVisible(false);

        // Buff badges
        this.badges = new BuffBadges(scene, l.badges.x, l.badges.y, l.badges.direction);
        this.add(this.badges);

        scene.add.existing(this);
    }

    private handleRollClick(): void {
        if (this.autorollRunning) {
            this.onStopAutoroll();
        } else if (this.autorollEnabled) {
            this.onStartAutoroll();
        } else {
            this.onRoll();
        }
    }

    private handleToggleClick(): void {
        if (this.isLocked) {
            showToast(this.scene, t('toast_level_required', { level: String(AUTOROLL_TOGGLE.unlockLevel) }), 'error');
            return;
        }
        this.onToggleAutoroll(!this.autorollEnabled);
    }

    setLocked(locked: boolean): void {
        this.isLocked = locked;
        this.lockOverlay.setVisible(locked);
        this.lockIcon.setVisible(locked);
        this.lockLabel.setVisible(locked);
        this.toggleImg.setVisible(!locked);
        if (locked) {
            this.toggleImg.disableInteractive();
        } else {
            this.toggleImg.setInteractive({ useHandCursor: true });
        }
    }

    setRolling(rolling: boolean): void {
        if (this.autorollRunning) {
            this.setRollLabel(t('roll_stop'));
        } else if (this.autorollEnabled) {
            this.setRollLabel(t('roll_auto'));
        } else if (rolling) {
            this.rollWrap.scene.tweens.killTweensOf(this.rollWrap);
            this.rollWrap.setScale(1);
            this.rollBg.setAlpha(0.5);
            this.rollBg.disableInteractive();
            this.setRollLabel(t('rolling'));
        } else {
            this.rollBg.setAlpha(1);
            this.rollBg.setInteractive({ useHandCursor: true });
            this.setRollLabel(t('roll_button'));
        }
    }

    updateBuffDisplay(buffs: BuffSystem): void {
        this.badges.updateFromBuffs(buffs);

        const wasEnabled = this.autorollEnabled;
        const wasRunning = this.autorollRunning;
        this.autorollEnabled = buffs.isAutorollEnabled();
        this.autorollRunning = buffs.isAutorollActive();

        // Update toggle image (skip if locked — toggle is hidden)
        if (!this.isLocked) {
            this.toggleImg.setTexture(this.autorollEnabled ? 'ui_automod_on' : 'ui_automod_off');
        }

        // Update roll button label based on state
        if (this.autorollRunning) {
            this.setRollLabel(t('roll_stop'));
            this.rollBg.setAlpha(1);
            this.rollBg.setInteractive({ useHandCursor: true });
        } else if (this.autorollEnabled) {
            this.setRollLabel(t('roll_auto'));
            this.rollBg.setAlpha(1);
            this.rollBg.setInteractive({ useHandCursor: true });
        } else if (wasEnabled || wasRunning) {
            // Was in autoroll mode, now back to normal
            this.setRollLabel(t('roll_button'));
            this.rollBg.setAlpha(1);
            this.rollBg.setInteractive({ useHandCursor: true });
        }
        // else: normal state, don't overwrite "Hatching..." during a roll
    }

    private setRollLabel(text: string): void {
        this.rollLabel.setText(text);
        fitText(this.rollLabel, this.rollW - 25, parseInt(this.rollLabel.style.fontSize as string));
    }
}
