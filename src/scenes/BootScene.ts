import { Scene, Renderer } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { IdleWobbleFX } from '../ui/IdleWobbleFX';
import { PETS } from '../data/pets';
import { TOTAL_EGGS } from '../data/eggs';
import { TOTAL_BACKGROUNDS } from '../data/backgrounds';
import { AudioSystem } from '../systems/AudioSystem';
import { GameManager } from '../core/GameManager';
import { setLanguage } from '../data/locales';
import { GRADE_ORDER } from '../core/config';
import { COL_ICON_NAMES } from '../data/collections';

export class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    preload(): void {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // Dark background matching THEME.SCENE_BG
        this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x12121e);

        // Load illustration first (inline base64 not needed — just load early)
        this.load.image('ui_illustration', 'assets/ui/illustration.png');

        // Illustration — pre-downscale via canvas for crisp rendering
        const illustrationY = cy - 75;
        const TARGET_ILLUST_W = 420;
        this.load.once('filecomplete-image-ui_illustration', () => {
            const src = this.textures.get('ui_illustration').getSourceImage() as HTMLImageElement;
            const ratio = TARGET_ILLUST_W / src.width;
            const dw = TARGET_ILLUST_W;
            const dh = Math.round(src.height * ratio);
            const c = document.createElement('canvas');
            c.width = dw;
            c.height = dh;
            const ctx = c.getContext('2d')!;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(src, 0, 0, dw, dh);
            this.textures.remove('ui_illustration');
            this.textures.addCanvas('ui_illustration_hq', c);
            this.add.image(cx, illustrationY, 'ui_illustration_hq').setOrigin(0.5);
        });

        // Title
        this.add.text(cx, cy + 42, 'PETS ROLL', {
            fontFamily: 'Rubik Black',
            fontSize: '38px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
        }).setOrigin(0.5);

        // Progress bar (game-style: pill shape, triple outline, highlight shine)
        const BAR_W = 300;
        const BAR_H = 22;
        const BAR_R = BAR_H / 2;
        const barY = cy + 82;
        const barX = cx - BAR_W / 2;

        const barGfx = this.add.graphics();

        // Percentage text on top of bar
        const pctText = this.add.text(cx, barY, '0%', {
            fontFamily: 'Rubik',
            fontSize: '13px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5).setDepth(1);

        const drawBar = (value: number) => {
            barGfx.clear();

            // Bar background
            barGfx.fillStyle(0x222244, 0.6);
            barGfx.fillRoundedRect(barX, barY - BAR_H / 2, BAR_W, BAR_H, BAR_R);

            // Triple outline (black → gold → black)
            barGfx.lineStyle(1.5, 0x000000, 0.9);
            barGfx.strokeRoundedRect(barX - 4, barY - BAR_H / 2 - 4, BAR_W + 8, BAR_H + 8, BAR_R + 3);
            barGfx.lineStyle(2.5, 0xFEBF07, 1);
            barGfx.strokeRoundedRect(barX - 2, barY - BAR_H / 2 - 2, BAR_W + 4, BAR_H + 4, BAR_R + 2);
            barGfx.lineStyle(1.5, 0x000000, 0.9);
            barGfx.strokeRoundedRect(barX, barY - BAR_H / 2, BAR_W, BAR_H, BAR_R);

            // Fill
            const fillW = Math.max(0, value * BAR_W);
            if (fillW > 2) {
                const fw = Math.min(fillW, BAR_W - 2);
                const fr = fw >= BAR_H ? BAR_R - 1 : 0;
                barGfx.fillStyle(0x3cb8e8, 1);
                barGfx.fillRoundedRect(barX + 1, barY - BAR_H / 2 + 1, fw, BAR_H - 2, fr);

                // Highlight shine on fill
                if (fw > 4) {
                    const hr = fw >= BAR_H ? { tl: BAR_R - 2, tr: BAR_R - 2, bl: 0, br: 0 } : 0;
                    barGfx.fillStyle(0xffffff, 0.2);
                    barGfx.fillRoundedRect(barX + 2, barY - BAR_H / 2 + 2, fw - 2, (BAR_H - 4) * 0.4, hr);
                }
            }

            pctText.setText(`${Math.round(value * 100)}%`);
        };

        drawBar(0);

        this.load.on('progress', (value: number) => {
            drawBar(value);
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
        this.load.audio('sfx_levelup', 'assets/audio/sfx_levelup.mp3');

        // Grade-specific jackpot SFX (common uses sfx_reveal, no separate file)
        for (const g of GRADE_ORDER) {
            if (g === 'common') continue;
            this.load.audio(`sfx_grade_${g}`, `assets/audio/sfx_grade_${g}.mp3`);
        }

        // UI assets
        this.load.image('ui_roll', 'assets/ui/roll.png');
        this.load.image('ui_collections', 'assets/ui/collections.png');
        // Luck clover icons (24 variants)
        const LUCK_SUFFIXES = [
            'empty','x2','x3','x4','x5','x6','x7','x8','x9','x10',
            'x15','x20','x25','x30','x50','x75','x100','x150','x200','x300',
            'x400','x500','x1000','x3000',
        ];
        for (const s of LUCK_SUFFIXES) {
            this.load.image(`luck_${s}`, `assets/ui/Luck_${s}.png`);
        }
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
        this.load.image('ui_star_active_raw', 'assets/ui/star_active.png');
        this.load.image('ui_star_inactive_raw', 'assets/ui/star_not_active.png');
        this.load.image('ui_ok_raw', 'assets/ui/ok_icon.png');
        this.load.image('ui_settings_raw', 'assets/ui/settings_icon.png');
        this.load.image('ui_daily_raw', 'assets/ui/daily_icon.png');
        this.load.image('ui_nests_raw', 'assets/ui/incubation_icon.png');
        this.load.image('ui_nest_raw', 'assets/ui/nest.png');
        this.load.image('ui_lock_raw', 'assets/ui/lock_icon.png');
        this.load.image('ui_shock_raw', 'assets/ui/shock_icon.png');
        this.load.image('ui_rebirth_raw', 'assets/ui/rebirth.png');
        this.load.image('ui_dialog_right_raw', 'assets/ui/dialog_icon.png');
        this.load.image('ui_dialog_left_raw', 'assets/ui/dialog_icon_2.png');
        this.load.image('ui_arrow_l_raw', 'assets/ui/arrow_l.png');
        this.load.image('ui_arrow_r_raw', 'assets/ui/arrow_r.png');

        // Collection icons (24 themed medallions)
        for (const name of COL_ICON_NAMES) {
            this.load.image(`col_${name}_raw`, `assets/ui/collections/${name}.png`);
        }

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

        // Trim+downscale luck clover icons → _lg (54px), _md (28px), _sm (16px)
        const LUCK_SUFFIXES = [
            'empty','x2','x3','x4','x5','x6','x7','x8','x9','x10',
            'x15','x20','x30','x50','x100','x150','x300','x400','x500','x1000',
        ];
        for (const s of LUCK_SUFFIXES) {
            this.trimAndDownscaleCoin(`luck_${s}`, [
                { key: `luck_${s}_lg`, size: 54 },
                { key: `luck_${s}_md`, size: 28 },
                { key: `luck_${s}_sm`, size: 16 },
            ]);
        }

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

        // Trim shock icon for hatch animation
        this.trimAndDownscaleCoin('ui_shock_raw', [
            { key: 'ui_shock_sm', size: 36 },
        ]);

        // Trim rebirth icon
        this.trimToWidth('ui_rebirth_raw', 'ui_rebirth_md', 120);

        // Trim dialog bubble icons for PetThought
        this.trimToWidth('ui_dialog_right_raw', 'ui_dialog_right', 160);
        this.trimToWidth('ui_dialog_left_raw', 'ui_dialog_left', 160);

        // Trim arrow icons for collection detail nav (preserve aspect ratio)
        this.trimToHeight('ui_arrow_l_raw', 'ui_arrow_l', 56);
        this.trimToHeight('ui_arrow_r_raw', 'ui_arrow_r', 56);

        // Trim star icons for collection difficulty display
        this.trimToHeight('ui_star_active_raw', 'ui_star_active', 28);
        this.trimToHeight('ui_star_inactive_raw', 'ui_star_inactive', 28);

        // Collection icons — copy at full resolution, let GPU handle display scaling
        for (const name of COL_ICON_NAMES) {
            const src = this.textures.get(`col_${name}_raw`).getSourceImage() as HTMLImageElement;
            const c = document.createElement('canvas');
            c.width = src.width;
            c.height = src.height;
            c.getContext('2d')!.drawImage(src, 0, 0);
            this.textures.addCanvas(`col_${name}`, c);
        }

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
