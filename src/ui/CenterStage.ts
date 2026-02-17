import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRADE, getGradeForChance, UI, PEDESTAL, PET_OFFSET_Y, getOddsString } from '../core/config';
import { PetDef, RollResult } from '../types';
import { AudioSystem } from '../systems/AudioSystem';
import { IdleWobbleFX } from './IdleWobbleFX';
import { t } from '../data/locales';

const CX = GAME_WIDTH / 2;
const CY = GAME_HEIGHT / 2;

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

    // Roll overlay elements
    private overlay: GameObjects.Rectangle;
    private eggContainer: GameObjects.Container;
    private egg: GameObjects.Image;
    private revealImage: GameObjects.Image | null = null;
    private revealName: GameObjects.Text;
    private revealRarity: GameObjects.Text;
    private newBadge: GameObjects.Text;
    private xpText: GameObjects.Text;

    constructor(scene: Scene) {
        super(scene, 0, 0);

        const positions = [PEDESTAL.first, PEDESTAL.second, PEDESTAL.third];

        // Create 3 pedestal slots
        for (let i = 0; i < 3; i++) {
            const pos = positions[i];

            const nameText = scene.add.text(pos.x, pos.y + PET_OFFSET_Y - 92, '', {
                fontFamily: UI.FONT_MAIN,
                fontSize: '18px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: UI.STROKE_THICK,
            }).setOrigin(0.5).setAlpha(0);
            this.add(nameText);

            const oddsText = scene.add.text(pos.x, pos.y + PET_OFFSET_Y - 74, '', {
                fontFamily: UI.FONT_MAIN,
                fontSize: '13px',
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: UI.STROKE_MEDIUM,
            }).setOrigin(0.5).setAlpha(0);
            this.add(oddsText);

            this.slots.push({ shadow: null, image: null, nameText, oddsText });
        }

        // --- ROLL OVERLAY (all hidden initially, rendered on top) ---

        // Dark overlay
        this.overlay = scene.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
            .setDepth(100);

        // Egg container
        this.eggContainer = scene.add.container(CX, CY).setAlpha(0).setDepth(101);
        this.egg = scene.add.image(0, 0, 'egg_1').setDisplaySize(240, 240);
        this.eggContainer.add(this.egg);

        // Reveal elements (on top of overlay)
        this.revealName = scene.add.text(CX, CY + 65, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5).setAlpha(0).setDepth(103);

        this.revealRarity = scene.add.text(CX, CY + 90, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5).setAlpha(0).setDepth(103);

        this.newBadge = scene.add.text(CX, CY - 135, t('new_pet'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '26px',
            color: '#ffc107',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5).setAlpha(0).setDepth(103);

        this.xpText = scene.add.text(CX, CY + 115, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5).setAlpha(0).setDepth(103);

        scene.add.existing(this);
    }

    setAudio(audio: AudioSystem): void {
        this.audio = audio;
    }

    setEggImage(key: string): void {
        this.egg.setTexture(key);
    }

    updatePedestals(topPets: PetDef[]): void {
        const positions = [PEDESTAL.first, PEDESTAL.second, PEDESTAL.third];

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
                const sw = 92 * pos.scale;
                const sh = 20 * pos.scale;
                const sx = pos.x;
                const sy = pos.y + PET_OFFSET_Y + 3;
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
                slot.nameText.setText(pet.name)
                    .setPosition(pos.x, topY - 38)
                    .setColor('#ffffff')
                    .setStroke('#000000', UI.STROKE_THICK)
                    .setAlpha(1);

                slot.oddsText.setText(getOddsString(pet.chance))
                    .setPosition(pos.x, topY - 20)
                    .setColor(cfg.colorHex)
                    .setStroke(cfg.outlineHex, cfg.strokeThickness || 0)
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
                    x: CX - 5,
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

    private showReveal(result: RollResult, cfg: { colorHex: string; outlineHex: string; label: string }, onComplete: () => void): void {
        const scene = this.scene;

        // Reveal SFX — loud for new pets, quiet for duplicates
        if (result.isNew) {
            this.audio?.playSfx('sfx_new_pet');
        } else {
            this.audio?.playSfx('sfx_reveal', 0.4);
        }

        // Pet image
        if (this.revealImage) { this.revealImage.destroy(); this.revealImage = null; }
        this.revealImage = scene.add.image(CX, CY - 25, result.pet.imageKey)
            .setScale(0).setDepth(102);

        scene.tweens.add({
            targets: this.revealImage,
            scale: 0.7,
            duration: 300,
            ease: 'Back.easeOut',
        });

        // Name
        this.revealName.setText(result.pet.name)
            .setColor('#ffffff')
            .setStroke('#000000', UI.STROKE_THICK)
            .setAlpha(1);

        // Grade label
        this.revealRarity.setText(t(`grade_${result.grade}`))
            .setColor(cfg.colorHex)
            .setStroke(cfg.outlineHex, cfg.strokeThickness || UI.STROKE_MEDIUM)
            .setAlpha(1);

        // XP
        const xpColor = result.isNew ? '#ffc107' : '#aaaaaa';
        this.xpText.setText(`+${result.xpGained} XP`)
            .setColor(xpColor)
            .setAlpha(1);

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

        // 5) Hold, then fade out reveal elements (shorter hold during autoroll)
        const holdTime = this.autorollOverlayActive ? 400 : 900;
        scene.time.delayedCall(holdTime, () => {
            // Only fade overlay if autoroll is NOT keeping it persistent
            if (!this.autorollOverlayActive) {
                scene.tweens.add({
                    targets: this.overlay,
                    fillAlpha: 0,
                    duration: 250,
                });
            }

            const fadeTargets = [this.revealName, this.revealRarity, this.newBadge, this.xpText];
            if (this.revealImage) fadeTargets.push(this.revealImage as any);

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
        this.xpText.setAlpha(0);
        if (this.revealImage) { this.revealImage.destroy(); this.revealImage = null; }
    }
}
