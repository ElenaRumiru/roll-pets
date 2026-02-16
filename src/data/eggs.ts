import { EggTier, PetDef } from '../types';
import { PETS } from './pets';
import { getVisualTier, VISUAL_TIERS } from '../core/config';

export const TOTAL_EGGS = VISUAL_TIERS.length;

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

/** Egg image key for a given level (changes at VISUAL_TIERS thresholds) */
export function getEggImageKey(level: number): string {
    return `egg_${getVisualTier(level)}`;
}

export function getEligiblePets(eggTier: EggTier): PetDef[] {
    return PETS.filter(p => p.chance > eggTier.filter);
}
