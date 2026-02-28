import { RollResult, PetDef } from '../types';
import { getGradeForChance, XP_PER_ROLL, xpForLevel } from '../core/config';

export class ProgressionSystem {
    level: number;
    xp: number;
    coins: number;
    collection: Set<string>;

    constructor(level: number, xp: number, coins: number, collection: string[]) {
        this.level = level;
        this.xp = xp;
        this.coins = coins;
        this.collection = new Set(collection);
    }

    processRoll(pet: PetDef): RollResult {
        const isNew = !this.collection.has(pet.id);
        const grade = getGradeForChance(pet.chance);
        const xpGained = XP_PER_ROLL;
        const coinsGained = pet.chance;

        if (isNew) this.collection.add(pet.id);
        this.xp += xpGained;
        this.coins += coinsGained;

        return { pet, isNew, xpGained, coinsGained, grade };
    }

    addCoins(amount: number): void {
        this.coins += amount;
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
