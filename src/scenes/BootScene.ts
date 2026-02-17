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

        // Backgrounds (location_1 .. location_17)
        for (let i = 1; i <= TOTAL_BACKGROUNDS; i++) {
            this.load.image(`bg_${i}`, `assets/backgrounds/location_${i}.webp`);
        }

        // Eggs (egg_1 .. egg_17)
        for (let i = 1; i <= TOTAL_EGGS; i++) {
            this.load.image(`egg_${i}`, `assets/eggs/egg_${i}.png`);
        }

        // Audio
        this.load.audio('bgm', 'assets/audio/bgm.mp3');
        this.load.audio('sfx_click', 'assets/audio/sfx_click.mp3');
        this.load.audio('sfx_wobble', 'assets/audio/sfx_wobble.mp3');
        this.load.audio('sfx_reveal', 'assets/audio/sfx_reveal.mp3');
        this.load.audio('sfx_new_pet', 'assets/audio/sfx_new_pet.mp3');

        // UI assets
        this.load.image('ui_roll', 'assets/ui/button_black_outline_shadow_width130.png');
        this.load.image('ui_collections', 'assets/ui/collections.png');
        this.load.image('ui_x2chance', 'assets/ui/x2chance.png');
        this.load.image('ui_x3chance', 'assets/ui/x3chance.png');
        this.load.image('ui_x5chance', 'assets/ui/x5chance.png');
        this.load.image('ui_x5chance_ready', 'assets/ui/x5chance_ready.png');
        this.load.image('ui_auto', 'assets/ui/auto.png');
        this.load.image('ui_arrow', 'assets/ui/arrow.webp');

        // Pet images (deduplicate — multiple pets share sprites)
        const loadedKeys = new Set<string>();
        for (const pet of PETS) {
            if (loadedKeys.has(pet.imageKey)) continue;
            loadedKeys.add(pet.imageKey);
            const filename = pet.imageKey.replace('pet_', '');
            this.load.image(pet.imageKey, `assets/pets/${filename}.webp`);
        }
    }

    create(): void {
        // Pre-downscale roll button to avoid moiré (1927px → 680px via high-quality canvas resample)
        const img = this.textures.get('ui_roll').getSourceImage() as HTMLImageElement;
        const canvas = document.createElement('canvas');
        const targetW = 680; // 2x display size for crisp rendering
        const targetH = Math.round(targetW * (img.height / img.width));
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);
        this.textures.remove('ui_roll');
        this.textures.addCanvas('ui_roll', canvas);

        const renderer = this.game.renderer;
        if (renderer instanceof Renderer.WebGL.WebGLRenderer) {
            renderer.pipelines.addPostPipeline('IdleWobbleFX', IdleWobbleFX);
        }
        this.scene.start('MainScene');
    }
}
