import { Scene, GameObjects, Tweens } from 'phaser';

interface FeedbackOptions {
    hoverScale?: number;
    clickScale?: number;
    hoverEffect?: boolean;
    clickEffect?: boolean;
    scaleTarget?: GameObjects.GameObject & { scaleX: number; scaleY: number; x: number; y: number };
    pivot?: { x: number; y: number };
}

type Scalable = GameObjects.GameObject & { scaleX: number; scaleY: number; x: number; y: number };

export function addButtonFeedback(
    scene: Scene,
    target: Scalable,
    opts?: FeedbackOptions,
): void {
    const hover = opts?.hoverScale ?? 1.025;
    const click = opts?.clickScale ?? 0.95;
    const doHover = opts?.hoverEffect !== false;
    const doClick = opts?.clickEffect !== false;
    const visual = opts?.scaleTarget ?? target;
    const pivot = opts?.pivot;

    const baseSX = visual.scaleX;
    const baseSY = visual.scaleY;
    const baseX = visual.x;
    const baseY = visual.y;
    let tween: Tweens.Tween | null = null;

    const scaleTo = (factor: number, duration: number) => {
        if (tween) { tween.stop(); tween = null; }
        if (!target.active) return;

        const props: Record<string, number> = {
            scaleX: baseSX * factor,
            scaleY: baseSY * factor,
        };
        if (pivot) {
            props.x = baseX + pivot.x * (1 - factor);
            props.y = baseY + pivot.y * (1 - factor);
        }

        tween = scene.tweens.add({
            targets: visual,
            ...props,
            duration,
            ease: 'Quad.easeOut',
            onComplete: () => { tween = null; },
        });
    };

    if (doHover) {
        target.on('pointerover', () => scaleTo(hover, 80));
        target.on('pointerout', () => scaleTo(1, 80));
    }
    if (doClick) {
        target.on('pointerdown', () => scaleTo(click, 60));
        target.on('pointerup', () => scaleTo(doHover ? hover : 1, 80));
    }

    target.once('destroy', () => {
        if (tween) { tween.stop(); tween = null; }
    });
}
