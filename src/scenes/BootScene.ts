import { Scene, Renderer } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { IdleWobbleFX } from '../ui/IdleWobbleFX';
import { PETS } from '../data/pets';
import { TOTAL_EGGS } from '../data/eggs';
import { TOTAL_BACKGROUNDS } from '../data/backgrounds';

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

        // Backgrounds (bg_1 .. bg_14)
        for (let i = 1; i <= TOTAL_BACKGROUNDS; i++) {
            this.load.image(`bg_${i}`, `assets/backgrounds/bg_${i}.jpg`);
        }

        // Eggs (egg_1 .. egg_15)
        for (let i = 1; i <= TOTAL_EGGS; i++) {
            this.load.image(`egg_${i}`, `assets/eggs/egg_${i}.png`);
        }

        // Audio
        this.load.audio('bgm', 'assets/audio/bgm.mp3');
        this.load.audio('sfx_click', 'assets/audio/sfx_click.mp3');
        this.load.audio('sfx_wobble', 'assets/audio/sfx_wobble.mp3');
        this.load.audio('sfx_reveal', 'assets/audio/sfx_reveal.mp3');
        this.load.audio('sfx_new_pet', 'assets/audio/sfx_new_pet.mp3');

        // Pet images
        for (const pet of PETS) {
            const filename = pet.imageKey.replace('pet_', '');
            this.load.image(pet.imageKey, `assets/pets/${filename}.webp`);
        }
    }

    create(): void {
        const renderer = this.game.renderer;
        if (renderer instanceof Renderer.WebGL.WebGLRenderer) {
            renderer.pipelines.addPostPipeline('IdleWobbleFX', IdleWobbleFX);
        }
        this.scene.start('MainScene');
    }
}
