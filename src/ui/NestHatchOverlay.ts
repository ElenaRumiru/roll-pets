import { Scene, GameObjects } from 'phaser';
import { GRADE, GRADE_HOLD_MS, UI, getOddsString } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait } from '../core/orientation';
import { RollResult } from '../types';
import { AudioSystem, SfxKey } from '../systems/AudioSystem';
import { t } from '../data/locales';
import { fitText } from './components/fitText';
import { getPetScale } from '../loading/PostProcess';

export class NestHatchOverlay {
    private scene: Scene;
    private objects: GameObjects.GameObject[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
    }

    play(result: RollResult, eggKey: string, onComplete: () => void): void {
        const scene = this.scene;
        const gw = getGameWidth();
        const gh = getGameHeight();
        const cx = gw / 2;
        const cy = gh / 2;
        const cfg = GRADE[result.grade];
        const audio = scene.registry.get('audio') as AudioSystem | undefined;

        // 1) Dark backdrop
        const dark = scene.add.rectangle(cx, cy, gw, gh, 0x000000, 0)
            .setDepth(500).setInteractive();
        this.objects.push(dark);
        scene.tweens.add({ targets: dark, fillAlpha: 0.75, duration: 200 });

        // 2) Egg container
        const eggContainer = scene.add.container(cx, cy).setAlpha(0).setDepth(501);
        if (scene.textures.exists(eggKey)) {
            const egg = scene.add.image(0, 0, eggKey).setDisplaySize(296, 296);
            eggContainer.add(egg);
        }
        this.objects.push(eggContainer);

        scene.tweens.add({
            targets: eggContainer, alpha: 1, duration: 200,
            onComplete: () => {
                audio?.playSfx('sfx_wobble');

                // 3) Shake
                scene.tweens.add({
                    targets: eggContainer, x: cx - 6,
                    duration: 50, yoyo: true, repeat: 6, ease: 'Sine.inOut',
                    onComplete: () => {
                        eggContainer.setX(cx);

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
        const cx = getGameWidth() / 2;
        const cy = getGameHeight() / 2;
        const port = isPortrait();

        // Grade-specific jackpot SFX — common uses old reveal, rest get escalating arpeggio
        if (result.grade === 'common') {
            audio?.playSfx('sfx_reveal', result.isNew ? 1 : 0.4);
        } else {
            const gradeKey = `sfx_grade_${result.grade}` as SfxKey;
            audio?.playSfx(gradeKey, result.isNew ? 1 : 0.4);
        }

        // 5) Pet image
        const petTargetPx = port ? 250 : 215;
        const petScale = getPetScale(scene.textures, result.pet.imageKey, petTargetPx);
        const petImg = scene.add.image(cx, cy - (port ? 50 : 31), result.pet.imageKey)
            .setScale(0).setDepth(502);
        this.objects.push(petImg);
        scene.tweens.add({ targets: petImg, scale: petScale, duration: 300, ease: 'Back.easeOut' });

        // 6) Name
        const name = scene.add.text(cx, cy + (port ? 130 : 100), t('pet_' + result.pet.id), {
            fontFamily: UI.FONT_STROKE, fontSize: '27px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5).setDepth(503);
        fitText(name, 350, 27);
        this.objects.push(name);

        // 7) Odds
        const odds = scene.add.text(cx, cy + (port ? 168 : 131), getOddsString(result.pet.chance), {
            fontFamily: UI.FONT_STROKE, fontSize: '25px', color: cfg.colorHex,
            stroke: cfg.outlineHex, strokeThickness: cfg.strokeThickness || UI.STROKE_MEDIUM,
        }).setOrigin(0.5).setDepth(503);
        this.objects.push(odds);

        // 8) NEW badge
        if (result.isNew) {
            const badge = scene.add.text(cx, cy - (port ? 220 : 167), t('new_pet'), {
                fontFamily: UI.FONT_STROKE, fontSize: '32px', color: '#ffc107',
                stroke: '#000000', strokeThickness: UI.STROKE_THICK,
            }).setOrigin(0.5).setScale(0).setDepth(503);
            this.objects.push(badge);
            scene.tweens.add({ targets: badge, scale: 1, duration: 300, ease: 'Back.easeOut' });
        }

        // 9) Rewards line
        const rewards = this.createRewardsLine(result);
        this.objects.push(rewards);

        // Hold matched to SFX duration per grade
        const holdTime = GRADE_HOLD_MS[result.grade] ?? 1100;
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

        const rewardsY = getGameHeight() / 2 + (isPortrait() ? 215 : 170);
        return scene.add.container(getGameWidth() / 2, rewardsY,
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
