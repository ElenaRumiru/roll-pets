import { getVisualTier, VISUAL_TIERS } from '../core/config';

export const TOTAL_BACKGROUNDS = VISUAL_TIERS.length;
export const TOTAL_PORTRAIT_BACKGROUNDS = 16;

/** Background image key for a given level (changes at VISUAL_TIERS thresholds) */
export function getBgImageKey(level: number): string {
    return `bg_${getVisualTier(level)}`;
}

/** Portrait background image key — tier 17 falls back to 16 */
export function getPortraitBgImageKey(level: number): string {
    const tier = Math.min(getVisualTier(level), TOTAL_PORTRAIT_BACKGROUNDS);
    return `bg_p_${tier}`;
}
