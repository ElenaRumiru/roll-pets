import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, AUTOROLL_INTERVAL, xpForLevel } from '../core/config';
import { EventBus } from '../core/EventBus';
import { GameManager } from '../core/GameManager';
import { TopBar } from '../ui/TopBar';
import { CenterStage } from '../ui/CenterStage';
import { RightPanel } from '../ui/RightPanel';
import { CollectionButton } from '../ui/CollectionButton';
import { SettingsButton } from '../ui/SettingsButton';
import { SettingsPanel } from '../ui/SettingsPanel';
import { showFloatingText } from '../ui/components/FloatingText';
import { PETS } from '../data/pets';
import { PetDef, Rarity, RollResult } from '../types';
import { AudioSystem } from '../systems/AudioSystem';
import { t } from '../data/locales';

export class MainScene extends Scene {
    private manager!: GameManager;
    private topBar!: TopBar;
    private centerStage!: CenterStage;
    private rightPanel!: RightPanel;
    private collectionBtn!: CollectionButton;
    private settingsPanel!: SettingsPanel;
    private audio!: AudioSystem;
    private autorollTimer = 0;

    constructor() {
        super('MainScene');
    }

    create(): void {
        this.manager = new GameManager();

        // Background image
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_meadow')
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
            .setDepth(-1);

        // UI components
        this.topBar = new TopBar(this);
        this.centerStage = new CenterStage(this);
        this.rightPanel = new RightPanel(
            this,
            () => EventBus.emit('roll-requested'),
            (type: string) => EventBus.emit('buff-requested', type),
        );
        this.collectionBtn = new CollectionButton(this, () => this.scene.start('CollectionScene'));

        // Audio
        const settings = this.manager.save.getData().settings;
        this.audio = new AudioSystem(this, settings.music, settings.volume);
        this.audio.startBGM();

        // Settings panel + button
        this.settingsPanel = new SettingsPanel(this, this.audio, this.manager.save);
        new SettingsButton(this, () => this.settingsPanel.show());

        // Set initial egg tier
        this.centerStage.setEggTier(this.manager.getEggTier());

        // Listen for events
        EventBus.on('roll-complete', this.onRollComplete, this);
        EventBus.on('level-up', this.onLevelUp, this);
        EventBus.on('buff-activated', this.onBuffActivated, this);

        // Keyboard
        this.input.keyboard?.on('keydown-SPACE', () => {
            EventBus.emit('roll-requested');
        });

        // Initial UI update
        this.refreshUI();
    }

    update(_time: number, delta: number): void {
        this.manager.update(delta);

        // Autoroll
        if (this.manager.buffs.isActive('autoroll') && !this.manager.isRolling) {
            this.autorollTimer += delta;
            if (this.autorollTimer >= AUTOROLL_INTERVAL) {
                this.autorollTimer = 0;
                EventBus.emit('roll-requested');
            }
        } else {
            this.autorollTimer = 0;
        }

        // Update buff timers display
        this.rightPanel.updateBuffTimers(
            this.manager.buffs.getRemaining('x2xp'),
            this.manager.buffs.getRemaining('autoroll'),
            this.manager.buffs.getRemaining('luck'),
        );
    }

    private onRollComplete(result: RollResult): void {
        this.rightPanel.setRolling(true);
        this.centerStage.playHatch(result, () => {
            this.rightPanel.setRolling(false);
            this.refreshUI();
        });
    }

    private onLevelUp(data: { level: number }): void {
        showFloatingText(
            this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100,
            `${t('level_up')} ${data.level}`, '#ffc107', 24,
        );
        this.centerStage.setEggTier(this.manager.getEggTier());
    }

    private onBuffActivated(_buff: string): void {
        this.refreshUI();
    }

    private getTopPets(): PetDef[] {
        const rarityValue: Record<Rarity, number> = {
            legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1,
        };
        return PETS
            .filter(p => this.manager.progression.collection.has(p.id))
            .sort((a, b) => rarityValue[b.rarity] - rarityValue[a.rarity])
            .slice(0, 3);
    }

    private refreshUI(): void {
        const p = this.manager.progression;
        const needed = xpForLevel(p.level);
        this.topBar.updateDisplay(p.level, p.getXpProgress(), p.xp, needed);
        this.collectionBtn.updateCount(p.collection.size, p.collection);

        // Update pedestals with top pets by rarity
        const topPets = this.getTopPets();
        this.centerStage.updatePedestals(
            topPets,
            p.level,
            this.manager.buffs.isActive('luck'),
        );
    }

    shutdown(): void {
        EventBus.off('roll-complete', this.onRollComplete, this);
        EventBus.off('level-up', this.onLevelUp, this);
        EventBus.off('buff-activated', this.onBuffActivated, this);
    }
}
