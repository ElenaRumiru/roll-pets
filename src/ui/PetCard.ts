import { GameObjects, Scene } from 'phaser';
import { PetDef } from '../types';
import { GRADE, getGradeForChance, getOddsString, UI } from '../core/config';

const CARD_W = 88;
const CARD_H = 100;

export class PetCard extends GameObjects.Container {
    constructor(scene: Scene, x: number, y: number, pet: PetDef, found: boolean, isNew = false) {
        super(scene, x, y);

        const cfg = GRADE[getGradeForChance(pet.chance)];
        const r = 10;

        // Card background
        const bg = scene.add.graphics();
        if (found) {
            bg.fillStyle(0x2a2a3e, 1);
            bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
            bg.lineStyle(2, cfg.color, 0.8);
            bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
            bg.fillStyle(cfg.color, 0.1);
            bg.fillRoundedRect(-CARD_W / 2 + 1, -CARD_H / 2 + 1, CARD_W - 2, CARD_H * 0.35,
                { tl: r - 1, tr: r - 1, bl: 0, br: 0 });
        } else {
            bg.fillStyle(0x15152a, 1);
            bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
            bg.lineStyle(1, 0x333344, 0.5);
            bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
        }
        this.add(bg);

        // Pet image or question mark
        if (found) {
            const img = scene.add.image(0, -14, pet.imageKey).setScale(0.30);
            this.add(img);

            if (isNew) {
                const newBadge = scene.add.text(CARD_W / 2 - 8, -CARD_H / 2 + 6, 'NEW', {
                    fontFamily: UI.FONT_MAIN,
                    fontSize: '9px',
                    color: '#ffc107',
                    stroke: '#000000',
                    strokeThickness: 2,
                }).setOrigin(0.5);
                this.add(newBadge);
            }
        } else {
            const qmark = scene.add.text(0, -14, '?', {
                fontFamily: UI.FONT_MAIN,
                fontSize: '28px',
                color: '#333344',
            }).setOrigin(0.5);
            this.add(qmark);
        }

        // Name + grade at bottom of card
        const nameText = scene.add.text(0, CARD_H / 2 - 24, found ? pet.name : '???', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '11px',
            color: found ? '#ffffff' : '#333344',
        }).setOrigin(0.5);
        this.add(nameText);

        const oddsText = scene.add.text(0, CARD_H / 2 - 11, found ? getOddsString(pet.chance) : '???', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '9px',
            color: found ? cfg.colorHex : '#333344',
        }).setOrigin(0.5);
        this.add(oddsText);

        scene.add.existing(this);
    }
}
