import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI } from '../core/config';
import { getMilestones, Milestone } from '../data/milestones';
import { Button } from '../ui/components/Button';
import { t } from '../data/locales';
import { GameManager } from '../core/GameManager';

const HEADER_H = 62;
const TRACK_Y = Math.round(GAME_HEIGHT * 0.55);
const TRACK_H = 12;
const MILESTONE_GAP = 321;
const FIRST_X = 173;

const EGG_R = 76;
const COIN_R = 62;
const RING_COLOR = 0xffc107;
const RING_GRAY = 0x555566;
const FILL_COLOR = 0x1a1a2e;

export class ProgressionScene extends Scene {
    private trackContainer!: Phaser.GameObjects.Container;
    private scrollOffset = 0;
    private maxScroll = 0;

    constructor() {
        super('ProgressionScene');
    }

    create(): void {
        const manager = this.registry.get('gameManager') as GameManager;
        const playerLevel = manager.progression.level;
        const milestones = getMilestones(playerLevel);

        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);

        this.trackContainer = this.add.container(0, 0);
        const maskGfx = this.make.graphics({});
        maskGfx.fillRect(0, HEADER_H, GAME_WIDTH, GAME_HEIGHT - HEADER_H);
        this.trackContainer.setMask(maskGfx.createGeometryMask());

        this.buildTrack(milestones, playerLevel);
        this.createHeader();
        this.setupScroll();
        this.setInitialScroll(milestones, playerLevel);
    }

    private createHeader(): void {
        const hdr = this.add.graphics();
        hdr.fillStyle(0x000000, 0.5);
        hdr.fillRect(0, 0, GAME_WIDTH, HEADER_H);
        hdr.lineStyle(1, UI.PANEL_BORDER, 0.3);
        hdr.lineBetween(0, HEADER_H, GAME_WIDTH, HEADER_H);
        hdr.setDepth(10);

        new Button(this, 68, 31, 111, 39, `← ${t('progression_back')}`, 0x444455, () => {
            this.scene.start('MainScene');
        });

        const title = this.add.text(GAME_WIDTH / 2, 31, t('progression_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '23px',
            color: '#ffffff', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5).setDepth(10);
    }

    private buildTrack(milestones: Milestone[], playerLevel: number): void {
        const totalW = FIRST_X + milestones.length * MILESTONE_GAP;

        let transitionX = FIRST_X;
        for (let i = 0; i < milestones.length; i++) {
            if (milestones[i].level <= playerLevel) {
                transitionX = FIRST_X + i * MILESTONE_GAP;
            }
        }

        const trackGfx = this.add.graphics();
        trackGfx.fillStyle(RING_COLOR, 1);
        trackGfx.fillRect(FIRST_X - 37, TRACK_Y - TRACK_H / 2, transitionX - FIRST_X + 37, TRACK_H);
        trackGfx.fillStyle(0x444455, 1);
        trackGfx.fillRect(transitionX, TRACK_Y - TRACK_H / 2, totalW - transitionX + 74, TRACK_H);
        this.trackContainer.add(trackGfx);

        for (let i = 0; i < milestones.length; i++) {
            const m = milestones[i];
            const x = FIRST_X + i * MILESTONE_GAP;
            const reached = m.level <= playerLevel;
            this.drawMilestone(x, m, reached);
        }

        this.maxScroll = Math.max(0, totalW - GAME_WIDTH + 99);
    }

    private drawMilestone(x: number, m: Milestone, reached: boolean): void {
        const isEgg = m.type === 'egg';
        const r = isEgg ? EGG_R : COIN_R;
        const ringColor = reached ? RING_COLOR : RING_GRAY;

        // Circle background + rings
        const gfx = this.add.graphics();
        gfx.fillStyle(FILL_COLOR, 0.95);
        gfx.fillCircle(x, TRACK_Y, r);
        gfx.lineStyle(4, ringColor, 1);
        gfx.strokeCircle(x, TRACK_Y, r);
        if (isEgg) {
            gfx.lineStyle(3, ringColor, 0.6);
            gfx.strokeCircle(x, TRACK_Y, r - 8);
        }
        this.trackContainer.add(gfx);

        // Icon inside circle — large, fills most of the circle
        if (isEgg && m.eggKey) {
            const eggSize = r * 1.7;
            const icon = this.add.image(x, TRACK_Y, m.eggKey)
                .setDisplaySize(eggSize, eggSize);
            if (!reached) this.applyGrayscale(icon);
            this.trackContainer.add(icon);
        } else {
            const coinSize = r * 1.3;
            const icon = this.add.image(x, TRACK_Y, 'ui_coin_lg')
                .setDisplaySize(coinSize, coinSize);
            if (!reached) this.applyGrayscale(icon);
            this.trackContainer.add(icon);
        }

        // Level number above
        this.trackContainer.add(this.add.text(x, TRACK_Y - r - 27, `${m.level}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '35px',
            color: reached ? '#ffffff' : '#777777',
            stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5));

        // Label below circle
        const labelY = TRACK_Y + r + 17;
        if (isEgg) {
            this.trackContainer.add(this.add.text(x, labelY, t('progression_new_egg'), {
                fontFamily: UI.FONT_STROKE, fontSize: '20px',
                color: reached ? '#ffffff' : '#777777',
                stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
            }).setOrigin(0.5));

            if (m.eggMinOdds) {
                this.trackContainer.add(this.add.text(x, labelY + 27,
                    t('egg_effect', { odds: m.eggMinOdds }), {
                        fontFamily: UI.FONT_BODY, fontSize: '15px',
                        color: reached ? '#aaaaaa' : '#555555',
                        stroke: '#000000', strokeThickness: 1,
                    }).setOrigin(0.5));
            }
        } else {
            this.trackContainer.add(this.add.text(x, labelY, `+${m.coinAmount}`, {
                fontFamily: UI.FONT_STROKE, fontSize: '20px',
                color: reached ? '#ffc107' : '#777777',
                stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
            }).setOrigin(0.5));
        }
    }

    private applyGrayscale(image: Phaser.GameObjects.Image): void {
        if (image.preFX) {
            image.preFX.addColorMatrix().grayscale(1);
        } else {
            image.setTint(0x555555);
        }
    }

    private setInitialScroll(milestones: Milestone[], playerLevel: number): void {
        // Anchor on the last reached milestone (any type — egg or coins)
        let lastReachedIdx = 0;
        for (let i = 0; i < milestones.length; i++) {
            if (milestones[i].level <= playerLevel) lastReachedIdx = i;
        }

        // Position so the last reached milestone is ~20% from left
        const targetX = FIRST_X + lastReachedIdx * MILESTONE_GAP;
        this.scrollOffset = Math.max(0, targetX - GAME_WIDTH * 0.20);
        this.clampScroll();
    }

    private setupScroll(): void {
        this.input.on('wheel', (
            _p: Phaser.Input.Pointer,
            _go: Phaser.GameObjects.GameObject[],
            _dx: number,
            dy: number,
        ) => {
            this.scrollOffset += dy * 0.8;
            this.clampScroll();
        });

        let dragX = 0;
        let startOff = 0;

        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.y > HEADER_H) { dragX = p.x; startOff = this.scrollOffset; }
        });
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (p.isDown && dragX > 0) {
                this.scrollOffset = startOff - (p.x - dragX);
                this.clampScroll();
            }
        });
        this.input.on('pointerup', () => { dragX = 0; });
    }

    private clampScroll(): void {
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.maxScroll);
        this.trackContainer.x = -this.scrollOffset;
    }
}
