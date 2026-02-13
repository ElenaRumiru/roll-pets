import { GameObjects, Scene } from 'phaser';
import { PetDef } from '../types';
import { RARITY, UI } from '../core/config';

const CARD_W = 72;
const CARD_H = 82;

export class PetCard extends GameObjects.Container {
    constructor(scene: Scene, x: number, y: number, pet: PetDef, found: boolean) {
        super(scene, x, y);

        const cfg = RARITY[pet.rarity];
        const r = 8;

        // Card background with rounded corners
        const bg = scene.add.graphics();
        if (found) {
            bg.fillStyle(0x2a2a3e, 1);
            bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
            bg.lineStyle(2, cfg.color, 0.8);
            bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);

            bg.fillStyle(cfg.color, 0.1);
            bg.fillRoundedRect(-CARD_W / 2 + 1, -CARD_H / 2 + 1, CARD_W - 2, CARD_H * 0.4,
                { tl: r - 1, tr: r - 1, bl: 0, br: 0 });
        } else {
            bg.fillStyle(0x15152a, 1);
            bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
            bg.lineStyle(1, 0x333344, 0.5);
            bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
        }
        this.add(bg);

        // Pet image or silhouette "?"
        if (found) {
            const img = scene.add.image(0, -8, pet.imageKey).setScale(0.28);
            this.add(img);
        } else {
            const qmark = scene.add.text(0, -12, '?', {
                fontSize: '24px',
                color: '#333344',
            }).setOrigin(0.5);
            this.add(qmark);
        }

        // Name with rarity color + stroke (or ??? for unknown)
        if (found) {
            const name = scene.add.text(0, 24, pet.name, {
                fontFamily: UI.FONT_MAIN,
                fontSize: '9px',
                color: cfg.colorHex,
                stroke: cfg.outlineHex,
                strokeThickness: UI.STROKE_THIN,
            }).setOrigin(0.5);
            this.add(name);
        } else {
            const unknown = scene.add.text(0, 24, '???', {
                fontFamily: UI.FONT_BODY,
                fontSize: '9px',
                color: '#333344',
            }).setOrigin(0.5);
            this.add(unknown);
        }

        // Rarity dot (found pets only)
        if (found) {
            const dotG = scene.add.graphics();
            dotG.fillStyle(cfg.color, 1);
            dotG.fillCircle(CARD_W / 2 - 10, -CARD_H / 2 + 10, 4);
            dotG.lineStyle(1, 0x000000, 0.3);
            dotG.strokeCircle(CARD_W / 2 - 10, -CARD_H / 2 + 10, 4);
            this.add(dotG);
        }

        scene.add.existing(this);
    }
}
