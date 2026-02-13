import { GameObjects, Scene } from 'phaser';
import { UI } from '../core/config';
import { TOTAL_PETS } from '../data/pets';
import { t } from '../data/locales';

export class CollectionButton extends GameObjects.Container {
    private countText: GameObjects.Text;

    constructor(scene: Scene, onClick: () => void) {
        super(scene, 52, 235);

        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.5);
        bg.fillRoundedRect(-42, -32, 84, 64, 10);
        bg.lineStyle(2, UI.PANEL_BORDER, 0.4);
        bg.strokeRoundedRect(-42, -32, 84, 64, 10);
        this.add(bg);

        const label = scene.add.text(0, -14, t('collection_button'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        this.add(label);

        this.countText = scene.add.text(0, 8, `0/${TOTAL_PETS}`, {
            fontFamily: UI.FONT_MAIN,
            fontSize: '13px',
            color: UI.ACCENT_ORANGE_HEX,
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add(this.countText);

        this.setSize(84, 64);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', onClick);

        scene.add.existing(this);
    }

    updateCount(n: number): void {
        this.countText.setText(`${n}/${TOTAL_PETS}`);
    }
}
