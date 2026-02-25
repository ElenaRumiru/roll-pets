import { Scene, Renderer } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { IdleWobbleFX } from '../ui/IdleWobbleFX';
import { PETS } from '../data/pets';
import { TOTAL_EGGS } from '../data/eggs';
import { TOTAL_BACKGROUNDS } from '../data/backgrounds';
import { AudioSystem } from '../systems/AudioSystem';
import { GameManager } from '../core/GameManager';
import { setLanguage } from '../data/locales';

export class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    preload(): void {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // Loading bar
        this.add.rectangle(cx, cy, 370, 25).setStrokeStyle(2, 0xffffff);
        const bar = this.add.rectangle(cx - 183, cy, 5, 20, 0xffffff);

        this.add.text(cx, cy - 37, 'PETS GO Lite', {
            fontFamily: 'Arial Black',
            fontSize: '30px',
            color: '#ffffff',
        }).setOrigin(0.5);

        this.load.on('progress', (value: number) => {
            bar.width = 5 + 360 * value;
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
        this.load.image('ui_roll', 'assets/ui/roll.png');
        this.load.image('ui_collections', 'assets/ui/collections.png');
        this.load.image('ui_x2chance', 'assets/ui/x2chance.png');
        this.load.image('ui_x3chance', 'assets/ui/x3chance.png');
        this.load.image('ui_x5chance', 'assets/ui/x5chance.png');
        this.load.image('ui_x5chance_ready', 'assets/ui/x5chance_ready.png');
        this.load.image('ui_x2simple', 'assets/ui/x2chanceSimple.png');
        this.load.image('ui_x3simple', 'assets/ui/x3chanceSimple.png');
        this.load.image('ui_x3wow', 'assets/ui/x3wow.png');
        this.load.image('ui_x5wow', 'assets/ui/x5chanceWow.png');
        this.load.image('ui_auto', 'assets/ui/auto.png');
        this.load.image('ui_automod_on', 'assets/ui/automod_on.png');
        this.load.image('ui_automod_off', 'assets/ui/automod_off.png');
        this.load.image('ui_arrow', 'assets/ui/arrow.webp');
        this.load.image('ui_ad_film', 'assets/ui/ad_film.png');
        this.load.image('ui_ad_play', 'assets/ui/ad_play.png');
        this.load.image('ui_coin_raw', 'assets/ui/coin.png');
        this.load.image('ui_exp_raw', 'assets/ui/exp.png');
        this.load.image('ui_lvl_raw', 'assets/ui/lvl_icon.png');
        this.load.image('ui_shop', 'assets/ui/shop_icon.png');
        this.load.image('ui_rating', 'assets/ui/Rating_icon.png');
        this.load.image('ui_rating_2', 'assets/ui/Rating_icon_2.png');
        this.load.image('ui_rating_3', 'assets/ui/Rating_icon_3.png');
        this.load.image('ui_quest_icon', 'assets/ui/quests_icon.png');
        this.load.image('ui_gift_raw', 'assets/ui/gift_green2_icon.png');
        this.load.image('ui_ok_raw', 'assets/ui/ok_icon.png');
        this.load.image('ui_settings_raw', 'assets/ui/settings_icon.png');
        this.load.image('ui_daily_raw', 'assets/ui/daily_icon.png');
        this.load.image('ui_nests_raw', 'assets/ui/incubation_icon.png');
        this.load.image('ui_nest_raw', 'assets/ui/nest.png');
        this.load.image('ui_lock_raw', 'assets/ui/lock_icon.png');

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
        // Pre-downscale autoroll toggle images to avoid moiré at 94×58 display size
        for (const key of ['ui_automod_on', 'ui_automod_off']) {
            const src = this.textures.get(key).getSourceImage() as HTMLImageElement;
            const c = document.createElement('canvas');
            c.width = 232;  // 2x display width for crisp rendering
            c.height = 144; // 2x display height
            const cx2 = c.getContext('2d')!;
            cx2.imageSmoothingEnabled = true;
            cx2.imageSmoothingQuality = 'high';
            cx2.drawImage(src, 0, 0, 232, 144);
            this.textures.remove(key);
            this.textures.addCanvas(key, c);
        }

        // Pre-downscale pet textures (512px → 250px) to avoid WebGL aliasing
        const TARGET_PET = 250;
        const loadedKeys = new Set<string>();
        for (const pet of PETS) {
            if (loadedKeys.has(pet.imageKey)) continue;
            loadedKeys.add(pet.imageKey);
            const src = this.textures.get(pet.imageKey).getSourceImage() as HTMLImageElement;
            const ratio = Math.min(TARGET_PET / src.width, TARGET_PET / src.height, 1);
            const w = Math.round(src.width * ratio);
            const h = Math.round(src.height * ratio);
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            const cx2 = c.getContext('2d')!;
            cx2.imageSmoothingEnabled = true;
            cx2.imageSmoothingQuality = 'high';
            cx2.drawImage(src, 0, 0, w, h);
            this.textures.remove(pet.imageKey);
            this.textures.addCanvas(pet.imageKey, c);
        }

        // Pre-downscale egg textures (1024px → 170px) for shop/nests/popup
        // Original stays for CenterStage roll (296px display)
        const TARGET_EGG = 170;
        for (let i = 1; i <= TOTAL_EGGS; i++) {
            const key = `egg_${i}`;
            const eSrc = this.textures.get(key).getSourceImage() as HTMLImageElement;
            const eC = document.createElement('canvas');
            eC.width = TARGET_EGG;
            eC.height = TARGET_EGG;
            const eCtx = eC.getContext('2d')!;
            eCtx.imageSmoothingEnabled = true;
            eCtx.imageSmoothingQuality = 'high';
            eCtx.drawImage(eSrc, 0, 0, TARGET_EGG, TARGET_EGG);
            this.textures.addCanvas(`${key}_sm`, eC);
        }

        // Pre-downscale shop icon for crisp rendering (original 1536x1024, ratio 3:2)
        this.downscaleTexture('ui_shop', 'ui_shop_mid', 370, 247);

        // Pre-downscale buff icons → "mid" size (2x BonusPanel display: 102px / 112px)
        this.downscaleTexture('ui_x2simple', 'ui_x2simple_mid', 126, 126);
        this.downscaleTexture('ui_x3wow', 'ui_x3wow_mid', 126, 126);
        this.downscaleTexture('ui_x5wow', 'ui_x5wow_mid', 138, 138);

        // Pre-downscale quest icon for crisp rendering
        this.downscaleTexture('ui_quest_icon', 'ui_quest_mid', 260, 174);

        // Trim gift icon and create size variants
        this.trimAndDownscaleCoin('ui_gift_raw', [
            { key: 'ui_gift_lg', size: 80 },
            { key: 'ui_gift_md', size: 54 },
            { key: 'ui_gift_sm', size: 30 },
        ]);

        // Trim ok/check icon and create size variants
        this.trimAndDownscaleCoin('ui_ok_raw', [
            { key: 'ui_ok_lg', size: 60 },
            { key: 'ui_ok_md', size: 40 },
            { key: 'ui_ok_sm', size: 24 },
        ]);

        // Trim transparent pixels from coin icon and create size variants
        this.trimAndDownscaleCoin('ui_coin_raw', [
            { key: 'ui_coin_lg', size: 80 },
            { key: 'ui_coin_md', size: 54 },
            { key: 'ui_coin_sm', size: 20 },
        ]);

        // Trim exp icon preserving aspect ratio (wide text, not square)
        this.trimToHeight('ui_exp_raw', 'ui_exp_md', 44);

        // Trim level shield icon and create size variant
        this.trimAndDownscaleCoin('ui_lvl_raw', [
            { key: 'ui_lvl_md', size: 60 },
        ]);

        // Trim settings icon and create size variant
        this.trimAndDownscaleCoin('ui_settings_raw', [
            { key: 'ui_settings_md', size: 56 },
        ]);

        // Trim daily bonus icon — create square variant + wide button variant
        this.trimAndDownscaleCoin('ui_daily_raw', [
            { key: 'ui_daily_md', size: 90 },
        ]);
        this.trimToWidth('ui_daily_raw', 'ui_daily_btn', 130);

        // Trim rating icon at exact display width (1:1 pixel mapping, no WebGL scaling)
        this.trimToWidth('ui_rating_3', 'ui_rating_mid', 99);

        // Trim nest icons for crisp rendering
        this.trimToWidth('ui_nests_raw', 'ui_nests_btn', 220);
        this.trimToWidth('ui_nest_raw', 'ui_nest_mid', 280);

        // Trim lock icon for nest slots
        this.trimAndDownscaleCoin('ui_lock_raw', [
            { key: 'ui_lock_md', size: 56 },
        ]);

        const renderer = this.game.renderer;
        if (renderer instanceof Renderer.WebGL.WebGLRenderer) {
            renderer.pipelines.addPostPipeline('IdleWobbleFX', IdleWobbleFX);
        }
        const manager = new GameManager();
        this.registry.set('gameManager', manager);

        const settings = manager.save.getData().settings;
        setLanguage(settings.language);
        const audio = new AudioSystem(this.game.sound, settings.music, settings.volume, settings.sfx, settings.sfxVolume);
        this.registry.set('audio', audio);
        audio.startBGM();

        this.scene.start('MainScene');
    }

    /** Trim transparent pixels from source, then create multiple sized textures */
    private trimAndDownscaleCoin(srcKey: string, targets: { key: string; size: number }[]): void {
        const src = this.textures.get(srcKey).getSourceImage() as HTMLImageElement;
        const tmp = document.createElement('canvas');
        tmp.width = src.width;
        tmp.height = src.height;
        const tmpCtx = tmp.getContext('2d')!;
        tmpCtx.drawImage(src, 0, 0);
        const data = tmpCtx.getImageData(0, 0, tmp.width, tmp.height);
        let top = tmp.height, left = tmp.width, bottom = 0, right = 0;
        for (let y = 0; y < tmp.height; y++) {
            for (let x = 0; x < tmp.width; x++) {
                if (data.data[(y * tmp.width + x) * 4 + 3] > 10) {
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                    if (x < left) left = x;
                    if (x > right) right = x;
                }
            }
        }
        const tw = right - left + 1;
        const th = bottom - top + 1;
        for (const { key, size } of targets) {
            const c = document.createElement('canvas');
            c.width = size;
            c.height = size;
            const ctx = c.getContext('2d')!;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            const scale = Math.min(size / tw, size / th);
            const dw = Math.round(tw * scale);
            const dh = Math.round(th * scale);
            ctx.drawImage(src, left, top, tw, th, (size - dw) / 2, (size - dh) / 2, dw, dh);
            this.textures.addCanvas(key, c);
        }
    }

    /** Trim transparent pixels, then scale so width = targetWidth, preserving aspect ratio */
    private trimToWidth(srcKey: string, destKey: string, targetWidth: number): void {
        const src = this.textures.get(srcKey).getSourceImage() as HTMLImageElement;
        const tmp = document.createElement('canvas');
        tmp.width = src.width;
        tmp.height = src.height;
        const tmpCtx = tmp.getContext('2d')!;
        tmpCtx.drawImage(src, 0, 0);
        const data = tmpCtx.getImageData(0, 0, tmp.width, tmp.height);
        let top = tmp.height, left = tmp.width, bottom = 0, right = 0;
        for (let y = 0; y < tmp.height; y++) {
            for (let x = 0; x < tmp.width; x++) {
                if (data.data[(y * tmp.width + x) * 4 + 3] > 10) {
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                    if (x < left) left = x;
                    if (x > right) right = x;
                }
            }
        }
        const tw = right - left + 1;
        const th = bottom - top + 1;
        const scale = targetWidth / tw;
        const dh = Math.round(th * scale);
        const c = document.createElement('canvas');
        c.width = targetWidth;
        c.height = dh;
        const ctx = c.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(src, left, top, tw, th, 0, 0, targetWidth, dh);
        this.textures.addCanvas(destKey, c);
    }

    /** Trim transparent pixels, then scale so height = targetHeight, preserving aspect ratio */
    private trimToHeight(srcKey: string, destKey: string, targetHeight: number): void {
        const src = this.textures.get(srcKey).getSourceImage() as HTMLImageElement;
        const tmp = document.createElement('canvas');
        tmp.width = src.width;
        tmp.height = src.height;
        const tmpCtx = tmp.getContext('2d')!;
        tmpCtx.drawImage(src, 0, 0);
        const data = tmpCtx.getImageData(0, 0, tmp.width, tmp.height);
        let top = tmp.height, left = tmp.width, bottom = 0, right = 0;
        for (let y = 0; y < tmp.height; y++) {
            for (let x = 0; x < tmp.width; x++) {
                if (data.data[(y * tmp.width + x) * 4 + 3] > 10) {
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                    if (x < left) left = x;
                    if (x > right) right = x;
                }
            }
        }
        const tw = right - left + 1;
        const th = bottom - top + 1;
        const scale = targetHeight / th;
        const dw = Math.round(tw * scale);
        const c = document.createElement('canvas');
        c.width = dw;
        c.height = targetHeight;
        const ctx = c.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(src, left, top, tw, th, 0, 0, dw, targetHeight);
        this.textures.addCanvas(destKey, c);
    }

    /** High-quality canvas resample: create a new smaller texture from source */
    private downscaleTexture(srcKey: string, destKey: string, w: number, h: number): void {
        const src = this.textures.get(srcKey).getSourceImage() as HTMLImageElement;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(src, 0, 0, w, h);
        this.textures.addCanvas(destKey, c);
    }
}
