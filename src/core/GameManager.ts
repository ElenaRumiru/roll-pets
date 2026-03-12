import { EventBus } from './EventBus';
import { AUTOROLL_TOGGLE, INTERSTITIAL_CONFIG, getDefaultDailyBonusState, getDefaultNestState, REBIRTH_CONFIG } from './config';
import { RNGSystem } from '../systems/RNGSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { BuffSystem } from '../systems/BuffSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { ShopSystem } from '../systems/ShopSystem';
import { LeaderboardSystem } from '../systems/LeaderboardSystem';
import { DailyBonusSystem } from '../systems/DailyBonusSystem';
import { NestSystem } from '../systems/NestSystem';
import { CollectionTracker } from '../systems/CollectionTracker';
import { getEggImageKey } from '../data/eggs';
import { getBgImageKey, getPortraitBgImageKey } from '../data/backgrounds';
import { RollResult, RebirthData, DailyBonusReward } from '../types';
import { RollCoordinator } from './RollCoordinator';
import { EconomyCoordinator } from './EconomyCoordinator';

export class GameManager {
    rng: RNGSystem;
    progression: ProgressionSystem;
    save: SaveSystem;
    buffs: BuffSystem;
    quests: QuestSystem;
    shop: ShopSystem;
    leaderboard: LeaderboardSystem;
    dailyBonus: DailyBonusSystem;
    nests: NestSystem;
    collectionTracker: CollectionTracker;
    private rollCoord: RollCoordinator;
    private econCoord: EconomyCoordinator;
    private questResetTimer = 0;
    private onlineTimeAccum = 0;

    constructor() {
        this.save = new SaveSystem();
        const data = this.save.getData();

        this.rng = new RNGSystem();
        this.progression = new ProgressionSystem(data.level, data.xp, data.coins, data.collection);
        this.buffs = new BuffSystem();
        this.buffs.loadFromSave(data.buffs);
        this.buffs.startOfferCooldown();
        this.quests = new QuestSystem();
        this.quests.loadFromSave(data.quests);
        this.shop = new ShopSystem();
        this.leaderboard = new LeaderboardSystem();
        const shopState = data.shop ?? { lastRefreshDate: '', offers: [] };
        this.shop.loadFromSave(shopState);
        if (this.shop.getOffers().length === 0) {
            this.shop.generateOffers(this.progression.collection);
        }
        this.shop.checkDailyReset(this.progression.collection);

        this.dailyBonus = new DailyBonusSystem();
        const dailyBonusState = data.dailyBonus ?? getDefaultDailyBonusState();
        this.dailyBonus.loadFromSave(dailyBonusState);

        this.nests = new NestSystem();
        this.nests.loadFromSave(data.nests ?? getDefaultNestState());

        this.collectionTracker = new CollectionTracker();
        this.collectionTracker.loadFromSave(data.collectionsClaimed ?? {}, data.collectionsSeenPets ?? {});

        this.buffs.setRebirthMultiplier(1 + data.rebirthCount);

        const deps = {
            rng: this.rng, getProgression: () => this.progression,
            buffs: this.buffs, save: this.save, quests: this.quests,
            nests: this.nests, collectionTracker: this.collectionTracker,
        };
        this.rollCoord = new RollCoordinator({
            ...deps,
            persistSave: (r?: RollResult) => this.persistSave(r),
            onRebirthReset: () => this.resetProgressionForRebirth(),
        });
        this.econCoord = new EconomyCoordinator({
            ...deps, shop: this.shop, dailyBonus: this.dailyBonus,
            persistSave: () => this.persistSave(),
        });

        if (data.level >= REBIRTH_CONFIG.triggerLevel && data.rebirthCount < REBIRTH_CONFIG.maxCount) {
            const oldCount = data.rebirthCount;
            this.rollCoord.performRebirth();
            this.rollCoord.pendingRebirthData = { rebirthCount: oldCount, newMultiplier: oldCount + 2 };
        }

        this.setupListeners();
    }

    private resetProgressionForRebirth(): void {
        this.progression = new ProgressionSystem(1, 0, this.progression.coins, this.progression.getCollectionArray());
    }

    private setupListeners(): void {
        EventBus.on('roll-requested', () => this.rollCoord.roll());
        EventBus.on('buff-requested', (buff: string) => this.econCoord.activateBuff(buff));
        EventBus.on('autoroll-stop', () => this.stopAutoroll());
        EventBus.on('autoroll-start', () => this.startAutoroll());
        EventBus.on('autoroll-toggle', (enabled: boolean) => this.setAutorollToggle(enabled));
    }

    stopAutoroll(): void { this.buffs.stopAutoroll(); EventBus.emit('buffs-changed'); this.persistSave(); }
    startAutoroll(): void { this.buffs.startAutoroll(); EventBus.emit('buffs-changed'); this.persistSave(); }
    setAutorollToggle(enabled: boolean): void {
        if (this.progression.level < AUTOROLL_TOGGLE.unlockLevel) return;
        this.buffs.setAutorollEnabled(enabled); EventBus.emit('buffs-changed'); this.persistSave();
    }

    roll(): void { this.rollCoord.roll(); }
    finishRoll(): void { this.rollCoord.finishRoll(); }
    claimLevelUpCoins(amount: number): void { this.rollCoord.claimLevelUpCoins(amount); }
    claimLeaguePromoCoins(amount: number): void { this.rollCoord.claimLeaguePromoCoins(amount); }
    hatchNest(slotIndex: number): RollResult | null { return this.rollCoord.hatchNest(slotIndex); }
    consumeInterstitialFlag(): boolean { return this.rollCoord.consumeInterstitialFlag(); }

    get isRolling(): boolean { return this.rollCoord.isRolling; }
    set isRolling(v: boolean) { this.rollCoord.isRolling = v; }
    get lastRollCoinGain(): number { return this.rollCoord.lastRollCoinGain; }
    get pendingRebirthData(): RebirthData | null { return this.rollCoord.pendingRebirthData; }
    set pendingRebirthData(v: RebirthData | null) { this.rollCoord.pendingRebirthData = v; }

    purchasePet(petId: string): boolean { return this.econCoord.purchasePet(petId); }
    purchaseEgg(tier: number, price: number): boolean { return this.econCoord.purchaseEgg(tier, price); }
    refreshShop(): void { this.econCoord.refreshShop(); }
    addEggs(tier: number, count: number): void { this.econCoord.addEggs(tier, count); }
    claimDailyBonus(): DailyBonusReward | null { return this.econCoord.claimDailyBonus(); }
    claimDailyMilestone(index: number): number { return this.econCoord.claimDailyMilestone(index); }
    claimCollection(collId: string): boolean { return this.econCoord.claimCollection(collId); }
    claimQuestReward(q: 'roll' | 'grade' | 'online', useAd: boolean): void { this.econCoord.claimQuestReward(q, useAd); }
    claimQuestMilestone(index: number): number { return this.econCoord.claimQuestMilestone(index); }
    claimThoughtBuff(): void { this.econCoord.claimThoughtBuff(); }
    unlockNestSlot(index: number): boolean { return this.econCoord.unlockNestSlot(index); }
    placeNestEgg(slotIndex: number, tier: number): boolean { return this.econCoord.placeNestEgg(slotIndex, tier); }
    boostNestSlot(index: number): boolean { return this.econCoord.boostNestSlot(index); }

    getRebirthCount(): number { return this.save.getData().rebirthCount; }
    getRebirthMultiplier(): number { return this.buffs.getRebirthMultiplier(); }
    getEggImageKey() { return getEggImageKey(this.progression.level); }
    getBgImageKey() { return getBgImageKey(this.progression.level); }
    getPortraitBgImageKey() { return getPortraitBgImageKey(this.progression.level); }
    getEggInventory(): Record<string, number> { return this.save.getData().eggInventory; }
    saveState(): void { this.persistSave(); }

    // --- Update loop ---
    update(deltaMs: number): void {
        const dt = Math.min(deltaMs, 200);
        this.buffs.update(dt);

        this.onlineTimeAccum += dt;
        if (this.onlineTimeAccum >= 1000) {
            const secs = Math.floor(this.onlineTimeAccum / 1000);
            this.onlineTimeAccum -= secs * 1000;
            if (this.quests.updateOnlineTime(secs)) {
                EventBus.emit('quests-changed');
            }
        }

        this.questResetTimer += dt;
        if (this.questResetTimer >= 60_000) {
            this.questResetTimer = 0;
            const questReset = this.quests.checkDailyReset();
            const shopReset = this.shop.checkDailyReset(this.progression.collection);
            const dailyBonusReset = this.dailyBonus.checkNewDay();
            if (questReset || shopReset || dailyBonusReset) {
                if (questReset) EventBus.emit('quests-changed');
                if (dailyBonusReset) EventBus.emit('daily-bonus-changed');
                this.persistSave();
            }
        }
    }

    private persistSave(result?: RollResult): void {
        this.save.update(data => {
            data.level = this.progression.level;
            data.xp = this.progression.xp;
            data.coins = this.progression.coins;
            data.collection = this.progression.getCollectionArray();
            data.buffs = this.buffs.toSave();
            data.quests = this.quests.toSave();
            data.shop = this.shop.toSave();
            data.dailyBonus = this.dailyBonus.toSave();
            data.nests = this.nests.toSave();
            data.collectionsClaimed = this.collectionTracker.toSaveClaimed();
            data.collectionsSeenPets = this.collectionTracker.toSaveSeenPets();

            if (result) {
                data.totalRolls++;
                if (data.totalRolls > 0 && data.totalRolls % INTERSTITIAL_CONFIG.everyNRolls === 0) {
                    this.rollCoord.pendingInterstitial = true;
                }
                data.rollLog.unshift({
                    id: result.pet.id, grade: result.grade, isNew: result.isNew, xp: result.xpGained,
                });
                if (data.rollLog.length > 20) data.rollLog.length = 20;
            }
        });
    }
}
