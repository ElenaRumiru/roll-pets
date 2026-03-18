import { Game, Scene } from 'phaser';
import { getPhase2Assets, PROCESSED_LUCK } from './AssetRegistry';
import {
    downscalePet, createEggSmall, processCollectionIcon,
    trimAndDownscaleCoin,
} from './PostProcess';

const BATCH_DELAY = 100; // ms pause between batches to avoid frame drops
const PET_BATCH_SIZE = 30;

export class DeferredLoader {
    private processed = new Set<string>();
    private loading = new Set<string>();
    private pendingCallbacks = new Map<string, Array<() => void>>();
    private activeScene: Scene | null = null;
    private paused = false;

    constructor(private game: Game) {}

    /** Pause background loading (call during roll animation) */
    pause(): void { this.paused = true; }

    /** Resume background loading */
    resume(): void { this.paused = false; }

    /** Set the active scene (call from each scene's create) */
    setScene(scene: Scene): void {
        this.activeScene = scene;
    }

    /** Check if a texture is loaded and post-processed */
    isReady(key: string): boolean {
        return this.game.textures.exists(key) && !this.loading.has(key);
    }

    /** Load a single pet sprite on-demand, returns Promise */
    ensurePet(imageKey: string): Promise<void> {
        if (this.isReady(imageKey)) return Promise.resolve();

        return new Promise(resolve => {
            if (this.loading.has(imageKey)) {
                const cbs = this.pendingCallbacks.get(imageKey) ?? [];
                cbs.push(resolve);
                this.pendingCallbacks.set(imageKey, cbs);
                return;
            }

            this.loading.add(imageKey);
            const scene = this.getScene();
            const filename = imageKey.replace('pet_', '');
            scene.load.image(imageKey, `assets/pets/${filename}.webp`);
            scene.load.once(`filecomplete-image-${imageKey}`, () => {
                downscalePet(this.game.textures, imageKey);
                this.loading.delete(imageKey);
                this.processed.add(imageKey);
                resolve();
                this.flushCallbacks(imageKey);
            });
            scene.load.start();
        });
    }

    /** Start Phase 2 background loading */
    startBackground(playerLevel: number): void {
        const phase1Keys = new Set<string>();
        for (const key of this.game.textures.getTextureKeys()) {
            phase1Keys.add(key);
        }

        const p2 = getPhase2Assets(playerLevel, phase1Keys);

        const petBatches = this.splitPetBatches(p2.pets);
        // Load first pet batch, then collection icons early (needed for CollectionScene),
        // then remaining pets and other assets
        this.chainBatches([
            ...(petBatches.length > 0 ? [petBatches[0]] : []),
            { type: 'collectionIcons', assets: p2.collectionIcons },
            { type: 'eggs', assets: p2.eggs },
            ...petBatches.slice(1),
            { type: 'audio', assets: p2.gradeSfx },
            { type: 'backgrounds', assets: p2.backgrounds },
            { type: 'luckIcons', assets: p2.luckIcons },
        ]);
    }

    private splitPetBatches(pets: { key: string; path: string }[]): Batch[] {
        const batches: Batch[] = [];
        for (let i = 0; i < pets.length; i += PET_BATCH_SIZE) {
            batches.push({ type: 'pets', assets: pets.slice(i, i + PET_BATCH_SIZE) });
        }
        return batches;
    }

    private async chainBatches(batches: Batch[]): Promise<void> {
        for (const batch of batches) {
            if (batch.assets.length === 0) continue;
            // Wait while paused (roll animation in progress)
            while (this.paused) await this.delay(100);
            await this.loadBatch(batch);
            await this.delay(BATCH_DELAY);
        }
    }

    private loadBatch(batch: Batch): Promise<void> {
        return new Promise(resolve => {
            const scene = this.getScene();
            const textures = this.game.textures;
            let queued = 0;

            for (const a of batch.assets) {
                if (textures.exists(a.key) || this.loading.has(a.key)) continue;
                this.loading.add(a.key);
                if (batch.type === 'audio') {
                    scene.load.audio(a.key, a.path);
                } else {
                    scene.load.image(a.key, a.path);
                    // Per-file post-processing — runs immediately when each file is ready
                    this.registerFileProcessor(scene, batch.type, a.key);
                }
                queued++;
            }

            if (queued === 0) {
                resolve();
                return;
            }

            scene.load.once('complete', () => resolve());
            scene.load.start();
        });
    }

    /** Register per-file post-processing for a single asset */
    private registerFileProcessor(scene: Scene, type: string, key: string): void {
        const textures = this.game.textures;
        scene.load.once(`filecomplete-image-${key}`, () => {
            this.loading.delete(key);
            this.processed.add(key);

            switch (type) {
                case 'pets':
                    downscalePet(textures, key);
                    this.flushCallbacks(key);
                    break;
                case 'eggs': {
                    const tier = parseInt(key.replace('egg_', ''));
                    createEggSmall(textures, tier);
                    break;
                }
                case 'luckIcons': {
                    if (textures.exists(`${key}_lg`)) break;
                    const suffix = key.replace('luck_', '');
                    if (PROCESSED_LUCK.includes(suffix)) {
                        trimAndDownscaleCoin(textures, key, [
                            { key: `${key}_lg`, size: 54 },
                            { key: `${key}_md`, size: 28 },
                            { key: `${key}_sm`, size: 16 },
                        ]);
                    }
                    break;
                }
                case 'collectionIcons': {
                    const name = key.replace('col_', '').replace('_raw', '');
                    processCollectionIcon(textures, name);
                    break;
                }
            }
        });
    }

    private getScene(): Scene {
        // Prefer first currently active scene (survives scene transitions)
        const scenes = this.game.scene.getScenes(true);
        if (scenes.length > 0) return scenes[0];
        // Fallback to stored reference (set during create())
        return this.activeScene!;
    }

    private flushCallbacks(key: string): void {
        const cbs = this.pendingCallbacks.get(key);
        if (cbs) {
            this.pendingCallbacks.delete(key);
            for (const cb of cbs) cb();
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(r => setTimeout(r, ms));
    }
}

interface Batch {
    type: 'pets' | 'audio' | 'eggs' | 'backgrounds' | 'luckIcons' | 'collectionIcons';
    assets: { key: string; path: string }[];
}
