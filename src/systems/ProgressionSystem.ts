import { RollResult, PetDef } from '../types';
import { GRADE, getGradeForChance, xpForLevel } from '../core/config';

export class ProgressionSystem {
    level: number;
    xp: number;
    collection: Set<string>;

    constructor(level: number, xp: number, collection: string[]) {
        this.level = level;
        this.xp = xp;
        this.collection = new Set(collection);
    }

    processRoll(pet: PetDef): RollResult {
        const isNew = !this.collection.has(pet.id);
        const grade = getGradeForChance(pet.chance);
        const cfg = GRADE[grade];
        const xpNeeded = xpForLevel(this.level);

        const xpPercent = isNew ? cfg.xpNewPercent : cfg.xpDupPercent;
        const xpGained = Math.max(1, Math.floor((xpPercent / 100) * xpNeeded));

        if (isNew) this.collection.add(pet.id);
        this.xp += xpGained;

        return { pet, isNew, xpGained, grade };
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
