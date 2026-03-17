import { Scene, Renderer } from 'phaser';
import { getGameWidth, getGameHeight } from '../core/orientation';
import { IdleWobbleFX } from '../ui/IdleWobbleFX';
import { AudioSystem } from '../systems/AudioSystem';
import { GameManager } from '../core/GameManager';
import { setLanguage } from '../data/locales';
import { getVisualTier } from '../core/config';
import { peekSaveData } from '../loading/SavePeek';
import { getPhase1Assets, getTopPetKeys, PROCESSED_LUCK } from '../loading/AssetRegistry';
import { DeferredLoader } from '../loading/DeferredLoader';
import {
    trimAndDownscaleCoin, trimToWidth, trimToHeight, downscaleTexture,
    downscalePet, createEggSmall, processAutomodIcon,
} from '../loading/PostProcess';

export class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    preload(): void {
        const gw = getGameWidth();
        const gh = getGameHeight();
        const cx = gw / 2;
        const cy = gh / 2;

        this.add.rectangle(cx, cy, gw, gh, 0x12121e);

        // Load illustration first for splash screen
        this.load.image('ui_illustration', 'assets/ui/illustration.png');

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
            fontFamily: 'Rubik Black', fontSize: '38px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
        }).setOrigin(0.5);

        // Progress bar
        this.createProgressBar(cx, cy);

        // Peek at save data to determine which assets are critical
        const peek = peekSaveData();
        const topPetKeys = getTopPetKeys(peek.collection, 3);
        const { images, audio } = getPhase1Assets(peek.level, topPetKeys);

        // Load Phase 1 assets only
        for (const { key, path } of images) {
            this.load.image(key, path);
        }
        for (const { key, path } of audio) {
            this.load.audio(key, path);
        }
    }

    create(): void {
        const textures = this.textures;

        // Post-process autoroll toggle icons
        for (const key of ['ui_automod_on', 'ui_automod_off']) {
            processAutomodIcon(textures, key);
        }

        // Portrait roll button
        trimToWidth(textures, 'ui_roll_portrait_raw', 'ui_roll_portrait', 300, 80);

        // Pet textures loaded in Phase 1 (top 3 collection pets)
        const peek = peekSaveData();
        const topPetKeys = getTopPetKeys(peek.collection, 3);
        const processedPets = new Set<string>();
        for (const key of topPetKeys) {
            if (processedPets.has(key) || !textures.exists(key)) continue;
            processedPets.add(key);
            downscalePet(textures, key);
        }

        // Egg small variants for Phase 1 eggs
        const tier = getVisualTier(peek.level);
        createEggSmall(textures, tier);
        if (tier !== 1) createEggSmall(textures, 1);

        // Shop icon
        downscaleTexture(textures, 'ui_shop', 'ui_shop_mid', 370, 247);

        // Luck icons (Phase 1 subset)
        const phase1Luck = ['empty', 'x2', 'x3', 'x5', 'x100'];
        for (const s of phase1Luck) {
            if (PROCESSED_LUCK.includes(s)) {
                trimAndDownscaleCoin(textures, `luck_${s}`, [
                    { key: `luck_${s}_lg`, size: 54 },
                    { key: `luck_${s}_md`, size: 28 },
                    { key: `luck_${s}_sm`, size: 16 },
                ]);
            }
        }

        // Quest icon
        downscaleTexture(textures, 'ui_quest_icon', 'ui_quest_mid', 260, 174);

        // UI icon trim+downscale pipeline
        this.processUIIcons(textures);

        // WebGL post-pipeline
        const renderer = this.game.renderer;
        if (renderer instanceof Renderer.WebGL.WebGLRenderer) {
            renderer.pipelines.addPostPipeline('IdleWobbleFX', IdleWobbleFX);
        }

        // Create game systems
        const manager = new GameManager();
        this.registry.set('gameManager', manager);

        const settings = manager.save.getData().settings;
        setLanguage(settings.language);
        const audio = new AudioSystem(this.game.sound, settings.music, settings.volume, settings.sfx, settings.sfxVolume);
        this.registry.set('audio', audio);
        audio.startBGM();

        // Create deferred loader for Phase 2
        const deferredLoader = new DeferredLoader(this.game);
        this.registry.set('deferredLoader', deferredLoader);
        manager.setDeferredLoader(deferredLoader);

        const sdk = this.registry.get('platformSDK') as import('../platform/PlatformSDK').PlatformSDK | undefined;
        if (sdk) { sdk.setAudio(audio); sdk.gameLoadingFinished(); }

        this.scene.start('MainScene');
    }

    private processUIIcons(textures: Phaser.Textures.TextureManager): void {
        trimAndDownscaleCoin(textures, 'ui_gift_raw', [
            { key: 'ui_gift_lg', size: 80 }, { key: 'ui_gift_md', size: 54 }, { key: 'ui_gift_sm', size: 30 },
        ]);
        trimAndDownscaleCoin(textures, 'ui_ok_raw', [
            { key: 'ui_ok_lg', size: 60 }, { key: 'ui_ok_md', size: 40 }, { key: 'ui_ok_sm', size: 24 },
        ]);
        trimAndDownscaleCoin(textures, 'ui_coin_raw', [
            { key: 'ui_coin_lg', size: 80 }, { key: 'ui_coin_md', size: 54 }, { key: 'ui_coin_sm', size: 20 },
        ]);
        trimToHeight(textures, 'ui_exp_raw', 'ui_exp_md', 44);
        trimAndDownscaleCoin(textures, 'ui_lvl_raw', [{ key: 'ui_lvl_md', size: 60 }]);
        trimAndDownscaleCoin(textures, 'ui_settings_raw', [{ key: 'ui_settings_md', size: 56 }]);
        trimAndDownscaleCoin(textures, 'ui_daily_raw', [{ key: 'ui_daily_md', size: 90 }]);
        trimToWidth(textures, 'ui_daily_raw', 'ui_daily_btn', 130);
        trimToWidth(textures, 'ui_rating_3', 'ui_rating_mid', 99);
        trimToWidth(textures, 'ui_nests_raw', 'ui_nests_btn', 220);
        trimToWidth(textures, 'ui_nest_raw', 'ui_nest_mid', 280);
        trimAndDownscaleCoin(textures, 'ui_shock_raw', [{ key: 'ui_shock_sm', size: 36 }]);
        trimToWidth(textures, 'ui_rebirth_raw', 'ui_rebirth_md', 120);
        trimToWidth(textures, 'ui_dialog_right_raw', 'ui_dialog_right', 160);
        trimToWidth(textures, 'ui_dialog_left_raw', 'ui_dialog_left', 160);
        trimToHeight(textures, 'ui_arrow_l_raw', 'ui_arrow_l', 56);
        trimToHeight(textures, 'ui_arrow_r_raw', 'ui_arrow_r', 56);
        trimToHeight(textures, 'ui_star_active_raw', 'ui_star_active', 28);
        trimToHeight(textures, 'ui_star_inactive_raw', 'ui_star_inactive', 28);
        trimAndDownscaleCoin(textures, 'ui_lock_raw', [{ key: 'ui_lock_md', size: 56 }]);
        trimAndDownscaleCoin(textures, 'ui_ad_play', [{ key: 'ui_ad_sm', size: 36 }]);
    }

    private createProgressBar(cx: number, cy: number): void {
        const BAR_W = 300;
        const BAR_H = 22;
        const BAR_R = BAR_H / 2;
        const barY = cy + 82;
        const barX = cx - BAR_W / 2;
        const barGfx = this.add.graphics();

        const pctText = this.add.text(cx, barY, '0%', {
            fontFamily: 'Rubik', fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(1);

        const drawBar = (value: number) => {
            barGfx.clear();
            barGfx.fillStyle(0x222244, 0.6);
            barGfx.fillRoundedRect(barX, barY - BAR_H / 2, BAR_W, BAR_H, BAR_R);
            barGfx.lineStyle(1.5, 0x000000, 0.9);
            barGfx.strokeRoundedRect(barX - 4, barY - BAR_H / 2 - 4, BAR_W + 8, BAR_H + 8, BAR_R + 3);
            barGfx.lineStyle(2.5, 0xFEBF07, 1);
            barGfx.strokeRoundedRect(barX - 2, barY - BAR_H / 2 - 2, BAR_W + 4, BAR_H + 4, BAR_R + 2);
            barGfx.lineStyle(1.5, 0x000000, 0.9);
            barGfx.strokeRoundedRect(barX, barY - BAR_H / 2, BAR_W, BAR_H, BAR_R);
            const fillW = Math.max(0, value * BAR_W);
            if (fillW > 2) {
                const fw = Math.min(fillW, BAR_W - 2);
                const fr = fw >= BAR_H ? BAR_R - 1 : 0;
                barGfx.fillStyle(0x3cb8e8, 1);
                barGfx.fillRoundedRect(barX + 1, barY - BAR_H / 2 + 1, fw, BAR_H - 2, fr);
                if (fw > 4) {
                    const hr = fw >= BAR_H ? { tl: BAR_R - 2, tr: BAR_R - 2, bl: 0, br: 0 } : 0;
                    barGfx.fillStyle(0xffffff, 0.2);
                    barGfx.fillRoundedRect(barX + 2, barY - BAR_H / 2 + 2, fw - 2, (BAR_H - 4) * 0.4, hr);
                }
            }
            pctText.setText(`${Math.round(value * 100)}%`);
        };

        drawBar(0);
        this.load.on('progress', (value: number) => { drawBar(value); });
    }
}
