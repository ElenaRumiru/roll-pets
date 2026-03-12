import { GameObjects, Scene } from 'phaser';
import { THEME } from '../core/config';
import { getLayout } from '../core/layout';
import { addButtonFeedback } from './components/buttonFeedback';

export class SettingsButton extends GameObjects.Container {
    constructor(scene: Scene, onPress: () => void) {
        const l = getLayout();
        super(scene, l.settingsBtn.x, l.settingsBtn.y);

        const bg = scene.add.graphics();
        bg.fillStyle(THEME.PANEL_BG, THEME.PANEL_ALPHA);
        bg.fillCircle(0, 0, 20);
        bg.lineStyle(2, 0x000000, 0.7);
        bg.strokeCircle(0, 0, 20);
        this.add(bg);

        const icon = scene.add.image(0, 0, 'ui_settings_md')
            .setDisplaySize(31, 31);
        this.add(icon);

        this.setSize(42, 42);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', onPress);
        addButtonFeedback(scene, this);

        scene.add.existing(this);
    }
}
