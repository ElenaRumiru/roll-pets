import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { PETS } from '../data/pets';

export class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    preload(): void {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // Loading bar
        this.add.rectangle(cx, cy, 300, 20).setStrokeStyle(2, 0xffffff);
        const bar = this.add.rectangle(cx - 148, cy, 4, 16, 0xffffff);

        this.add.text(cx, cy - 30, 'PETS GO Lite', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffffff',
        }).setOrigin(0.5);

        this.load.on('progress', (value: number) => {
            bar.width = 4 + 292 * value;
        });

        // Background
        this.load.image('bg_meadow', 'assets/bg_1.jpg');

        // Music
        this.load.audio('bgm', 'assets/audio/bgm.mp3');

        // Pet images
        for (const pet of PETS) {
            const filename = pet.imageKey.replace('pet_', '');
            this.load.image(pet.imageKey, `assets/pets/${filename}.webp`);
        }
    }

    create(): void {
        this.scene.start('MainScene');
    }
}
