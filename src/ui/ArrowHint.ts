import { Scene, GameObjects, Tweens } from 'phaser';
import { ROLL_BTN, ONBOARDING } from '../core/config';

export class ArrowHint {
    private image: GameObjects.Image;
    private bobTween: Tweens.Tween;
    private scene: Scene;
    private alive = true;

    constructor(scene: Scene) {
        this.scene = scene;

        this.image = scene.add.image(ROLL_BTN.x, ONBOARDING.arrowY, 'ui_arrow')
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
        const top = ONBOARDING.arrowY - ONBOARDING.bobDistance;
        const bottom = ONBOARDING.arrowY;
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
