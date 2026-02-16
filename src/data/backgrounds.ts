export const TOTAL_BACKGROUNDS = 14;

/** Background image key for a given level (alternates with egg changes) */
export function getBgImageKey(level: number): string {
    const idx = Math.min(1 + Math.floor((level - 1) / 2), TOTAL_BACKGROUNDS);
    return `bg_${idx}`;
}
