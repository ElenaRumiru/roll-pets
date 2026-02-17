import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI } from '../core/config';
import { LevelUpData } from '../types';
import { getEggNameKey, getEggMinOdds } from '../data/eggs';
import { t } from '../data/locales';

const CX = GAME_WIDTH / 2;
const CY = GAME_HEIGHT / 2;
const DEPTH = 103;

export class LevelUpOverlay {
    private scene: Scene;
    private overlay: GameObjects.Rectangle;
    private elements: GameObjects.GameObject[] = [];

    constructor(scene: Scene, overlay: GameObjects.Rectangle) {
        this.scene = scene;
        this.overlay = overlay;
    }

    show(data: LevelUpData, autorollActive: boolean, onComplete: () => void): void {
        this.cleanup();

        const container = this.scene.add.container(CX, CY).setDepth(DEPTH).setScale(0).setAlpha(1);
        this.elements.push(container);

        // Title (28 * 1.5 = 42)
        const title = this.scene.add.text(0, -95, t('levelup_title'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '42px',
            color: '#ffc107',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        container.add(title);

        // Level number (20 * 1.5 = 30)
        const levelText = this.scene.add.text(0, -55, `${t('level')} ${data.level}`, {
            fontFamily: UI.FONT_MAIN,
            fontSize: '30px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        container.add(levelText);

        if (data.eggChanged) {
            this.buildEggTransition(container, data);
        } else {
            this.buildSingleEgg(container, data);
        }

        // Egg effect text (white, both cases)
        const effectY = data.eggChanged ? 120 : 135;
        const odds = getEggMinOdds(data.level);
        const effectStr = t('egg_effect').replace('{odds}', odds);
        const effect = this.scene.add.text(0, effectY, effectStr, {
            fontFamily: UI.FONT_MAIN,
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        container.add(effect);

        // Animate in
        this.scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut',
        });

        // Hold then fade
        const holdTime = autorollActive ? 400 : 900;
        this.scene.time.delayedCall(holdTime + 300, () => {
            this.fadeOut(autorollActive, onComplete);
        });
    }

    private buildEggTransition(container: GameObjects.Container, data: LevelUpData): void {
        // Old egg (left)
        const oldEgg = this.scene.add.image(-80, 20, data.oldEggKey)
            .setDisplaySize(100, 100);
        container.add(oldEgg);

        // Arrow image (rotated -90deg so it points right)
        const arrow = this.scene.add.image(0, 20, 'ui_arrow')
            .setDisplaySize(32, 32)
            .setRotation(-Math.PI / 2);
        container.add(arrow);

        // New egg (right)
        const newEgg = this.scene.add.image(80, 20, data.eggKey)
            .setDisplaySize(100, 100);
        container.add(newEgg);

        // "New Egg: Golden Egg" — single line, yellow (16 * 1.5 = 24)
        const label = `${t('levelup_new_egg')} ${t(getEggNameKey(data.eggKey))}`;
        const newEggLabel = this.scene.add.text(0, 90, label, {
            fontFamily: UI.FONT_MAIN,
            fontSize: '24px',
            color: '#ffc107',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        container.add(newEggLabel);
    }

    private buildSingleEgg(container: GameObjects.Container, data: LevelUpData): void {
        // Current egg centered
        const egg = this.scene.add.image(0, 30, data.eggKey)
            .setDisplaySize(120, 120);
        container.add(egg);

        // Egg name (14 * 1.5 = 21)
        const eggName = this.scene.add.text(0, 108, t(getEggNameKey(data.eggKey)), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '21px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        container.add(eggName);
    }

    private fadeOut(autorollActive: boolean, onComplete: () => void): void {
        // Fade overlay unless autoroll keeps it
        if (!autorollActive) {
            this.scene.tweens.add({
                targets: this.overlay,
                fillAlpha: 0,
                duration: 250,
            });
        }

        // Fade content
        this.scene.tweens.add({
            targets: this.elements,
            alpha: 0,
            duration: 250,
            onComplete: () => {
                this.cleanup();
                onComplete();
            },
        });
    }

    private cleanup(): void {
        for (const el of this.elements) {
            el.destroy();
        }
        this.elements = [];
    }
}
