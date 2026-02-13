import { EventBus } from './EventBus';
import { RNGSystem } from '../systems/RNGSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { BuffSystem } from '../systems/BuffSystem';
import { PETS } from '../data/pets';
import { getEggTierForLevel } from '../data/eggs';
import { getBackgroundForLevel } from '../data/backgrounds';
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

        this.setupListeners();
    }

    private setupListeners(): void {
        EventBus.on('roll-requested', () => this.roll());
        EventBus.on('buff-requested', (buff: string) => this.activateBuff(buff));
    }

    roll(): void {
        if (this.isRolling) return;
        this.isRolling = true;

        const rarity = this.rng.rollRarity(
            this.progression.level,
            this.buffs.isActive('luck'),
        );

        const petsOfRarity = PETS.filter(p => p.rarity === rarity);
        const pet = petsOfRarity[this.rng.nextInt(0, petsOfRarity.length - 1)];

        const result = this.progression.processRoll(pet, this.buffs.isActive('x2xp'));

        EventBus.emit('roll-complete', result);

        const leveledUp = this.progression.checkLevelUp();
        if (leveledUp) {
            EventBus.emit('level-up', {
                level: this.progression.level,
                egg: getEggTierForLevel(this.progression.level),
                background: getBackgroundForLevel(this.progression.level),
            });
        }

        this.persistSave(result);
        this.isRolling = false;
    }

    private activateBuff(buff: string): void {
        if (buff === 'x2xp' || buff === 'autoroll' || buff === 'luck') {
            this.buffs.activate(buff);
            EventBus.emit('buff-activated', buff);
            this.persistSave();
        }
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
    getBackground() { return getBackgroundForLevel(this.progression.level); }
}
