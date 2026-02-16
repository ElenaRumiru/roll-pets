import { GameObjects, Scene } from 'phaser';
import { UI, ROLL_BTN } from '../core/config';
import { BuffBadges } from './BuffBadges';
import { BuffSystem } from '../systems/BuffSystem';
import { t } from '../data/locales';

export class RightPanel extends GameObjects.Container {
    private rollBg: GameObjects.Image;
    private rollLabel: GameObjects.Text;
    private badges: BuffBadges;
    private spaceHint: GameObjects.Text;
    private autorollActive = false;
    private autorollPaused = false;

    private onRoll: () => void;
    private onStopAutoroll: () => void;
    private onResumeAutoroll: () => void;

    constructor(
        scene: Scene,
        onRoll: () => void,
        onStopAutoroll: () => void,
        onResumeAutoroll: () => void,
    ) {
        super(scene, 0, 0);

        this.onRoll = onRoll;
        this.onStopAutoroll = onStopAutoroll;
        this.onResumeAutoroll = onResumeAutoroll;

        // Roll button using image
        this.rollBg = scene.add.image(ROLL_BTN.x, ROLL_BTN.y, 'ui_roll')
            .setDisplaySize(ROLL_BTN.width, ROLL_BTN.height)
            .setInteractive({ useHandCursor: true });
        this.rollBg.on('pointerdown', () => this.handleRollClick());
        this.add(this.rollBg);

        // Roll text overlay
        this.rollLabel = scene.add.text(ROLL_BTN.x, ROLL_BTN.y, t('roll_button'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        this.add(this.rollLabel);

        // Space hint
        this.spaceHint = scene.add.text(ROLL_BTN.x, ROLL_BTN.y + 36, 'SPACE', {
            fontFamily: UI.FONT_BODY, fontSize: '10px', color: '#666666',
        }).setOrigin(0.5);
        this.add(this.spaceHint);

        // Buff badges above roll button
        this.badges = new BuffBadges(scene, ROLL_BTN.x, ROLL_BTN.y - 36);
        this.add(this.badges);

        scene.add.existing(this);
    }

    private handleRollClick(): void {
        if (this.autorollActive) {
            this.onStopAutoroll();
        } else if (this.autorollPaused) {
            this.onResumeAutoroll();
        } else {
            this.onRoll();
        }
    }

    setRolling(rolling: boolean): void {
        if (this.autorollActive) {
            this.rollLabel.setText(t('roll_stop'));
        } else if (this.autorollPaused) {
            this.rollLabel.setText(t('roll_auto'));
        } else if (rolling) {
            this.rollBg.setAlpha(0.5);
            this.rollBg.disableInteractive();
            this.rollLabel.setText(t('rolling'));
        } else {
            this.rollBg.setAlpha(1);
            this.rollBg.setInteractive({ useHandCursor: true });
            this.rollLabel.setText(t('roll_button'));
        }
    }

    updateBuffDisplay(buffs: BuffSystem): void {
        this.badges.updateFromBuffs(buffs);

        // Autoroll state on roll button
        const wasAuto = this.autorollActive;
        const wasPaused = this.autorollPaused;
        this.autorollActive = buffs.isAutorollActive();
        this.autorollPaused = buffs.isAutorollPaused();

        if (this.autorollActive && !wasAuto) {
            this.rollLabel.setText(t('roll_stop'));
            this.rollBg.setAlpha(1);
            this.rollBg.setInteractive({ useHandCursor: true });
        } else if (!this.autorollActive && wasAuto) {
            if (this.autorollPaused) {
                this.rollLabel.setText(t('roll_auto'));
            } else {
                this.rollLabel.setText(t('roll_button'));
            }
        } else if (this.autorollPaused && !wasPaused) {
            this.rollLabel.setText(t('roll_auto'));
            this.rollBg.setAlpha(1);
            this.rollBg.setInteractive({ useHandCursor: true });
        } else if (!this.autorollPaused && wasPaused && !this.autorollActive) {
            this.rollLabel.setText(t('roll_button'));
        }
    }
}
