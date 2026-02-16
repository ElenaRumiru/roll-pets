import { getVisualTier, VISUAL_TIERS } from '../core/config';

export const TOTAL_BACKGROUNDS = VISUAL_TIERS.length;

/** Background image key for a given level (changes at VISUAL_TIERS thresholds) */
export function getBgImageKey(level: number): string {
    return `bg_${getVisualTier(level)}`;
}
