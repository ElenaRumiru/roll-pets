import { Scene, GameObjects, Tweens } from 'phaser';
import { AudioSystem } from '../../systems/AudioSystem';

interface FeedbackOptions {
    clickScale?: number;
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
    const click = opts?.clickScale ?? 0.95;
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

    if (doClick) {
        target.on('pointerdown', () => {
            scaleTo(click, 60);
            const audio = scene.registry.get('audio') as AudioSystem | undefined;
            audio?.playSfx('sfx_click', 1.0);
        });
        target.on('pointerup', () => scaleTo(1, 80));
    }

    target.once('destroy', () => {
        if (tween) { tween.stop(); tween = null; }
    });
}
