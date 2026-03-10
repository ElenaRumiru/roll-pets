import { EventBus } from './EventBus';
import { BUFF_CONFIG, NEST_CONFIG } from './config';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { BuffSystem } from '../systems/BuffSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { ShopSystem } from '../systems/ShopSystem';
import { DailyBonusSystem } from '../systems/DailyBonusSystem';
import { NestSystem } from '../systems/NestSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { CollectionTracker } from '../systems/CollectionTracker';
import { COLLECTIONS } from '../data/collections';
import { getEggTierConfig } from '../data/eggTiers';
import { DailyBonusReward } from '../types';

export interface EconomyDeps {
    getProgression: () => ProgressionSystem;
    buffs: BuffSystem;
    save: SaveSystem;
    shop: ShopSystem;
    dailyBonus: DailyBonusSystem;
    nests: NestSystem;
    quests: QuestSystem;
    collectionTracker: CollectionTracker;
    persistSave: () => void;
}

export class EconomyCoordinator {
    constructor(private deps: EconomyDeps) {}

    purchasePet(petId: string): boolean {
        const prog = this.deps.getProgression();
        const price = this.deps.shop.purchase(petId, prog.coins);
        if (price === null) return false;
        prog.addCoins(-price);
        prog.collection.add(petId);
        this.deps.save.addNewPet(petId);
        this.emitCollectionEvents(petId);
        EventBus.emit('shop-purchase', petId);
        this.deps.persistSave();
        return true;
    }

    refreshShop(): void {
        this.deps.shop.refresh(this.deps.getProgression().collection);
        this.deps.persistSave();
    }
    purchaseEgg(tier: number, price: number): boolean {
        const prog = this.deps.getProgression();
        if (prog.coins < price) return false;
        prog.addCoins(-price);
        const inv = this.deps.save.getData().eggInventory;
        const key = String(tier);
        inv[key] = (inv[key] ?? 0) + 1;
        EventBus.emit('egg-purchased', tier);
        this.deps.persistSave();
        return true;
    }

    addEggs(tier: number, count: number): void {
        const inv = this.deps.save.getData().eggInventory;
        const key = String(tier);
        inv[key] = (inv[key] ?? 0) + count;
        this.deps.persistSave();
    }
    claimDailyBonus(): DailyBonusReward | null {
        const reward = this.deps.dailyBonus.claimDaily();
        if (!reward) return null;
        this.applyDailyBonusReward(reward);
        EventBus.emit('daily-bonus-claimed');
        this.deps.persistSave();
        return reward;
    }

    claimDailyMilestone(index: number): number {
        const coins = this.deps.dailyBonus.claimMonthlyMilestone(index);
        if (coins > 0) {
            this.deps.getProgression().addCoins(coins);
            EventBus.emit('daily-milestone-claimed');
            this.deps.persistSave();
        }
        return coins;
    }
    claimCollection(collId: string): boolean {
        const coll = COLLECTIONS.find(c => c.id === collId);
        if (!coll) return false;
        const prog = this.deps.getProgression();
        if (!this.deps.collectionTracker.isComplete(collId, prog.collection)) return false;
        if (!this.deps.collectionTracker.claim(collId)) return false;
        if (coll.reward.coins > 0) prog.addCoins(coll.reward.coins);
        if (coll.reward.buff) {
            const { type, charges } = coll.reward.buff;
            if (type === 'lucky') this.deps.buffs.addLucky(charges);
            else if (type === 'super') this.deps.buffs.addSuper(charges);
            else this.deps.buffs.addEpic(charges);
            EventBus.emit('buffs-changed');
        }
        EventBus.emit('collection-claimed', collId);
        this.deps.persistSave();
        return true;
    }

    claimQuestReward(questType: 'roll' | 'grade' | 'online', useAd: boolean): void {
        const reward = this.deps.quests.getReward(questType);
        const count = useAd ? reward.adCount : reward.freeCount;
        let claimed = false;
        if (questType === 'roll') claimed = this.deps.quests.claimRollQuest();
        else if (questType === 'grade') claimed = this.deps.quests.claimGradeQuest();
        else claimed = this.deps.quests.claimOnlineQuest();
        if (!claimed) return;

        if (reward.buffType === 'lucky') this.deps.buffs.addLucky(count);
        else if (reward.buffType === 'super') this.deps.buffs.addSuper(count);
        else this.deps.buffs.addEpic(count);

        this.deps.quests.incrementMilestoneCount();
        EventBus.emit('buffs-changed');
        EventBus.emit('quests-changed');
        this.deps.persistSave();
    }

    claimQuestMilestone(index: number): number {
        const coins = this.deps.quests.claimMilestone(index);
        if (coins > 0) {
            this.deps.getProgression().addCoins(coins);
            EventBus.emit('quests-changed');
            this.deps.persistSave();
        }
        return coins;
    }

    claimThoughtBuff(): void {
        this.deps.buffs.addDream(1);
        EventBus.emit('buffs-changed');
        this.deps.persistSave();
    }
    activateBuff(buff: string): void {
        switch (buff) {
            case 'lucky': this.deps.buffs.addLucky(BUFF_CONFIG.lucky.rollsPerAd); break;
            case 'super': this.deps.buffs.addSuper(BUFF_CONFIG.super.rollsPerAd); break;
            case 'epic': this.deps.buffs.addEpic(BUFF_CONFIG.epic.rollsPerAd); break;
            default: return;
        }
        this.deps.buffs.consumeOffer();
        EventBus.emit('buff-activated', buff);
        EventBus.emit('buffs-changed');
        this.deps.persistSave();
    }

    unlockNestSlot(index: number): boolean {
        const prog = this.deps.getProgression();
        const price = NEST_CONFIG.slotPrices[index];
        if (prog.coins < price) return false;
        if (!this.deps.nests.unlockSlot(index, prog.coins)) return false;
        prog.addCoins(-price);
        EventBus.emit('nests-changed');
        this.deps.persistSave();
        return true;
    }

    placeNestEgg(slotIndex: number, tier: number): boolean {
        const inv = this.deps.save.getData().eggInventory;
        const key = String(tier);
        if (!inv[key] || inv[key] <= 0) return false;
        const prog = this.deps.getProgression();
        const cfg = getEggTierConfig(tier);
        if (!this.deps.nests.placeEgg(slotIndex, tier, prog.level, cfg.incubationMs, cfg.buffMultiplier)) return false;
        inv[key]--;
        if (inv[key] <= 0) delete inv[key];
        EventBus.emit('nests-changed');
        this.deps.persistSave();
        return true;
    }

    boostNestSlot(index: number): boolean {
        if (!this.deps.nests.boostSlot(index)) return false;
        EventBus.emit('nests-changed');
        this.deps.persistSave();
        return true;
    }
    private applyDailyBonusReward(reward: DailyBonusReward): void {
        if (reward.type === 'coins') {
            this.deps.getProgression().addCoins(reward.count);
        } else if (reward.type === 'buff' && reward.buffType) {
            if (reward.buffType === 'lucky') this.deps.buffs.addLucky(reward.count);
            else if (reward.buffType === 'super') this.deps.buffs.addSuper(reward.count);
            else this.deps.buffs.addEpic(reward.count);
            EventBus.emit('buffs-changed');
        } else if (reward.type === 'egg' && reward.eggTier) {
            this.addEggs(reward.eggTier, reward.count);
        }
    }

    private emitCollectionEvents(petId: string): void {
        const prog = this.deps.getProgression();
        const ev = this.deps.collectionTracker.onPetCollected(petId, prog.collection);
        if (ev.discovered.length > 0 || ev.completed.length > 0) {
            EventBus.emit('collections-changed', ev);
        }
    }
}
