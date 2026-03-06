import { EventBus } from './EventBus';
import { BUFF_CONFIG, levelUpCoinReward, LEAGUE_PROMOTION_REWARDS, NEST_CONFIG, getDefaultNestState, AUTOROLL_TOGGLE, REBIRTH_CONFIG, INTERSTITIAL_CONFIG, LEVELUP_CONFIG } from './config';
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
import { COLLECTIONS } from '../data/collections';
import { getEligiblePets, getEggImageKey } from '../data/eggs';
import { getEggTierConfig } from '../data/eggTiers';
import { getBgImageKey } from '../data/backgrounds';
import { getLeagueForChance } from '../data/leaderboard';
import { PETS } from '../data/pets';
import { RollResult, LevelUpData, LeaguePromotionData, RebirthData, DailyBonusReward } from '../types';
import { getDefaultDailyBonusState } from './config';

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
    isRolling = false;
    lastRollCoinGain = 0;
    pendingRebirthData: RebirthData | null = null;
    pendingInterstitial = false;
    private questResetTimer = 0;
    private onlineTimeAccum = 0;
    private pendingLevelUpReward = 0;
    private pendingLeaguePromoReward = 0;

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

        // Force rebirth if player reloaded at level >= triggerLevel
        if (data.level >= REBIRTH_CONFIG.triggerLevel && data.rebirthCount < REBIRTH_CONFIG.maxCount) {
            const oldCount = data.rebirthCount;
            this.performRebirth();
            this.pendingRebirthData = { rebirthCount: oldCount, newMultiplier: oldCount + 2 };
        }

        this.setupListeners();
    }

    private setupListeners(): void {
        EventBus.on('roll-requested', () => this.roll());
        EventBus.on('buff-requested', (buff: string) => this.activateBuff(buff));
        EventBus.on('autoroll-stop', () => this.stopAutoroll());
        EventBus.on('autoroll-start', () => this.startAutoroll());
        EventBus.on('autoroll-toggle', (enabled: boolean) => this.setAutorollToggle(enabled));
    }

    stopAutoroll(): void {
        this.buffs.stopAutoroll();
        EventBus.emit('buffs-changed');
        this.persistSave();
    }

    startAutoroll(): void {
        this.buffs.startAutoroll();
        EventBus.emit('buffs-changed');
        this.persistSave();
    }

    setAutorollToggle(enabled: boolean): void {
        if (this.progression.level < AUTOROLL_TOGGLE.unlockLevel) return;
        this.buffs.setAutorollEnabled(enabled);
        EventBus.emit('buffs-changed');
        this.persistSave();
    }


    roll(): void {
        if (this.isRolling) return;
        this.isRolling = true;

        const coinsBefore = this.progression.coins;
        const leagueBefore = getLeagueForChance(this.getBestChance());
        const eligible = getEligiblePets(this.progression.level);
        const luckMultiplier = this.buffs.consumeForRoll();
        const pet = this.rng.rollPet(eligible, luckMultiplier);
        const result = this.progression.processRoll(pet);
        if (result.isNew) {
            this.save.addNewPet(result.pet.id);
            this.emitCollectionEvents(result.pet.id);
        }

        EventBus.emit('roll-complete', result);
        EventBus.emit('buffs-changed');

        this.quests.onRollComplete(result);
        EventBus.emit('quests-changed');

        const oldLevel = this.progression.level;
        const oldEggKey = getEggImageKey(oldLevel);
        const leveledUp = this.progression.checkLevelUp();
        if (leveledUp) {
            const newLevel = this.progression.level;
            const rebirthCount = this.save.getData().rebirthCount;
            if (newLevel >= REBIRTH_CONFIG.triggerLevel && rebirthCount < REBIRTH_CONFIG.maxCount) {
                this.performRebirth();
                const rebirthData: RebirthData = {
                    rebirthCount,
                    newMultiplier: rebirthCount + 2,
                };
                EventBus.emit('rebirth-triggered', rebirthData);
            } else {
                const newEggKey = getEggImageKey(newLevel);
                const eggChanged = oldEggKey !== newEggKey;
                let featureUnlock: string | undefined;
                if (oldLevel < AUTOROLL_TOGGLE.unlockLevel && newLevel >= AUTOROLL_TOGGLE.unlockLevel) {
                    featureUnlock = 'autoroll';
                } else if (oldLevel < NEST_CONFIG.unlockLevel && newLevel >= NEST_CONFIG.unlockLevel) {
                    featureUnlock = 'incubation';
                }
                const coinReward = (eggChanged || featureUnlock) ? 0 : levelUpCoinReward(newLevel);
                this.pendingLevelUpReward = coinReward;
                const levelUpData: LevelUpData = {
                    level: newLevel,
                    eggKey: newEggKey,
                    bgKey: getBgImageKey(newLevel),
                    oldEggKey,
                    eggChanged,
                    coinReward,
                    featureUnlock,
                };
                EventBus.emit('level-up', levelUpData);
            }
        }

        const leagueAfter = getLeagueForChance(this.getBestChance());
        if (leagueBefore.tier !== leagueAfter.tier) {
            const reward = LEAGUE_PROMOTION_REWARDS[leagueAfter.tier];
            if (reward) {
                this.pendingLeaguePromoReward = reward;
                const promoData: LeaguePromotionData = {
                    tier: leagueAfter.tier,
                    coinReward: reward,
                };
                EventBus.emit('league-promotion', promoData);
            }
        }

        this.lastRollCoinGain = this.progression.coins - coinsBefore;
        this.persistSave(result);
    }

    finishRoll(): void {
        this.isRolling = false;
    }

    claimLevelUpCoins(amount: number): void {
        const maxAllowed = this.pendingLevelUpReward * LEVELUP_CONFIG.adCoinMultiplier;
        const safe = Math.min(Math.max(0, amount), maxAllowed);
        if (safe > 0) this.progression.addCoins(safe);
        this.pendingLevelUpReward = 0;
        this.persistSave();
    }

    claimLeaguePromoCoins(amount: number): void {
        const maxAllowed = this.pendingLeaguePromoReward * LEVELUP_CONFIG.adCoinMultiplier;
        const safe = Math.min(Math.max(0, amount), maxAllowed);
        if (safe > 0) this.progression.addCoins(safe);
        this.pendingLeaguePromoReward = 0;
        this.persistSave();
    }

    claimThoughtBuff(): void {
        this.buffs.addDream(1);
        EventBus.emit('buffs-changed');
        this.persistSave();
    }

    purchasePet(petId: string): boolean {
        const price = this.shop.purchase(petId, this.progression.coins);
        if (price === null) return false;
        this.progression.addCoins(-price);
        this.progression.collection.add(petId);
        this.save.addNewPet(petId);
        this.emitCollectionEvents(petId);
        EventBus.emit('shop-purchase', petId);
        this.persistSave();
        return true;
    }

    refreshShop(): void {
        this.shop.refresh(this.progression.collection);
        this.persistSave();
    }

    claimDailyBonus(): DailyBonusReward | null {
        const reward = this.dailyBonus.claimDaily();
        if (!reward) return null;
        this.applyDailyBonusReward(reward);
        EventBus.emit('daily-bonus-claimed');
        this.persistSave();
        return reward;
    }

    claimDailyMilestone(index: number): number {
        const coins = this.dailyBonus.claimMonthlyMilestone(index);
        if (coins > 0) {
            this.progression.addCoins(coins);
            EventBus.emit('daily-milestone-claimed');
            this.persistSave();
        }
        return coins;
    }

    unlockNestSlot(index: number): boolean {
        const price = NEST_CONFIG.slotPrices[index];
        if (this.progression.coins < price) return false;
        if (!this.nests.unlockSlot(index, this.progression.coins)) return false;
        this.progression.addCoins(-price);
        EventBus.emit('nests-changed');
        this.persistSave();
        return true;
    }

    placeNestEgg(slotIndex: number, tier: number): boolean {
        const inv = this.save.getData().eggInventory;
        const key = String(tier);
        if (!inv[key] || inv[key] <= 0) return false;
        const cfg = getEggTierConfig(tier);
        if (!this.nests.placeEgg(slotIndex, tier, this.progression.level, cfg.incubationMs, cfg.buffMultiplier)) return false;
        inv[key]--;
        if (inv[key] <= 0) delete inv[key];
        EventBus.emit('nests-changed');
        this.persistSave();
        return true;
    }

    boostNestSlot(index: number): boolean {
        if (!this.nests.boostSlot(index)) return false;
        EventBus.emit('nests-changed');
        this.persistSave();
        return true;
    }

    hatchNest(slotIndex: number): RollResult | null {
        const info = this.nests.collectHatch(slotIndex);
        if (!info) return null;
        const eligible = getEligiblePets(info.level);
        const mult = info.buffMultiplier * this.buffs.getRebirthMultiplier();
        const pet = this.rng.rollPet(eligible, mult);
        const result = this.progression.processRoll(pet);
        if (result.isNew) {
            this.save.addNewPet(result.pet.id);
            this.emitCollectionEvents(result.pet.id);
        }
        EventBus.emit('nests-changed');
        this.persistSave();
        return result;
    }

    getEggInventory(): Record<string, number> {
        return this.save.getData().eggInventory;
    }

    purchaseEgg(tier: number, price: number): boolean {
        if (this.progression.coins < price) return false;
        this.progression.addCoins(-price);
        const inv = this.save.getData().eggInventory;
        const key = String(tier);
        inv[key] = (inv[key] ?? 0) + 1;
        EventBus.emit('egg-purchased', tier);
        this.persistSave();
        return true;
    }

    addEggs(tier: number, count: number): void {
        const inv = this.save.getData().eggInventory;
        const key = String(tier);
        inv[key] = (inv[key] ?? 0) + count;
        this.persistSave();
    }

    performRebirth(): void {
        const data = this.save.getData();
        data.rebirthCount++;
        this.progression = new ProgressionSystem(1, 0, this.progression.coins, this.progression.getCollectionArray());
        this.buffs.setRebirthMultiplier(1 + data.rebirthCount);
        this.buffs.setAutorollEnabled(false);
        this.buffs.stopAutoroll();
        EventBus.emit('buffs-changed');
        this.persistSave();
        EventBus.emit('rebirth-complete');
    }

    getRebirthCount(): number { return this.save.getData().rebirthCount; }
    getRebirthMultiplier(): number { return this.buffs.getRebirthMultiplier(); }

    private applyDailyBonusReward(reward: DailyBonusReward): void {
        if (reward.type === 'coins') {
            this.progression.addCoins(reward.count);
        } else if (reward.type === 'buff' && reward.buffType) {
            if (reward.buffType === 'lucky') this.buffs.addLucky(reward.count);
            else if (reward.buffType === 'super') this.buffs.addSuper(reward.count);
            else this.buffs.addEpic(reward.count);
            EventBus.emit('buffs-changed');
        } else if (reward.type === 'egg' && reward.eggTier) {
            this.addEggs(reward.eggTier, reward.count);
        }
    }

    private emitCollectionEvents(petId: string): void {
        const ev = this.collectionTracker.onPetCollected(petId, this.progression.collection);
        if (ev.discovered.length > 0 || ev.completed.length > 0) {
            EventBus.emit('collections-changed', ev);
        }
    }

    claimCollection(collId: string): boolean {
        const coll = COLLECTIONS.find(c => c.id === collId);
        if (!coll) return false;
        if (!this.collectionTracker.isComplete(collId, this.progression.collection)) return false;
        if (!this.collectionTracker.claim(collId)) return false;
        if (coll.reward.coins > 0) this.progression.addCoins(coll.reward.coins);
        if (coll.reward.buff) {
            const { type, charges } = coll.reward.buff;
            if (type === 'lucky') this.buffs.addLucky(charges);
            else if (type === 'super') this.buffs.addSuper(charges);
            else this.buffs.addEpic(charges);
            EventBus.emit('buffs-changed');
        }
        EventBus.emit('collection-claimed', collId);
        this.persistSave();
        return true;
    }

    private activateBuff(buff: string): void {
        switch (buff) {
            case 'lucky':
                this.buffs.addLucky(BUFF_CONFIG.lucky.rollsPerAd);
                break;
            case 'super':
                this.buffs.addSuper(BUFF_CONFIG.super.rollsPerAd);
                break;
            case 'epic':
                this.buffs.addEpic(BUFF_CONFIG.epic.rollsPerAd);
                break;
            default:
                return;
        }
        this.buffs.consumeOffer();
        EventBus.emit('buff-activated', buff);
        EventBus.emit('buffs-changed');
        this.persistSave();
    }

    claimQuestReward(questType: 'roll' | 'grade' | 'online', useAd: boolean): void {
        const reward = this.quests.getReward(questType);
        const count = useAd ? reward.adCount : reward.freeCount;
        let claimed = false;
        if (questType === 'roll') claimed = this.quests.claimRollQuest();
        else if (questType === 'grade') claimed = this.quests.claimGradeQuest();
        else claimed = this.quests.claimOnlineQuest();
        if (!claimed) return;

        if (reward.buffType === 'lucky') this.buffs.addLucky(count);
        else if (reward.buffType === 'super') this.buffs.addSuper(count);
        else this.buffs.addEpic(count);

        this.quests.incrementMilestoneCount();
        EventBus.emit('buffs-changed');
        EventBus.emit('quests-changed');
        this.persistSave();
    }

    claimQuestMilestone(index: number): number {
        const coins = this.quests.claimMilestone(index);
        if (coins > 0) {
            this.progression.addCoins(coins);
            EventBus.emit('quests-changed');
            this.persistSave();
        }
        return coins;
    }

    private persistSave(result?: RollResult): void {
        const data = this.save.getData();
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
                this.pendingInterstitial = true;
            }
            data.rollLog.unshift({
                id: result.pet.id,
                grade: result.grade,
                isNew: result.isNew,
                xp: result.xpGained,
            });
            if (data.rollLog.length > 20) data.rollLog.length = 20;
        }

        this.save.save();
    }

    update(deltaMs: number): void {
        const dt = Math.min(deltaMs, 200);
        this.buffs.update(dt);

        // Online time tracking (accumulate ms, tick every second)
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

    /** Save current state (call before scene transitions) */
    saveState(): void { this.persistSave(); }

    private getBestChance(): number {
        const collected = PETS.filter(p => this.progression.collection.has(p.id));
        if (collected.length === 0) return 2;
        return collected.reduce((a, b) => a.chance > b.chance ? a : b).chance;
    }

    consumeInterstitialFlag(): boolean {
        if (this.pendingInterstitial) { this.pendingInterstitial = false; return true; }
        return false;
    }

    getEggImageKey() { return getEggImageKey(this.progression.level); }
    getBgImageKey() { return getBgImageKey(this.progression.level); }
}
