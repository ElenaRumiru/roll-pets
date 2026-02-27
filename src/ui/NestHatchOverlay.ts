import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRADE, GRADE_ORDER, UI, getOddsString } from '../core/config';
import { RollResult } from '../types';
import { AudioSystem, SfxKey } from '../systems/AudioSystem';
import { t } from '../data/locales';
import { fitText } from './components/fitText';

const CX = GAME_WIDTH / 2;
const CY = GAME_HEIGHT / 2;

export class NestHatchOverlay {
    private scene: Scene;
    private objects: GameObjects.GameObject[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
    }

    play(result: RollResult, eggKey: string, onComplete: () => void): void {
        const scene = this.scene;
        const cfg = GRADE[result.grade];
        const audio = scene.registry.get('audio') as AudioSystem | undefined;

        // 1) Dark backdrop
        const dark = scene.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
            .setDepth(500).setInteractive();
        this.objects.push(dark);
        scene.tweens.add({ targets: dark, fillAlpha: 0.75, duration: 200 });

        // 2) Egg container
        const eggContainer = scene.add.container(CX, CY).setAlpha(0).setDepth(501);
        const egg = scene.add.image(0, 0, eggKey).setDisplaySize(296, 296);
        eggContainer.add(egg);
        this.objects.push(eggContainer);

        scene.tweens.add({
            targets: eggContainer, alpha: 1, duration: 200,
            onComplete: () => {
                audio?.playSfx('sfx_wobble');

                // 3) Shake
                scene.tweens.add({
                    targets: eggContainer, x: CX - 6,
                    duration: 50, yoyo: true, repeat: 6, ease: 'Sine.inOut',
                    onComplete: () => {
                        eggContainer.setX(CX);

                        // 4) Break
                        scene.tweens.add({
                            targets: eggContainer, scaleX: 0, scaleY: 0, alpha: 0,
                            duration: 150, ease: 'Back.easeIn',
                            onComplete: () => this.showReveal(result, cfg, audio, onComplete),
                        });
                    },
                });
            },
        });
    }

    private showReveal(
        result: RollResult,
        cfg: { colorHex: string; outlineHex: string; strokeThickness: number },
        audio: AudioSystem | undefined,
        onComplete: () => void,
    ): void {
        const scene = this.scene;

        // Grade-specific jackpot SFX — common uses old reveal, rest get escalating arpeggio
        if (result.grade === 'common') {
            audio?.playSfx('sfx_reveal', result.isNew ? 1 : 0.4);
        } else {
            const gradeKey = `sfx_grade_${result.grade}` as SfxKey;
            audio?.playSfx(gradeKey, result.isNew ? 1 : 0.4);
        }

        // 5) Pet image
        const petImg = scene.add.image(CX, CY - 31, result.pet.imageKey)
            .setScale(0).setDepth(502);
        this.objects.push(petImg);
        scene.tweens.add({ targets: petImg, scale: 0.86, duration: 300, ease: 'Back.easeOut' });

        // 6) Name
        const name = scene.add.text(CX, CY + 80, t('pet_' + result.pet.id), {
            fontFamily: UI.FONT_STROKE, fontSize: '27px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5).setDepth(503);
        fitText(name, 350, 27);
        this.objects.push(name);

        // 7) Odds
        const odds = scene.add.text(CX, CY + 111, getOddsString(result.pet.chance), {
            fontFamily: UI.FONT_STROKE, fontSize: '25px', color: cfg.colorHex,
            stroke: cfg.outlineHex, strokeThickness: cfg.strokeThickness || UI.STROKE_MEDIUM,
        }).setOrigin(0.5).setDepth(503);
        this.objects.push(odds);

        // 8) NEW badge
        if (result.isNew) {
            const badge = scene.add.text(CX, CY - 167, t('new_pet'), {
                fontFamily: UI.FONT_STROKE, fontSize: '32px', color: '#ffc107',
                stroke: '#000000', strokeThickness: UI.STROKE_THICK,
            }).setOrigin(0.5).setScale(0).setDepth(503);
            this.objects.push(badge);
            scene.tweens.add({ targets: badge, scale: 1, duration: 300, ease: 'Back.easeOut' });
        }

        // 9) Rewards line
        const rewards = this.createRewardsLine(result);
        this.objects.push(rewards);

        // 10) Hold scales with grade: base 1100ms, +400ms per grade from Uncommon onwards
        const gradeIdx = GRADE_ORDER.indexOf(result.grade);
        const holdTime = 1100 + Math.max(0, gradeIdx) * 400;
        scene.time.delayedCall(holdTime, () => {
            scene.tweens.add({
                targets: this.objects, alpha: 0, duration: 250,
                onComplete: () => {
                    this.cleanup();
                    onComplete();
                },
            });
        });
    }

    private createRewardsLine(result: RollResult): GameObjects.Container {
        const scene = this.scene;
        const expTex = scene.textures.get('ui_exp_md').getSourceImage();
        const expH = 20;
        const expW = Math.round(expTex.width * (expH / expTex.height));
        const expIcon = scene.add.image(0, 1, 'ui_exp_md').setDisplaySize(expW, expH);
        const expLabel = scene.add.text(0, 0, `+${result.xpGained}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '20px',
            color: '#88cc55', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0, 0.5);
        const coinIcon = scene.add.image(0, 1, 'ui_coin_sm').setDisplaySize(21, 21);
        const coinLabel = scene.add.text(0, 0, `+${result.coinsGained}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '20px',
            color: '#ffc107', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0, 0.5);

        const gap = 4, sep = 15;
        const totalW = expW + gap + expLabel.width + sep + 21 + gap + coinLabel.width;
        let cx = -totalW / 2;
        expIcon.setX(cx + expW / 2);  cx += expW + gap;
        expLabel.setX(cx);             cx += expLabel.width + sep;
        coinIcon.setX(cx + 21 / 2);   cx += 21 + gap;
        coinLabel.setX(cx);

        return scene.add.container(CX, CY + 150,
            [expIcon, expLabel, coinIcon, coinLabel]).setDepth(503);
    }

    private cleanup(): void {
        for (const obj of this.objects) {
            if (!obj.scene) continue;
            obj.destroy();
        }
        this.objects = [];
    }
}
