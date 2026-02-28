import { getVisualTier, VISUAL_TIERS, levelUpCoinReward, NEST_CONFIG, AUTOROLL_TOGGLE, REBIRTH_CONFIG } from '../core/config';
import { getEggImageKey, getEggNameKey, getEggMinOdds } from './eggs';
import { getEggTierConfig, formatBuffMultiplier, formatIncubationTime } from './eggTiers';

export interface Milestone {
    level: number;
    type: 'egg' | 'coins' | 'feature';
    featureKey?: string;
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
export function getMilestones(currentLevel: number, rebirthCount = 0): Milestone[] {
    const nextEgg = nextEggLevel(currentLevel);
    const maxLevel = rebirthCount < REBIRTH_CONFIG.maxCount ? REBIRTH_CONFIG.triggerLevel : Infinity;
    const horizon = Math.min(Math.max(currentLevel + 5, nextEgg + 3), maxLevel);
    const milestones: Milestone[] = [];

    for (let lvl = 1; lvl <= horizon; lvl++) {
        if (lvl === REBIRTH_CONFIG.triggerLevel && rebirthCount < REBIRTH_CONFIG.maxCount) {
            milestones.push({ level: lvl, type: 'feature', featureKey: 'rebirth' });
        } else if (lvl === AUTOROLL_TOGGLE.unlockLevel && !isEggLevel(lvl)) {
            milestones.push({ level: lvl, type: 'feature', featureKey: 'autoroll' });
        } else if (lvl === NEST_CONFIG.unlockLevel && !isEggLevel(lvl)) {
            milestones.push({ level: lvl, type: 'feature', featureKey: 'incubation' });
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
