import { Scene } from 'phaser';

export function showFloatingText(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    color: string,
    fontSize = 18,
): void {
    const txt = scene.add.text(x, y, text, {
        fontFamily: 'Arial Black',
        fontSize: `${fontSize}px`,
        color,
        stroke: '#000000',
        strokeThickness: 3,
    }).setOrigin(0.5);

    scene.tweens.add({
        targets: txt,
        y: y - 40,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => txt.destroy(),
    });
}

export function showCoinSpend(
    scene: Scene,
    x: number,
    y: number,
    amount: string,
): void {
    const txt = scene.add.text(x, y, `-${amount}`, {
        fontFamily: 'Arial Black',
        fontSize: '18px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    scene.tweens.add({
        targets: txt,
        y: y + 40,
        alpha: 0,
        duration: 900,
        ease: 'Power2',
        onComplete: () => txt.destroy(),
    });
}
