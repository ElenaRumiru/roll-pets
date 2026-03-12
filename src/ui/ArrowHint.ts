import { Scene, GameObjects, Tweens } from 'phaser';
import { ONBOARDING } from '../core/config';
import { getLayout } from '../core/layout';

export class ArrowHint {
    private image: GameObjects.Image;
    private bobTween: Tweens.Tween | Tweens.TweenChain;
    private scene: Scene;
    private alive = true;

    constructor(scene: Scene) {
        this.scene = scene;
        const l = getLayout();

        this.image = scene.add.image(l.rollBtn.x, l.arrowY, 'ui_arrow')
            .setDepth(10)
            .setAlpha(0);

        // Fade in
        scene.tweens.add({
            targets: this.image,
            alpha: 1,
            duration: 300,
            ease: 'Sine.easeOut',
        });

        // Springy bob: fast drop down, slow float up
        const top = l.arrowY - ONBOARDING.bobDistance;
        const bottom = l.arrowY;
        this.bobTween = scene.tweens.chain({
            targets: this.image,
            loop: -1,
            tweens: [
                { y: top, duration: ONBOARDING.bobDuration * 0.55, ease: 'Sine.easeOut' },
                { y: bottom, duration: ONBOARDING.bobDuration * 0.45, ease: 'Cubic.easeIn' },
            ],
        });
    }

    get visible(): boolean {
        return this.alive && this.image.visible;
    }

    hide(): void {
        if (!this.alive) return;
        this.alive = false;
        this.bobTween.stop();

        this.scene.tweens.add({
            targets: this.image,
            alpha: 0,
            y: this.image.y + 10,
            duration: 250,
            ease: 'Sine.easeIn',
            onComplete: () => this.image.destroy(),
        });
    }

    destroy(): void {
        if (!this.alive) return;
        this.alive = false;
        this.bobTween.stop();
        this.image.destroy();
    }
}
