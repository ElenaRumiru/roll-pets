import { GameObjects, Scene } from 'phaser';
import { GRADE, GRADE_HOLD_MS, getGradeForChance, UI, PET_OFFSET_Y, getOddsString } from '../core/config';
import { getLayout } from '../core/layout';
import { PetDef, RollResult } from '../types';
import { AudioSystem, SfxKey } from '../systems/AudioSystem';
import { IdleWobbleFX } from './IdleWobbleFX';
import { t } from '../data/locales';
import { fitText } from './components/fitText';

interface PedestalSlot {
    shadow: GameObjects.Graphics | null;
    image: GameObjects.Image | null;
    nameText: GameObjects.Text;
    oddsText: GameObjects.Text;
}

export class CenterStage extends GameObjects.Container {
    private slots: PedestalSlot[] = [];
    private audio: AudioSystem | null = null;
    private autorollOverlayActive = false;
    private keepOverlay = false;

    // Roll overlay elements
    private overlay: GameObjects.Rectangle;
    private eggContainer: GameObjects.Container;
    private egg: GameObjects.Image;
    private revealImage: GameObjects.Image | null = null;
    private revealName: GameObjects.Text;
    private revealRarity: GameObjects.Text;
    private newBadge: GameObjects.Text;
    private rewardsContainer: GameObjects.Container;

    private cx: number;
    private cy: number;

    constructor(scene: Scene) {
        super(scene, 0, 0);
        const l = getLayout();
        this.cx = l.cx;
        this.cy = l.cy;

        const positions = [l.pedestal.first, l.pedestal.second, l.pedestal.third];

        // Create 3 pedestal slots
        for (let i = 0; i < 3; i++) {
            const pos = positions[i];

            const nameText = scene.add.text(pos.x, pos.y + PET_OFFSET_Y - 113, '', {
                fontFamily: UI.FONT_STROKE,
                fontSize: '22px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: UI.STROKE_THICK,
            }).setOrigin(0.5).setAlpha(0);
            this.add(nameText);

            const oddsText = scene.add.text(pos.x, pos.y + PET_OFFSET_Y - 91, '', {
                fontFamily: UI.FONT_STROKE,
                fontSize: '25px',
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: UI.STROKE_THICK,
            }).setOrigin(0.5).setAlpha(0);
            this.add(oddsText);

            this.slots.push({ shadow: null, image: null, nameText, oddsText });
        }

        // --- ROLL OVERLAY (all hidden initially, rendered on top) ---
        const CX = this.cx;
        const CY = this.cy;

        // Dark overlay
        this.overlay = scene.add.rectangle(CX, CY, l.gw, l.gh, 0x000000, 0)
            .setDepth(100);

        // Egg container
        this.eggContainer = scene.add.container(CX, CY).setAlpha(0).setDepth(101);
        this.egg = scene.add.image(0, 0, 'egg_1').setDisplaySize(296, 296);
        this.eggContainer.add(this.egg);

        // Reveal elements (on top of overlay)
        this.revealName = scene.add.text(CX, CY + 80, '', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '27px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5).setAlpha(0).setDepth(103);

        this.revealRarity = scene.add.text(CX, CY + 111, '', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '25px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5).setAlpha(0).setDepth(103);

        this.newBadge = scene.add.text(CX, CY - 167, t('new_pet'), {
            fontFamily: UI.FONT_STROKE,
            fontSize: '32px',
            color: '#ffc107',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5).setAlpha(0).setDepth(103);

        // Rewards line: [EXP icon] +25  [COIN icon] +5 — single container, centered
        const expIcon = scene.add.image(0, 1, 'ui_exp_md');
        const expLabel = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '20px',
            color: '#88cc55', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0, 0.5);
        const coinIcon = scene.add.image(0, 1, 'ui_coin_sm').setDisplaySize(21, 21);
        const coinLabel = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '20px',
            color: '#ffc107', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0, 0.5);
        this.rewardsContainer = scene.add.container(CX, CY + 150,
            [expIcon, expLabel, coinIcon, coinLabel]).setAlpha(0).setDepth(103);

        scene.add.existing(this);
    }

    setAudio(audio: AudioSystem): void {
        this.audio = audio;
    }

    setEggImage(key: string): void {
        this.egg.setTexture(key);
    }

    updatePedestals(topPets: PetDef[]): void {
        const l = getLayout();
        const positions = [l.pedestal.first, l.pedestal.second, l.pedestal.third];

        for (let i = 0; i < 3; i++) {
            const slot = this.slots[i];
            const pos = positions[i];
            const pet = topPets[i];

            if (slot.shadow) {
                slot.shadow.destroy();
                slot.shadow = null;
            }
            if (slot.image) {
                slot.image.destroy();
                slot.image = null;
            }

            if (pet) {
                const cfg = GRADE[getGradeForChance(pet.chance)];

                slot.image = this.scene.add.image(pos.x, pos.y + PET_OFFSET_Y, pet.imageKey)
                    .setScale(pos.scale)
                    .setOrigin(0.5, 1);
                slot.image.setPostPipeline(IdleWobbleFX);
                const fx = slot.image.getPostPipeline(IdleWobbleFX) as IdleWobbleFX;
                if (fx) fx.setPhase(i * 1.5);
                this.add(slot.image);
                this.sendToBack(slot.image);

                // Rhombus shadow under pet (behind image)
                const sw = 113 * pos.scale;
                const sh = 25 * pos.scale;
                const sx = pos.x;
                const sy = pos.y + 3;
                slot.shadow = this.scene.add.graphics({ x: sx, y: sy });
                slot.shadow.fillStyle(0x000000, 0.15);
                slot.shadow.beginPath();
                slot.shadow.moveTo(0, -sh);
                slot.shadow.lineTo(sw, 0);
                slot.shadow.lineTo(0, sh);
                slot.shadow.lineTo(-sw, 0);
                slot.shadow.closePath();
                slot.shadow.fillPath();
                slot.shadow.setRotation(-0.05);
                this.add(slot.shadow);
                this.sendToBack(slot.shadow);

                // Position text above the pet image top
                const topY = slot.image.y - slot.image.displayHeight;
                slot.nameText.setText(t('pet_' + pet.id))
                    .setPosition(pos.x, topY - 57)
                    .setColor('#ffffff')
                    .setStroke('#000000', UI.STROKE_THICK)
                    .setAlpha(1);
                fitText(slot.nameText, 200, 22);

                slot.oddsText.setText(getOddsString(pet.chance))
                    .setPosition(pos.x, topY - 27)
                    .setColor(cfg.colorHex)
                    .setStroke(cfg.outlineHex, cfg.strokeThickness || UI.STROKE_MEDIUM)
                    .setAlpha(1);
            } else {
                slot.nameText.setAlpha(0);
                slot.oddsText.setAlpha(0);
            }
        }
    }

    playHatch(result: RollResult, onComplete: () => void): void {
        const scene = this.scene;
        const cfg = GRADE[result.grade];
        const CX = this.cx;
        const CY = this.cy;

        // 1) Fade in dark overlay (skip if autoroll keeps it persistent)
        if (!this.autorollOverlayActive) {
            scene.tweens.add({
                targets: this.overlay,
                fillAlpha: 0.75,
                duration: 200,
            });
        }

        // 2) Show egg in center + shake
        this.eggContainer.setPosition(CX, CY).setAlpha(0).setScale(1);
        scene.tweens.add({
            targets: this.eggContainer,
            alpha: 1,
            duration: 200,
            onComplete: () => {
                // Wobble SFX
                this.audio?.playSfx('sfx_wobble');

                // Shake
                scene.tweens.add({
                    targets: this.eggContainer,
                    x: CX - 6,
                    duration: 50,
                    yoyo: true,
                    repeat: 6,
                    ease: 'Sine.inOut',
                    onComplete: () => {
                        this.eggContainer.setX(CX);

                        // 3) Egg breaks — shrink away
                        scene.tweens.add({
                            targets: this.eggContainer,
                            scaleX: 0,
                            scaleY: 0,
                            alpha: 0,
                            duration: 150,
                            ease: 'Back.easeIn',
                            onComplete: () => {
                                // 4) Show revealed pet
                                this.showReveal(result, cfg, onComplete);
                            },
                        });
                    },
                });
            },
        });
    }

    private showReveal(result: RollResult, cfg: { colorHex: string; outlineHex: string; label: string; strokeThickness: number }, onComplete: () => void): void {
        const scene = this.scene;
        const CX = this.cx;
        const CY = this.cy;

        // Grade-specific jackpot SFX — common uses old reveal, rest get escalating arpeggio
        if (result.grade === 'common') {
            this.audio?.playSfx('sfx_reveal', result.isNew ? 1 : 0.4);
        } else {
            const gradeKey = `sfx_grade_${result.grade}` as SfxKey;
            this.audio?.playSfx(gradeKey, result.isNew ? 1 : 0.4);
        }

        // Pet image
        if (this.revealImage) { this.revealImage.destroy(); this.revealImage = null; }
        this.revealImage = scene.add.image(CX, CY - 31, result.pet.imageKey)
            .setScale(0).setDepth(102);

        scene.tweens.add({
            targets: this.revealImage,
            scale: 0.86,
            duration: 300,
            ease: 'Back.easeOut',
        });

        // Name
        this.revealName.setText(t('pet_' + result.pet.id))
            .setColor('#ffffff')
            .setStroke('#000000', UI.STROKE_THICK)
            .setAlpha(1);
        fitText(this.revealName, 350, 27);

        // Odds (replaces grade label)
        this.revealRarity.setText(getOddsString(result.pet.chance))
            .setColor(cfg.colorHex)
            .setStroke(cfg.outlineHex, cfg.strokeThickness || UI.STROKE_MEDIUM)
            .setAlpha(1);

        // Rewards line: [EXP] +25   [COIN] +5 — layout then center
        const expIcon = this.rewardsContainer.getAt(0) as GameObjects.Image;
        const expLabel = this.rewardsContainer.getAt(1) as GameObjects.Text;
        const coinIcon = this.rewardsContainer.getAt(2) as GameObjects.Image;
        const coinLabel = this.rewardsContainer.getAt(3) as GameObjects.Text;

        // Scale EXP icon to 16px height, preserving aspect
        const expTex = this.scene.textures.get('ui_exp_md').getSourceImage();
        const expH = 20;
        const expW = Math.round(expTex.width * (expH / expTex.height));
        expIcon.setDisplaySize(expW, expH);

        expLabel.setText(`+${result.xpGained}`);
        coinLabel.setText(`+${result.coinsGained}`);

        const gap = 4;
        const sep = 15;
        const coinH = 21;
        const totalW = expW + gap + expLabel.width + sep + coinH + gap + coinLabel.width;
        let cx = -totalW / 2;
        expIcon.setX(cx + expW / 2);  cx += expW + gap;
        expLabel.setX(cx);             cx += expLabel.width + sep;
        coinIcon.setX(cx + coinH / 2); cx += coinH + gap;
        coinLabel.setX(cx);
        this.rewardsContainer.setAlpha(1);

        // NEW badge
        if (result.isNew) {
            this.newBadge.setAlpha(1).setScale(0);
            scene.tweens.add({
                targets: this.newBadge,
                scale: 1,
                duration: 300,
                ease: 'Back.easeOut',
            });
        }

        // Hold matched to SFX duration per grade
        const holdTime = GRADE_HOLD_MS[result.grade] ?? 1100;
        scene.time.delayedCall(holdTime, () => {
            // Only fade overlay if nothing is keeping it persistent
            if (!this.autorollOverlayActive && !this.keepOverlay) {
                scene.tweens.add({
                    targets: this.overlay,
                    fillAlpha: 0,
                    duration: 250,
                });
            }

            const fadeTargets: GameObjects.GameObject[] = [this.revealName, this.revealRarity, this.newBadge, this.rewardsContainer];
            if (this.revealImage) fadeTargets.push(this.revealImage);

            scene.tweens.add({
                targets: fadeTargets,
                alpha: 0,
                duration: 250,
                onComplete: () => {
                    if (this.revealImage) { this.revealImage.destroy(); this.revealImage = null; }
                    this.newBadge.setScale(1);
                    onComplete();
                },
            });
        });
    }
    setKeepOverlay(keep: boolean): void {
        this.keepOverlay = keep;
    }

    getOverlay(): GameObjects.Rectangle {
        return this.overlay;
    }

    setAutorollOverlay(active: boolean): void {
        this.autorollOverlayActive = active;
        this.scene.tweens.killTweensOf(this.overlay);
        this.scene.tweens.add({
            targets: this.overlay,
            fillAlpha: active ? 0.6 : 0,
            duration: 300,
        });
    }

    resetToEgg(): void {
        this.overlay.setFillStyle(0x000000, 0);
        this.eggContainer.setAlpha(0);
        this.revealName.setAlpha(0);
        this.revealRarity.setAlpha(0);
        this.newBadge.setAlpha(0).setScale(1);
        this.rewardsContainer.setAlpha(0);
        if (this.revealImage) { this.revealImage.destroy(); this.revealImage = null; }
    }
}
