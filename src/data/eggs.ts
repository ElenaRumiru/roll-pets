import { EggTier, PetDef } from '../types';
import { PETS } from './pets';

export const TOTAL_EGGS = 15;

export const EGG_TIERS: EggTier[] = [
    { id: 1, levelMin: 1,  levelMax: 5,  filter: 0 },
    { id: 2, levelMin: 6,  levelMax: 12, filter: 2 },
    { id: 3, levelMin: 13, levelMax: 22, filter: 5 },
    { id: 4, levelMin: 23, levelMax: 35, filter: 10 },
    { id: 5, levelMin: 36, levelMax: 999, filter: 18 },
];

export function getEggTierForLevel(level: number): EggTier {
    for (let i = EGG_TIERS.length - 1; i >= 0; i--) {
        if (level >= EGG_TIERS[i].levelMin) return EGG_TIERS[i];
    }
    return EGG_TIERS[0];
}

/** Egg image key for a given level (alternates with background changes) */
export function getEggImageKey(level: number): string {
    const idx = Math.min(1 + Math.ceil((level - 1) / 2), TOTAL_EGGS);
    return `egg_${idx}`;
}

export function getEligiblePets(eggTier: EggTier): PetDef[] {
    return PETS.filter(p => p.chance > eggTier.filter);
}
