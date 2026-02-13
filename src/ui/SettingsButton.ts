import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH } from '../core/config';

export class SettingsButton extends GameObjects.Container {
    constructor(scene: Scene, onPress: () => void) {
        super(scene, GAME_WIDTH - 30, 24);

        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.4);
        bg.fillCircle(0, 0, 18);
        this.add(bg);

        const icon = scene.add.text(0, 0, '\u2699', {
            fontSize: '22px',
            color: '#ffffff',
        }).setOrigin(0.5);
        this.add(icon);

        this.setSize(36, 36);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', onPress);

        scene.add.existing(this);
    }
}
