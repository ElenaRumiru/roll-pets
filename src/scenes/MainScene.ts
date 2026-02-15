import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, AUTOROLL_INTERVAL, xpForLevel, UI } from '../core/config';
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
    private pulseTimer = 0;
    private isPaused = false;
    private wasAutorollActive = false;
    private pauseOverlay!: Phaser.GameObjects.Container;

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
            (type: string) => this.handleBuffRequest(type),
            () => EventBus.emit('autoroll-stop'),
            () => EventBus.emit('autoroll-resume'),
        );
        this.collectionBtn = new CollectionButton(this, () => this.scene.start('CollectionScene'));

        // Audio
        const settings = this.manager.save.getData().settings;
        this.audio = new AudioSystem(this, settings.music, settings.volume, settings.sfx, settings.sfxVolume);
        this.audio.startBGM();
        this.centerStage.setAudio(this.audio);

        // Settings panel + button
        this.settingsPanel = new SettingsPanel(this, this.audio, this.manager.save);
        new SettingsButton(this, () => this.settingsPanel.show());

        // Set initial egg tier
        this.centerStage.setEggTier(this.manager.getEggTier());

        // Listen for events
        EventBus.on('roll-requested', this.onRollRequested, this);
        EventBus.on('roll-complete', this.onRollComplete, this);
        EventBus.on('level-up', this.onLevelUp, this);
        EventBus.on('buff-activated', this.onBuffActivated, this);
        EventBus.on('buffs-changed', this.onBuffsChanged, this);
        EventBus.on('autoroll-stop', this.onAutorollStop, this);

        // Pause overlay
        this.pauseOverlay = this.createPauseOverlay();

        // Keyboard
        this.input.keyboard?.on('keydown-SPACE', () => {
            if (this.isPaused) return;
            if (this.manager.buffs.isAutorollActive()) {
                EventBus.emit('autoroll-stop');
            } else if (this.manager.buffs.isAutorollPaused()) {
                EventBus.emit('autoroll-resume');
            } else {
                EventBus.emit('roll-requested');
            }
        });
        this.input.keyboard?.on('keydown-ESC', () => this.togglePause());

        // Restore autoroll overlay if saved
        if (this.manager.buffs.isAutorollActive()) {
            this.wasAutorollActive = true;
            this.centerStage.setAutorollOverlay(true);
            this.rightPanel.setDepth(105);
            this.topBar.setDepth(105);
        }

        // Initial UI update
        this.refreshUI();
    }

    update(_time: number, delta: number): void {
        if (this.isPaused) return;
        this.manager.update(delta);

        // Autoroll
        if (this.manager.buffs.isAutorollActive() && !this.manager.isRolling) {
            this.autorollTimer += delta;
            if (this.autorollTimer >= AUTOROLL_INTERVAL) {
                this.autorollTimer = 0;
                EventBus.emit('roll-requested');
            }
        } else if (!this.manager.buffs.isAutorollActive()) {
            this.autorollTimer = 0;
        }

        // Track autoroll overlay state
        const autoActive = this.manager.buffs.isAutorollActive();
        if (autoActive && !this.wasAutorollActive) {
            this.centerStage.setAutorollOverlay(true);
            this.rightPanel.setDepth(105);
            this.topBar.setDepth(105);
        } else if (!autoActive && this.wasAutorollActive) {
            this.centerStage.setAutorollOverlay(false);
            this.rightPanel.setDepth(0);
            this.topBar.setDepth(0);
        }
        this.wasAutorollActive = autoActive;

        // Update buff display
        this.rightPanel.updateBuffDisplay(this.manager.buffs);

        // Roll button pulse every 5s (skip during autoroll)
        if (!autoActive) {
            this.pulseTimer += delta;
            if (this.pulseTimer >= 5_000) {
                this.pulseTimer = 0;
                this.rightPanel.pulseRollButton();
            }
        }
    }

    private handleBuffRequest(type: string): void {
        // Epic is free (timer-based), grant directly
        if (type === 'epic') {
            EventBus.emit('buff-requested', type);
            return;
        }
        // Lucky, Super, Autoroll require ads
        if (type === 'lucky' || type === 'super' || type === 'autoroll') {
            const sdk = this.registry.get('platformSDK');
            if (sdk) {
                sdk.showRewardedBreak().then((success: boolean) => {
                    if (success) EventBus.emit('buff-requested', type);
                });
            } else {
                // Dev mode: grant immediately
                EventBus.emit('buff-requested', type);
            }
        }
    }

    private onRollRequested(): void {
        this.audio.playSfx('sfx_click');
    }

    private onRollComplete(result: RollResult): void {
        this.rightPanel.setRolling(true);
        this.centerStage.playHatch(result, () => {
            this.manager.finishRoll();
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

    private onBuffsChanged(): void {
        this.refreshUI();
    }

    private onAutorollStop(): void {
        this.centerStage.setAutorollOverlay(false);
        this.wasAutorollActive = false;
        this.rightPanel.setDepth(0);
        this.topBar.setDepth(0);
        // Sync autorollActive flag BEFORE setRolling so button shows "ROLL!" not "STOP"
        this.rightPanel.updateBuffDisplay(this.manager.buffs);
        this.rightPanel.setRolling(this.manager.isRolling);
    }

    private createPauseOverlay(): Phaser.GameObjects.Container {
        const container = this.add.container(0, 0);
        container.setDepth(1001);

        const bg = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7,
        );
        bg.setInteractive();
        container.add(bg);

        const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, t('paused'), {
            fontFamily: UI.FONT_MAIN, fontSize: '48px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        container.add(title);

        const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, t('press_esc'), {
            fontFamily: UI.FONT_BODY, fontSize: '16px', color: '#aaaaaa',
        }).setOrigin(0.5);
        container.add(hint);

        container.setVisible(false);
        return container;
    }

    private togglePause(): void {
        if (this.settingsPanel.isVisible) return;
        this.isPaused = !this.isPaused;
        this.pauseOverlay.setVisible(this.isPaused);
        if (this.isPaused) this.audio.pauseAll();
        else this.audio.resumeAll();
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

        const topPets = this.getTopPets();
        this.centerStage.updatePedestals(topPets);
    }

    shutdown(): void {
        EventBus.off('roll-requested', this.onRollRequested, this);
        EventBus.off('roll-complete', this.onRollComplete, this);
        EventBus.off('level-up', this.onLevelUp, this);
        EventBus.off('buff-activated', this.onBuffActivated, this);
        EventBus.off('buffs-changed', this.onBuffsChanged, this);
        EventBus.off('autoroll-stop', this.onAutorollStop, this);
    }
}
