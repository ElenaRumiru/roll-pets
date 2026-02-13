import { RollResult, PetDef } from '../types';
import { RARITY, xpForLevel } from '../core/config';

export class ProgressionSystem {
    level: number;
    xp: number;
    collection: Set<string>;

    constructor(level: number, xp: number, collection: string[]) {
        this.level = level;
        this.xp = xp;
        this.collection = new Set(collection);
    }

    processRoll(pet: PetDef, x2xpActive: boolean): RollResult {
        const isNew = !this.collection.has(pet.id);
        const cfg = RARITY[pet.rarity];
        const xpNeeded = xpForLevel(this.level);

        let xpPercent = isNew ? cfg.xpNewPercent : cfg.xpDupPercent;
        let xpGained = Math.floor((xpPercent / 100) * xpNeeded);
        if (x2xpActive) xpGained *= 2;

        if (isNew) this.collection.add(pet.id);
        this.xp += xpGained;

        return { pet, isNew, xpGained, rarity: pet.rarity };
    }

    checkLevelUp(): boolean {
        const needed = xpForLevel(this.level);
        if (this.xp >= needed) {
            this.xp -= needed;
            this.level++;
            return true;
        }
        return false;
    }

    getXpProgress(): number {
        return this.xp / xpForLevel(this.level);
    }

    getCollectionArray(): string[] {
        return Array.from(this.collection);
    }
}
