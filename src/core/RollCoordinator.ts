import { EventBus } from './EventBus';
import { BUFF_CONFIG, levelUpCoinReward, LEAGUE_PROMOTION_REWARDS, NEST_CONFIG, AUTOROLL_TOGGLE, REBIRTH_CONFIG, LEVELUP_CONFIG } from './config';
import { RNGSystem } from '../systems/RNGSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { BuffSystem } from '../systems/BuffSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { NestSystem } from '../systems/NestSystem';
import { CollectionTracker } from '../systems/CollectionTracker';
import { getEligiblePets, getEggImageKey } from '../data/eggs';
import { getEggTierConfig } from '../data/eggTiers';
import { getBgImageKey } from '../data/backgrounds';
import { getLeagueForChance } from '../data/leaderboard';
import { PETS } from '../data/pets';
import { RollResult, LevelUpData, LeaguePromotionData, RebirthData } from '../types';

export interface RollDeps {
    rng: RNGSystem;
    getProgression: () => ProgressionSystem;
    buffs: BuffSystem;
    save: SaveSystem;
    quests: QuestSystem;
    nests: NestSystem;
    collectionTracker: CollectionTracker;
    persistSave: (result?: RollResult) => void;
    onRebirthReset: () => void;
}

export class RollCoordinator {
    isRolling = false;
    lastRollCoinGain = 0;
    pendingRebirthData: RebirthData | null = null;
    pendingInterstitial = false;
    pendingLevelUpReward = 0;
    pendingLeaguePromoReward = 0;

    constructor(private deps: RollDeps) {}

    roll(): void {
        if (this.isRolling) return;
        this.isRolling = true;

        const prog = this.deps.getProgression();
        const coinsBefore = prog.coins;
        const leagueBefore = getLeagueForChance(this.getBestChance());
        const eligible = getEligiblePets(prog.level);
        const luckMultiplier = this.deps.buffs.consumeForRoll();
        const pet = this.deps.rng.rollPet(eligible, luckMultiplier);
        const result = prog.processRoll(pet);
        if (result.isNew) {
            this.deps.save.addNewPet(result.pet.id);
            this.emitCollectionEvents(result.pet.id);
        }

        EventBus.emit('roll-complete', result);
        EventBus.emit('buffs-changed');

        this.deps.quests.onRollComplete(result);
        EventBus.emit('quests-changed');

        const oldLevel = prog.level;
        const oldEggKey = getEggImageKey(oldLevel);
        const leveledUp = prog.checkLevelUp();
        if (leveledUp) {
            const newLevel = prog.level;
            const rebirthCount = this.deps.save.getData().rebirthCount;
            if (newLevel >= REBIRTH_CONFIG.triggerLevel && rebirthCount < REBIRTH_CONFIG.maxCount) {
                this.performRebirth();
                const rebirthData: RebirthData = { rebirthCount, newMultiplier: rebirthCount + 2 };
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
                    level: newLevel, eggKey: newEggKey, bgKey: getBgImageKey(newLevel),
                    oldEggKey, eggChanged, coinReward, featureUnlock,
                };
                EventBus.emit('level-up', levelUpData);
            }
        }

        const leagueAfter = getLeagueForChance(this.getBestChance());
        if (leagueBefore.tier !== leagueAfter.tier) {
            const reward = LEAGUE_PROMOTION_REWARDS[leagueAfter.tier];
            if (reward) {
                this.pendingLeaguePromoReward = reward;
                const promoData: LeaguePromotionData = { tier: leagueAfter.tier, coinReward: reward };
                EventBus.emit('league-promotion', promoData);
            }
        }

        this.lastRollCoinGain = this.deps.getProgression().coins - coinsBefore;
        this.deps.persistSave(result);
    }

    finishRoll(): void { this.isRolling = false; }

    claimLevelUpCoins(amount: number): void {
        const maxAllowed = this.pendingLevelUpReward * LEVELUP_CONFIG.adCoinMultiplier;
        const safe = Math.min(Math.max(0, amount), maxAllowed);
        if (safe > 0) this.deps.getProgression().addCoins(safe);
        this.pendingLevelUpReward = 0;
        this.deps.persistSave();
    }

    claimLeaguePromoCoins(amount: number): void {
        const maxAllowed = this.pendingLeaguePromoReward * LEVELUP_CONFIG.adCoinMultiplier;
        const safe = Math.min(Math.max(0, amount), maxAllowed);
        if (safe > 0) this.deps.getProgression().addCoins(safe);
        this.pendingLeaguePromoReward = 0;
        this.deps.persistSave();
    }

    performRebirth(): void {
        const data = this.deps.save.getData();
        data.rebirthCount++;
        this.deps.onRebirthReset();
        this.deps.buffs.setRebirthMultiplier(1 + data.rebirthCount);
        this.deps.buffs.setAutorollEnabled(false);
        this.deps.buffs.stopAutoroll();
        EventBus.emit('buffs-changed');
        this.deps.persistSave();
        EventBus.emit('rebirth-complete');
    }

    hatchNest(slotIndex: number): RollResult | null {
        const info = this.deps.nests.collectHatch(slotIndex);
        if (!info) return null;
        const eligible = getEligiblePets(info.level);
        const mult = info.buffMultiplier * this.deps.buffs.getRebirthMultiplier();
        const pet = this.deps.rng.rollPet(eligible, mult);
        const prog = this.deps.getProgression();
        const result = prog.processRoll(pet);
        if (result.isNew) {
            this.deps.save.addNewPet(result.pet.id);
            this.emitCollectionEvents(result.pet.id);
        }
        EventBus.emit('nests-changed');
        this.deps.persistSave();
        return result;
    }

    consumeInterstitialFlag(): boolean {
        if (this.pendingInterstitial) { this.pendingInterstitial = false; return true; }
        return false;
    }

    private getBestChance(): number {
        const prog = this.deps.getProgression();
        const collected = PETS.filter(p => prog.collection.has(p.id));
        if (collected.length === 0) return 2;
        return collected.reduce((a, b) => a.chance > b.chance ? a : b).chance;
    }

    private emitCollectionEvents(petId: string): void {
        const prog = this.deps.getProgression();
        const ev = this.deps.collectionTracker.onPetCollected(petId, prog.collection);
        if (ev.discovered.length > 0 || ev.completed.length > 0) {
            EventBus.emit('collections-changed', ev);
        }
    }
}
