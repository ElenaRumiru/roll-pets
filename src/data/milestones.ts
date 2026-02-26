import { getVisualTier, VISUAL_TIERS, levelUpCoinReward, NEST_CONFIG } from '../core/config';
import { getEggImageKey, getEggNameKey, getEggMinOdds } from './eggs';
import { getEggTierConfig, formatBuffMultiplier, formatIncubationTime } from './eggTiers';

export interface Milestone {
    level: number;
    type: 'egg' | 'coins' | 'feature';
    eggKey?: string;
    eggNameKey?: string;
    eggMinOdds?: string;
    eggBuffLabel?: string;
    eggIncubationLabel?: string;
    coinAmount?: number;
}

/** Find the next VISUAL_TIER level strictly after the given level */
function nextEggLevel(level: number): number {
    for (const t of VISUAL_TIERS) {
        if (t > level) return t;
    }
    return VISUAL_TIERS[VISUAL_TIERS.length - 1];
}

/** Is this level an egg-change level? (visual tier changes here) */
function isEggLevel(level: number): boolean {
    if (level === 1) return true;
    return getVisualTier(level) !== getVisualTier(level - 1);
}

/**
 * Generate milestone data from level 1 to a horizon.
 * Horizon = max(currentLevel + 5, nextEggLevel + 3).
 */
export function getMilestones(currentLevel: number): Milestone[] {
    const nextEgg = nextEggLevel(currentLevel);
    const horizon = Math.max(currentLevel + 5, nextEgg + 3);
    const milestones: Milestone[] = [];

    for (let lvl = 1; lvl <= horizon; lvl++) {
        if (lvl === NEST_CONFIG.unlockLevel && !isEggLevel(lvl)) {
            milestones.push({ level: lvl, type: 'feature' });
        } else if (isEggLevel(lvl)) {
            const eggKey = getEggImageKey(lvl);
            const tier = getVisualTier(lvl);
            const tierCfg = getEggTierConfig(tier);
            milestones.push({
                level: lvl,
                type: 'egg',
                eggKey,
                eggNameKey: getEggNameKey(eggKey),
                eggMinOdds: getEggMinOdds(lvl),
                eggBuffLabel: formatBuffMultiplier(tierCfg.buffMultiplier),
                eggIncubationLabel: formatIncubationTime(tierCfg.incubationMs),
            });
        } else {
            milestones.push({
                level: lvl,
                type: 'coins',
                coinAmount: levelUpCoinReward(lvl),
            });
        }
    }

    return milestones;
}
