import { GameObjects, Scene } from 'phaser';
import { UI, ROLL_BTN, AUTOROLL_TOGGLE } from '../core/config';
import { BuffBadges } from './BuffBadges';
import { BuffSystem } from '../systems/BuffSystem';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';

export class RightPanel extends GameObjects.Container {
    private rollWrap: GameObjects.Container;
    private rollBg: GameObjects.Image;
    private rollLabel: GameObjects.Text;
    private badges: BuffBadges;
    private spaceHint: GameObjects.Text;
    private toggleImg: GameObjects.Image;
    private autorollEnabled = false;
    private autorollRunning = false;

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

        // Roll button wrapper (for scaling image + text together)
        this.rollWrap = scene.add.container(ROLL_BTN.x, ROLL_BTN.y);
        this.add(this.rollWrap);

        this.rollBg = scene.add.image(0, 0, 'ui_roll')
            .setDisplaySize(ROLL_BTN.width, ROLL_BTN.height)
            .setInteractive({ useHandCursor: true });
        this.rollBg.on('pointerdown', () => this.handleRollClick());
        this.rollWrap.add(this.rollBg);

        this.rollLabel = scene.add.text(0, -5, t('roll_button'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '35px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        this.rollWrap.add(this.rollLabel);

        this.spaceHint = scene.add.text(0, 44, 'SPACE', {
            fontFamily: UI.FONT_BODY, fontSize: '12px', color: '#666666',
        }).setOrigin(0.5);
        this.rollWrap.add(this.spaceHint);

        addButtonFeedback(scene, this.rollBg, { scaleTarget: this.rollWrap });

        // Autoroll toggle button (right of Roll, bottom-aligned)
        const toggleX = ROLL_BTN.x + ROLL_BTN.width / 2 + AUTOROLL_TOGGLE.gap + AUTOROLL_TOGGLE.width / 2 - 9;
        const rollBottom = ROLL_BTN.y + ROLL_BTN.height / 2;
        const toggleY = rollBottom - AUTOROLL_TOGGLE.height / 2 - 12;
        this.toggleImg = scene.add.image(toggleX, toggleY, 'ui_automod_off')
            .setDisplaySize(AUTOROLL_TOGGLE.width, AUTOROLL_TOGGLE.height)
            .setInteractive({ useHandCursor: true });
        this.toggleImg.on('pointerdown', () => this.handleToggleClick());
        this.add(this.toggleImg);
        addButtonFeedback(scene, this.toggleImg);

        // Buff badges above roll button (almost touching top edge)
        this.badges = new BuffBadges(scene, ROLL_BTN.x, ROLL_BTN.y - ROLL_BTN.height / 2 - 12);
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
        this.onToggleAutoroll(!this.autorollEnabled);
    }

    setRolling(rolling: boolean): void {
        if (this.autorollRunning) {
            this.rollLabel.setText(t('roll_stop'));
        } else if (this.autorollEnabled) {
            this.rollLabel.setText(t('roll_auto'));
        } else if (rolling) {
            this.rollWrap.scene.tweens.killTweensOf(this.rollWrap);
            this.rollWrap.setScale(1);
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

        const wasEnabled = this.autorollEnabled;
        const wasRunning = this.autorollRunning;
        this.autorollEnabled = buffs.isAutorollEnabled();
        this.autorollRunning = buffs.isAutorollActive();

        // Update toggle image
        this.toggleImg.setTexture(this.autorollEnabled ? 'ui_automod_on' : 'ui_automod_off');

        // Update roll button label based on state
        if (this.autorollRunning) {
            this.rollLabel.setText(t('roll_stop'));
            this.rollBg.setAlpha(1);
            this.rollBg.setInteractive({ useHandCursor: true });
        } else if (this.autorollEnabled) {
            this.rollLabel.setText(t('roll_auto'));
            this.rollBg.setAlpha(1);
            this.rollBg.setInteractive({ useHandCursor: true });
        } else if (wasEnabled || wasRunning) {
            // Was in autoroll mode, now back to normal
            this.rollLabel.setText(t('roll_button'));
            this.rollBg.setAlpha(1);
            this.rollBg.setInteractive({ useHandCursor: true });
        }
        // else: normal state, don't overwrite "Hatching..." during a roll
    }
}
