import { PetDef } from '../types';
import { PETS } from './pets';
import { getVisualTier, VISUAL_TIERS, getOddsString } from '../core/config';

export const TOTAL_EGGS = VISUAL_TIERS.length;

/** Sorted pets by chance ascending (most common first) — cached */
const SORTED_BY_CHANCE = [...PETS].sort((a, b) => a.chance - b.chance);

/**
 * Get egg filter for a given player level.
 * Each visual tier removes one more common pet from the pool.
 * Tier 1 = no filter, Tier 2 = remove cheapest, Tier 3 = remove 2 cheapest, etc.
 */
export function getEggFilterForLevel(level: number): number {
    const tier = getVisualTier(level);
    const removals = tier - 1;
    if (removals <= 0) return 0;
    const idx = Math.min(removals - 1, SORTED_BY_CHANCE.length - 2);
    return SORTED_BY_CHANCE[idx].chance;
}

/** Egg image key for a given level (changes at VISUAL_TIERS thresholds) */
export function getEggImageKey(level: number): string {
    return `egg_${getVisualTier(level)}`;
}

/** Map egg image key (egg_1..egg_17) to a locale name key */
export function getEggNameKey(eggImageKey: string): string {
    const tier = parseInt(eggImageKey.replace('egg_', ''));
    return `egg_tier_${tier}`;
}

/** Get formatted min odds string for a given level's egg pool */
export function getEggMinOdds(level: number): string {
    const eligible = getEligiblePets(level);
    if (eligible.length === 0) return '1/2';
    const minChance = eligible.reduce((min, p) => p.chance < min ? p.chance : min, Infinity);
    return getOddsString(minChance);
}

export function getEligiblePets(level: number): PetDef[] {
    const filter = getEggFilterForLevel(level);
    return PETS.filter(p => p.chance > filter);
}
