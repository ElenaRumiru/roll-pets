import { GameObjects } from 'phaser';

/**
 * Shrink a Phaser text object's font size until it fits within maxWidth.
 * Returns the text object for chaining.
 */
export function fitText(
    text: GameObjects.Text,
    maxWidth: number,
    baseFontSize: number,
    minFontSize?: number,
): GameObjects.Text {
    const floor = minFontSize ?? Math.round(baseFontSize * 0.65);
    let size = baseFontSize;
    text.setFontSize(size);
    while (text.width > maxWidth && size > floor) {
        size--;
        text.setFontSize(size);
    }
    return text;
}
