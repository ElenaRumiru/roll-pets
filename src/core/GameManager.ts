import { EventBus } from './EventBus';
import { BUFF_CONFIG } from './config';
import { RNGSystem } from '../systems/RNGSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { BuffSystem } from '../systems/BuffSystem';
import { getEggTierForLevel, getEligiblePets, getEggImageKey } from '../data/eggs';
import { getBgImageKey } from '../data/backgrounds';
import { RollResult } from '../types';

export class GameManager {
    rng: RNGSystem;
    progression: ProgressionSystem;
    save: SaveSystem;
    buffs: BuffSystem;
    isRolling = false;

    constructor() {
        this.save = new SaveSystem();
        const data = this.save.getData();

        this.rng = new RNGSystem();
        this.progression = new ProgressionSystem(data.level, data.xp, data.collection);
        this.buffs = new BuffSystem();
        this.buffs.loadFromSave(data.buffs);
        this.buffs.startSuperCooldown();

        this.setupListeners();
    }

    private setupListeners(): void {
        EventBus.on('roll-requested', () => this.roll());
        EventBus.on('buff-requested', (buff: string) => this.activateBuff(buff));
        EventBus.on('autoroll-stop', () => this.stopAutoroll());
        EventBus.on('autoroll-resume', () => this.resumeAutoroll());
    }

    stopAutoroll(): void {
        this.buffs.stopAutoroll();
        EventBus.emit('buffs-changed');
        this.persistSave();
    }

    resumeAutoroll(): void {
        this.buffs.resumeAutoroll();
        EventBus.emit('buff-activated', 'autoroll');
        EventBus.emit('buffs-changed');
        this.persistSave();
    }


    roll(): void {
        if (this.isRolling) return;
        this.isRolling = true;

        const eggTier = getEggTierForLevel(this.progression.level);
        const eligible = getEligiblePets(eggTier);
        const luckMultiplier = this.buffs.consumeForRoll();
        const pet = this.rng.rollPet(eligible, luckMultiplier);
        const result = this.progression.processRoll(pet);

        EventBus.emit('roll-complete', result);
        EventBus.emit('buffs-changed');

        const leveledUp = this.progression.checkLevelUp();
        if (leveledUp) {
            EventBus.emit('level-up', {
                level: this.progression.level,
                eggKey: getEggImageKey(this.progression.level),
                bgKey: getBgImageKey(this.progression.level),
            });
        }

        this.persistSave(result);
        // isRolling stays true until animation completes (finishRoll called)
    }

    finishRoll(): void {
        this.isRolling = false;
    }

    private activateBuff(buff: string): void {
        switch (buff) {
            case 'lucky':
                this.buffs.addLucky(BUFF_CONFIG.lucky.rollsPerAd);
                break;
            case 'super':
                this.buffs.addSuper(BUFF_CONFIG.super.rollsPerAd);
                this.buffs.consumeSuperOffer();
                break;
            case 'epic':
                if (!this.buffs.claimEpic()) return;
                break;
            case 'autoroll':
                this.buffs.activateAutoroll();
                break;
            default:
                return;
        }
        EventBus.emit('buff-activated', buff);
        EventBus.emit('buffs-changed');
        this.persistSave();
    }

    private persistSave(result?: RollResult): void {
        const data = this.save.getData();
        data.level = this.progression.level;
        data.xp = this.progression.xp;
        data.collection = this.progression.getCollectionArray();
        data.buffs = this.buffs.toSave();

        if (result) {
            data.totalRolls++;
            data.rollLog.unshift({
                id: result.pet.id,
                rarity: result.rarity,
                isNew: result.isNew,
                xp: result.xpGained,
            });
            if (data.rollLog.length > 20) data.rollLog.length = 20;
        }

        this.save.save();
    }

    update(deltaMs: number): void {
        this.buffs.update(deltaMs);
    }

    getEggTier() { return getEggTierForLevel(this.progression.level); }
    getEggImageKey() { return getEggImageKey(this.progression.level); }
    getBgImageKey() { return getBgImageKey(this.progression.level); }
}
