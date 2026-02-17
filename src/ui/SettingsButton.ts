import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH } from '../core/config';
import { addButtonFeedback } from './components/buttonFeedback';

export class SettingsButton extends GameObjects.Container {
    constructor(scene: Scene, onPress: () => void) {
        super(scene, GAME_WIDTH - 40, 36);

        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.75);
        bg.fillCircle(0, 0, 26);
        this.add(bg);

        const icon = scene.add.text(0, 2, '\u2699', {
            fontSize: '36px',
            color: '#ffffff',
            resolution: 2,
        }).setOrigin(0.5);
        this.add(icon);

        this.setSize(52, 52);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', onPress);
        addButtonFeedback(scene, this, { hoverScale: 1.08 });

        scene.add.existing(this);
    }
}
