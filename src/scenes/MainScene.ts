import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, AUTOROLL_INTERVAL, xpForLevel, UI, ONBOARDING, LEVELUP_CONFIG, NEST_CONFIG } from '../core/config';
import { EventBus } from '../core/EventBus';
import { GameManager } from '../core/GameManager';
import { TopBar } from '../ui/TopBar';
import { CenterStage } from '../ui/CenterStage';
import { LevelUpOverlay } from '../ui/LevelUpOverlay';
import { LeaguePromotionOverlay } from '../ui/LeaguePromotionOverlay';
import { RightPanel } from '../ui/RightPanel';
import { CollectionButton } from '../ui/CollectionButton';
import { ShopButton } from '../ui/ShopButton';
import { NestsButton } from '../ui/NestsButton';
import { DailyBonusButton } from '../ui/DailyBonusButton';
import { SettingsButton } from '../ui/SettingsButton';
import { CoinDisplay } from '../ui/CoinDisplay';
import { SettingsPanel } from '../ui/SettingsPanel';
import { BonusPanel } from '../ui/BonusPanel';
import { QuestPanel } from '../ui/QuestPanel';
import { QuestClaimPopup } from '../ui/QuestClaimPopup';
import { Leaderboard } from '../ui/Leaderboard';
import { NicknamePrompt } from '../ui/NicknamePrompt';
import { ArrowHint } from '../ui/ArrowHint';
import { PETS } from '../data/pets';
import { PetDef, RollResult, LevelUpData, LeaguePromotionData } from '../types';
import { PlatformSDK } from '../platform/PlatformSDK';
import { AudioSystem } from '../systems/AudioSystem';
import { t } from '../data/locales';

export class MainScene extends Scene {
    private manager!: GameManager;
    private topBar!: TopBar;
    private centerStage!: CenterStage;
    private rightPanel!: RightPanel;
    private collectionBtn!: CollectionButton;
    private nestsBtn!: NestsButton;
    private shopBtn!: ShopButton;
    private dailyBonusBtn!: DailyBonusButton;
    private settingsPanel!: SettingsPanel;
    private bonusPanel!: BonusPanel;
    private questPanel!: QuestPanel;
    private questPopup: QuestClaimPopup | null = null;
    private leaderboard!: Leaderboard;
    private coinDisplay!: CoinDisplay;
    private audio!: AudioSystem;
    private bgImage!: Phaser.GameObjects.Image;
    private autorollTimer = 0;
    private isPaused = false;
    private wasAutorollActive = false;
    private pauseOverlay!: Phaser.GameObjects.Container;
    private arrowHint: ArrowHint | null = null;
    private idleTimer = 0;
    private levelUpOverlay!: LevelUpOverlay;
    private leaguePromoOverlay!: LeaguePromotionOverlay;
    private pendingLevelUp: LevelUpData | null = null;
    private pendingLeaguePromo: LeaguePromotionData | null = null;

    constructor() {
        super('MainScene');
    }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.buildUI();

        // Show nickname prompt if needed (non-blocking, overlay on top of game)
        const nickname = this.manager.save.getNickname();
        if (!nickname) {
            new NicknamePrompt((name: string) => {
                this.manager.save.setNickname(name);
                this.updateLeaderboard();
                if (this.manager.save.getData().totalRolls === 0) this.showArrowHint();
            }, this.input);
        } else if (this.manager.save.getData().totalRolls === 0) {
            this.showArrowHint();
        }
    }

    private buildUI(): void {
        // Background image
        this.bgImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.manager.getBgImageKey())
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
            .setDepth(-1);

        // UI components
        this.topBar = new TopBar(this, () => {
            this.manager.buffs.stopAutoroll();
            this.manager.isRolling = false;
            this.manager.saveState();
            this.scene.start('ProgressionScene');
        });
        this.leaderboard = new Leaderboard(this, () => {
            this.manager.buffs.stopAutoroll();
            this.manager.isRolling = false;
            this.manager.saveState();
            this.scene.start('LeaderboardScene');
        });
        this.centerStage = new CenterStage(this);
        this.levelUpOverlay = new LevelUpOverlay(this, this.centerStage.getOverlay());
        this.leaguePromoOverlay = new LeaguePromotionOverlay(this);

        this.rightPanel = new RightPanel(
            this,
            () => EventBus.emit('roll-requested'),
            () => EventBus.emit('autoroll-stop'),
            () => EventBus.emit('autoroll-start'),
            (enabled: boolean) => this.handleAutorollToggle(enabled),
        );

        this.collectionBtn = new CollectionButton(this, () => {
            this.manager.buffs.stopAutoroll();
            this.manager.isRolling = false;
            this.manager.saveState();
            this.scene.start('CollectionScene');
        });

        const nestsLocked = this.manager.progression.level < NEST_CONFIG.unlockLevel;
        this.nestsBtn = new NestsButton(this, nestsLocked, () => {
            this.manager.buffs.stopAutoroll();
            this.manager.isRolling = false;
            this.manager.saveState();
            this.scene.start('NestsScene');
        });

        this.shopBtn = new ShopButton(this, () => {
            this.manager.buffs.stopAutoroll();
            this.manager.isRolling = false;
            this.manager.saveState();
            this.scene.start('ShopScene');
        });

        this.dailyBonusBtn = new DailyBonusButton(this, () => {
            this.manager.buffs.stopAutoroll();
            this.manager.isRolling = false;
            this.manager.saveState();
            this.scene.start('DailyBonusScene');
        });

        this.bonusPanel = new BonusPanel(this, (type: string) => this.handleBuffRequest(type));
        this.questPanel = new QuestPanel(this,
            (type: 'roll' | 'grade' | 'online') => this.handleQuestClaim(type),
            () => {
                this.manager.buffs.stopAutoroll();
                this.manager.isRolling = false;
                this.manager.saveState();
                this.scene.start('QuestScene');
            },
        );

        // Position quest panel + bonus panel aligned with leaderboard
        const COMBINED_GAP = 6;
        const leaderboardY = Math.round((GAME_HEIGHT - 175) / 2) - 22 - 25; // shifted 25px up for shop button
        this.questPanel.y = leaderboardY - 20;
        this.leaderboard.y = leaderboardY - 38;
        this.bonusPanel.y = this.questPanel.y + this.questPanel.panelHeight + COMBINED_GAP;

        // Audio (singleton from registry)
        this.audio = this.registry.get('audio') as AudioSystem;
        this.centerStage.setAudio(this.audio);

        // Coin HUD (left of settings button)
        this.coinDisplay = new CoinDisplay(this);

        // Settings panel + button
        this.settingsPanel = new SettingsPanel(this, this.audio, this.manager.save);
        new SettingsButton(this, () => this.settingsPanel.show());

        // Set initial egg image
        this.centerStage.setEggImage(this.manager.getEggImageKey());

        // Listen for events
        EventBus.on('roll-requested', this.onRollRequested, this);
        EventBus.on('roll-complete', this.onRollComplete, this);
        EventBus.on('level-up', this.onLevelUp, this);
        EventBus.on('league-promotion', this.onLeaguePromotion, this);
        EventBus.on('buff-activated', this.onBuffActivated, this);
        EventBus.on('buffs-changed', this.onBuffsChanged, this);
        EventBus.on('autoroll-stop', this.onAutorollStop, this);
        EventBus.on('nickname-changed', this.onNicknameChanged, this);
        EventBus.on('quests-changed', this.onQuestsChanged, this);
        EventBus.on('daily-bonus-changed', this.onDailyBonusChanged, this);
        this.events.on('shutdown', this.shutdown, this);

        // Pause overlay
        this.pauseOverlay = this.createPauseOverlay();

        // Idle tracking — reset timer on any input
        this.input.on('pointerdown', () => { this.idleTimer = 0; });
        this.input.keyboard?.on('keydown', () => { this.idleTimer = 0; });

        // Keyboard
        this.input.keyboard?.on('keydown-SPACE', () => {
            if (this.isPaused) return;
            if (this.manager.buffs.isAutorollActive()) {
                EventBus.emit('autoroll-stop');
            } else if (this.manager.buffs.isAutorollEnabled()) {
                EventBus.emit('autoroll-start');
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
            this.bonusPanel.setDepth(105);
            this.questPanel.setDepth(105);
            this.leaderboard.setDepth(105);
            this.collectionBtn.setDepth(105);
            this.nestsBtn.setDepth(105);
            this.shopBtn.setDepth(105);
            this.dailyBonusBtn.setDepth(105);
            this.coinDisplay.setDepth(105);
        }

        // Initial UI update
        this.refreshUI();

        // Re-open settings if language was just changed
        if (this.registry.get('openSettings')) {
            this.registry.remove('openSettings');
            this.settingsPanel.show();
        }
    }

    update(_time: number, delta: number): void {
        if (this.isPaused || !this.manager) return;
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
            this.bonusPanel.setDepth(105);
            this.questPanel.setDepth(105);
            this.leaderboard.setDepth(105);
            this.collectionBtn.setDepth(105);
            this.nestsBtn.setDepth(105);
            this.shopBtn.setDepth(105);
            this.dailyBonusBtn.setDepth(105);
            this.coinDisplay.setDepth(105);
        } else if (!autoActive && this.wasAutorollActive) {
            this.centerStage.setAutorollOverlay(false);
            this.rightPanel.setDepth(0);
            this.topBar.setDepth(0);
            this.bonusPanel.setDepth(0);
            this.questPanel.setDepth(0);
            this.leaderboard.setDepth(0);
            this.collectionBtn.setDepth(0);
            this.nestsBtn.setDepth(0);
            this.shopBtn.setDepth(0);
            this.dailyBonusBtn.setDepth(0);
            this.coinDisplay.setDepth(0);
        }
        this.wasAutorollActive = autoActive;

        // Update buff displays
        this.rightPanel.updateBuffDisplay(this.manager.buffs);
        this.bonusPanel.updateBuffDisplay(this.manager.buffs);

        // Idle arrow hint
        this.idleTimer += delta;
        if (this.idleTimer >= ONBOARDING.idleTimeout
            && !this.manager.isRolling
            && (!this.arrowHint || !this.arrowHint.visible)) {
            this.showArrowHint();
        }
    }

    private async handleAutorollToggle(enabled: boolean): Promise<void> {
        const sdk = this.registry.get('platformSDK') as PlatformSDK | undefined;
        if (sdk) {
            sdk.gameplayStop();
            try { await sdk.commercialBreak(); } catch { /* ad failed, still toggle */ }
            sdk.gameplayStart();
        }
        EventBus.emit('autoroll-toggle', enabled);
    }

    private handleBuffRequest(type: string): void {
        const sdk = this.registry.get('platformSDK') as PlatformSDK | undefined;
        if (sdk) {
            sdk.showRewardedBreak().then((success: boolean) => {
                if (success) EventBus.emit('buff-requested', type);
            });
        } else {
            EventBus.emit('buff-requested', type);
        }
    }

    private onRollRequested(): void {
        this.audio.playSfx('sfx_click');
        this.hideArrowHint();
        this.idleTimer = 0;
    }

    private onRollComplete(result: RollResult): void {
        this.rightPanel.setRolling(true);
        this.centerStage.playHatch(result, () => {
            this.coinDisplay.showFloatingGain(this.manager.lastRollCoinGain, this);
            if (this.pendingLevelUp) {
                const data = this.pendingLevelUp;
                this.pendingLevelUp = null;
                this.levelUpOverlay.show(data, (chosenCoinAmount: number) => {
                    if (chosenCoinAmount > 0) {
                        this.handleLevelUpCoinChoice(data, chosenCoinAmount);
                    } else {
                        this.finishLevelUp(data);
                    }
                });
            } else if (this.pendingLeaguePromo) {
                this.showLeaguePromo();
            } else {
                this.manager.finishRoll();
                this.rightPanel.setRolling(false);
                this.refreshUI();
            }
        });
    }

    private handleLevelUpCoinChoice(data: LevelUpData, chosenAmount: number): void {
        const baseAmount = data.coinReward;
        const adAmount = baseAmount * LEVELUP_CONFIG.adCoinMultiplier;

        if (chosenAmount === adAmount) {
            const sdk = this.registry.get('platformSDK') as PlatformSDK | undefined;
            if (sdk) {
                sdk.showRewardedBreak().then((success: boolean) => {
                    const finalAmount = success ? adAmount : baseAmount;
                    this.manager.claimLevelUpCoins(finalAmount);
                    this.coinDisplay.showFloatingGain(finalAmount, this);
                    this.finishLevelUp(data);
                });
            } else {
                this.manager.claimLevelUpCoins(adAmount);
                this.coinDisplay.showFloatingGain(adAmount, this);
                this.finishLevelUp(data);
            }
        } else {
            this.manager.claimLevelUpCoins(baseAmount);
            this.coinDisplay.showFloatingGain(baseAmount, this);
            this.finishLevelUp(data);
        }
    }

    private finishLevelUp(data: LevelUpData): void {
        this.centerStage.setEggImage(data.eggKey);
        this.bgImage.setTexture(data.bgKey);

        // Chain to league promotion if pending
        if (this.pendingLeaguePromo) {
            this.showLeaguePromo();
            return;
        }

        this.centerStage.setKeepOverlay(false);
        if (!this.manager.buffs.isAutorollActive()) {
            this.tweens.add({
                targets: this.centerStage.getOverlay(),
                fillAlpha: 0,
                duration: 250,
            });
        }
        this.manager.finishRoll();
        this.rightPanel.setRolling(false);
        this.refreshUI();
    }

    private onLevelUp(data: LevelUpData): void {
        this.pendingLevelUp = data;
        this.centerStage.setKeepOverlay(true);
    }

    private onLeaguePromotion(data: LeaguePromotionData): void {
        this.pendingLeaguePromo = data;
        this.centerStage.setKeepOverlay(true);
    }

    private showLeaguePromo(): void {
        const data = this.pendingLeaguePromo!;
        this.pendingLeaguePromo = null;
        this.leaguePromoOverlay.show(data, (chosenCoinAmount: number) => {
            this.handleLeaguePromoCoinChoice(data, chosenCoinAmount);
        });
    }

    private handleLeaguePromoCoinChoice(data: LeaguePromotionData, chosenAmount: number): void {
        const baseAmount = data.coinReward;
        const adAmount = baseAmount * LEVELUP_CONFIG.adCoinMultiplier;

        if (chosenAmount === adAmount) {
            const sdk = this.registry.get('platformSDK') as PlatformSDK | undefined;
            if (sdk) {
                sdk.showRewardedBreak().then((success: boolean) => {
                    const finalAmount = success ? adAmount : baseAmount;
                    this.manager.claimLeaguePromoCoins(finalAmount);
                    this.coinDisplay.showFloatingGain(finalAmount, this);
                    this.finishLeaguePromo();
                });
            } else {
                this.manager.claimLeaguePromoCoins(adAmount);
                this.coinDisplay.showFloatingGain(adAmount, this);
                this.finishLeaguePromo();
            }
        } else {
            this.manager.claimLeaguePromoCoins(baseAmount);
            this.coinDisplay.showFloatingGain(baseAmount, this);
            this.finishLeaguePromo();
        }
    }

    private finishLeaguePromo(): void {
        this.centerStage.setKeepOverlay(false);
        if (!this.manager.buffs.isAutorollActive()) {
            this.tweens.add({
                targets: this.centerStage.getOverlay(),
                fillAlpha: 0,
                duration: 250,
            });
        }
        this.manager.finishRoll();
        this.rightPanel.setRolling(false);
        this.refreshUI();
    }

    private onBuffActivated(_buff: string): void {
        this.refreshUI();
        this.bonusPanel.onOfferAccepted();
    }

    private onBuffsChanged(): void {
        if (!this.manager.isRolling) {
            this.refreshUI();
        }
    }

    private onNicknameChanged(_name: string): void {
        this.updateLeaderboard();
    }

    private onQuestsChanged(): void {
        this.questPanel.updateDisplay(this.manager.quests);
    }

    private onDailyBonusChanged(): void {
        this.dailyBonusBtn.updateBadge(this.manager.dailyBonus.hasUnclaimedReward());
    }

    private handleQuestClaim(type: 'roll' | 'grade' | 'online'): void {
        if (this.questPopup) return;
        this.questPopup = new QuestClaimPopup(this, type,
            () => {
                this.manager.claimQuestReward(type, false);
                this.questPopup = null;
            },
            () => {
                const sdk = this.registry.get('platformSDK') as PlatformSDK | undefined;
                if (sdk) {
                    sdk.showRewardedBreak().then((success: boolean) => {
                        this.manager.claimQuestReward(type, success);
                        this.questPopup = null;
                    });
                } else {
                    this.manager.claimQuestReward(type, true);
                    this.questPopup = null;
                }
            },
            () => { this.questPopup = null; },
        );
    }

    private onAutorollStop(): void {
        this.centerStage.setAutorollOverlay(false);
        this.wasAutorollActive = false;
        this.rightPanel.setDepth(0);
        this.topBar.setDepth(0);
        this.bonusPanel.setDepth(0);
        this.questPanel.setDepth(0);
        this.leaderboard.setDepth(0);
        this.collectionBtn.setDepth(0);
        this.nestsBtn.setDepth(0);
        this.shopBtn.setDepth(0);
        this.dailyBonusBtn.setDepth(0);
        this.coinDisplay.setDepth(0);
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

        const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25, t('paused'), {
            fontFamily: UI.FONT_STROKE, fontSize: '59px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        container.add(title);

        const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 37, t('press_esc'), {
            fontFamily: UI.FONT_BODY, fontSize: '20px', color: '#aaaaaa',
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
        return PETS
            .filter(p => this.manager.progression.collection.has(p.id))
            .sort((a, b) => b.chance - a.chance)
            .slice(0, 3);
    }

    private getPlayerBestChance(): number {
        const collected = PETS.filter(p => this.manager.progression.collection.has(p.id));
        if (collected.length === 0) return 2;
        return collected.reduce((a, b) => a.chance > b.chance ? a : b).chance;
    }

    private updateLeaderboard(): void {
        const nickname = this.manager.save.getNickname() || t('default_nickname');
        const bestChance = this.getPlayerBestChance();
        const { entries, playerRank, league } = this.manager.leaderboard.getEntries(nickname, bestChance);
        this.leaderboard.updateDisplay(entries, playerRank, league);
    }

    private refreshUI(): void {
        const p = this.manager.progression;
        const needed = xpForLevel(p.level);
        this.topBar.updateDisplay(p.level, p.getXpProgress(), p.xp, needed);
        this.coinDisplay.updateCoins(p.coins);
        this.collectionBtn.updateCount(this.manager.save.getNewPets().length);

        this.updateLeaderboard();

        const topPets = this.getTopPets();
        this.centerStage.updatePedestals(topPets);
        this.questPanel.updateDisplay(this.manager.quests);
        this.dailyBonusBtn.updateBadge(this.manager.dailyBonus.hasUnclaimedReward());
        this.nestsBtn.setLocked(this.manager.progression.level < NEST_CONFIG.unlockLevel);
        this.nestsBtn.updateBadge(this.manager.nests.getReadyCount(), this.manager.nests.hasEmptySlot());
    }

    private showArrowHint(): void {
        if (this.arrowHint?.visible) return;
        this.arrowHint = new ArrowHint(this);
    }

    private hideArrowHint(): void {
        if (!this.arrowHint?.visible) return;
        this.arrowHint.hide();
        this.arrowHint = null;
    }

    shutdown(): void {
        // Stop autoroll & reset rolling state before scene is destroyed
        this.manager.buffs.stopAutoroll();
        this.manager.isRolling = false;
        this.manager.saveState();

        EventBus.off('roll-requested', this.onRollRequested, this);
        EventBus.off('roll-complete', this.onRollComplete, this);
        EventBus.off('level-up', this.onLevelUp, this);
        EventBus.off('league-promotion', this.onLeaguePromotion, this);
        EventBus.off('buff-activated', this.onBuffActivated, this);
        EventBus.off('buffs-changed', this.onBuffsChanged, this);
        EventBus.off('autoroll-stop', this.onAutorollStop, this);
        EventBus.off('nickname-changed', this.onNicknameChanged, this);
        EventBus.off('quests-changed', this.onQuestsChanged, this);
        EventBus.off('daily-bonus-changed', this.onDailyBonusChanged, this);
    }
}
