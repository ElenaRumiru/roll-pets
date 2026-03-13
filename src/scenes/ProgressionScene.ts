import { Scene } from 'phaser';
import { UI } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait, LANDSCAPE_W, LANDSCAPE_H } from '../core/orientation';
import { getMilestones, Milestone } from '../data/milestones';
import { t } from '../data/locales';
import { GameManager } from '../core/GameManager';
import { fitText } from '../ui/components/fitText';
import { createSceneHeader } from '../ui/SceneHeader';

const HEADER_H = 74;
const TRACK_H = 12;
const MILESTONE_GAP = 273;
const MILESTONE_GAP_P = 232;
const FIRST_OFFSET = 173;

const EGG_R = 76;
const COIN_R = 62;
const RING_COLOR = 0xffc107;
const RING_GRAY = 0x555566;
const FILL_COLOR = 0x1a1a2e;

/* Landscape constants (unchanged from original) */
const L_TRACK_Y = Math.round(LANDSCAPE_H * 0.55);

export class ProgressionScene extends Scene {
    private manager!: GameManager;
    private trackContainer!: Phaser.GameObjects.Container;
    private scrollOffset = 0;
    private maxScroll = 0;

    constructor() {
        super('ProgressionScene');
    }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        const manager = this.manager;
        const playerLevel = manager.progression.level;
        const milestones = getMilestones(playerLevel, manager.getRebirthCount());
        const gw = getGameWidth();
        const gh = getGameHeight();

        this.add.rectangle(gw / 2, gh / 2, gw, gh, 0x12121e);

        this.trackContainer = this.add.container(0, 0);
        const maskGfx = this.make.graphics({});
        maskGfx.fillRect(0, HEADER_H, gw, gh - HEADER_H);
        this.trackContainer.setMask(maskGfx.createGeometryMask());

        this.buildTrack(milestones, playerLevel);
        createSceneHeader({
            scene: this, titleKey: 'progression_title', backKey: 'progression_back',
            onBack: () => this.scene.start('MainScene'),
            coins: manager.progression.coins, depth: 10,
        });
        this.setupScroll();
        this.setInitialScroll(milestones, playerLevel);
    }

    private buildTrack(milestones: Milestone[], playerLevel: number): void {
        const port = isPortrait();
        const n = milestones.length;

        let lastReachedIdx = 0;
        for (let i = 0; i < n; i++) {
            if (milestones[i].level <= playerLevel) lastReachedIdx = i;
        }

        const trackGfx = this.add.graphics();

        if (port) {
            const gw = getGameWidth();
            const gh = getGameHeight();
            const trackX = Math.round(gw * 0.42);
            const totalH = FIRST_OFFSET + (n - 1) * MILESTONE_GAP_P + FIRST_OFFSET;

            /* Milestone positions: bottom-to-top in container space */
            const transitionY = totalH - FIRST_OFFSET - lastReachedIdx * MILESTONE_GAP_P;
            const topY = totalH - FIRST_OFFSET - (n - 1) * MILESTONE_GAP_P;
            const bottomY = totalH - FIRST_OFFSET;

            /* Gold bar: from bottom to transition */
            trackGfx.fillStyle(RING_COLOR, 1);
            trackGfx.fillRect(trackX - TRACK_H / 2, transitionY, TRACK_H, bottomY - transitionY + 37);
            /* Gray bar: from transition to top */
            trackGfx.fillStyle(0x444455, 1);
            trackGfx.fillRect(trackX - TRACK_H / 2, topY - 37, TRACK_H, transitionY - topY + 37);
            this.trackContainer.add(trackGfx);

            for (let i = 0; i < n; i++) {
                const m = milestones[i];
                const my = totalH - FIRST_OFFSET - i * MILESTONE_GAP_P;
                const reached = m.level <= playerLevel;
                this.drawMilestonePortrait(trackX, my, m, reached);
            }

            this.maxScroll = Math.max(0, totalH - (gh - HEADER_H) + 60);
        } else {
            const totalW = FIRST_OFFSET + n * MILESTONE_GAP;
            let transitionX = FIRST_OFFSET;
            for (let i = 0; i < n; i++) {
                if (milestones[i].level <= playerLevel) {
                    transitionX = FIRST_OFFSET + i * MILESTONE_GAP;
                }
            }

            trackGfx.fillStyle(RING_COLOR, 1);
            trackGfx.fillRect(FIRST_OFFSET - 37, L_TRACK_Y - TRACK_H / 2, transitionX - FIRST_OFFSET + 37, TRACK_H);
            trackGfx.fillStyle(0x444455, 1);
            trackGfx.fillRect(transitionX, L_TRACK_Y - TRACK_H / 2, totalW - transitionX + 74, TRACK_H);
            this.trackContainer.add(trackGfx);

            for (let i = 0; i < n; i++) {
                const m = milestones[i];
                const x = FIRST_OFFSET + i * MILESTONE_GAP;
                const reached = m.level <= playerLevel;
                this.drawMilestoneLandscape(x, m, reached);
            }

            this.maxScroll = Math.max(0, totalW - LANDSCAPE_W + 99);
        }
    }

    /* ─── Landscape milestone (original layout) ─── */
    private drawMilestoneLandscape(x: number, m: Milestone, reached: boolean): void {
        const cy = L_TRACK_Y;
        const isEgg = m.type === 'egg';
        const isFeature = m.type === 'feature';
        const r = (isEgg || isFeature) ? EGG_R : COIN_R;
        const ringColor = reached ? RING_COLOR : RING_GRAY;

        const gfx = this.add.graphics();
        gfx.fillStyle(FILL_COLOR, 0.95);
        gfx.fillCircle(x, cy, r);
        gfx.lineStyle(4, ringColor, 1);
        gfx.strokeCircle(x, cy, r);
        if (isEgg || isFeature) {
            gfx.lineStyle(3, ringColor, 0.6);
            gfx.strokeCircle(x, cy, r - 8);
        }
        this.trackContainer.add(gfx);

        const fInfo = this.getFeatureInfo(m, isFeature);
        this.drawIcon(x, cy, r, m, isEgg, isFeature, fInfo, reached);

        // Level number above
        this.trackContainer.add(this.add.text(x, cy - r - 27, `${m.level}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '35px',
            color: reached ? '#ffffff' : '#777777',
            stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5));

        // Label below circle
        const labelY = cy + r + 17;
        this.drawLabelsBelow(x, labelY, m, isEgg, isFeature, fInfo, reached);
    }

    /* ─── Portrait milestone (vertical layout) ─── */
    private drawMilestonePortrait(cx: number, cy: number, m: Milestone, reached: boolean): void {
        const isEgg = m.type === 'egg';
        const isFeature = m.type === 'feature';
        const r = (isEgg || isFeature) ? EGG_R : COIN_R;
        const ringColor = reached ? RING_COLOR : RING_GRAY;

        const gfx = this.add.graphics();
        gfx.fillStyle(FILL_COLOR, 0.95);
        gfx.fillCircle(cx, cy, r);
        gfx.lineStyle(4, ringColor, 1);
        gfx.strokeCircle(cx, cy, r);
        if (isEgg || isFeature) {
            gfx.lineStyle(3, ringColor, 0.6);
            gfx.strokeCircle(cx, cy, r - 8);
        }
        this.trackContainer.add(gfx);

        const fInfo = this.getFeatureInfo(m, isFeature);
        this.drawIcon(cx, cy, r, m, isEgg, isFeature, fInfo, reached);

        // Level number LEFT of circle
        this.trackContainer.add(this.add.text(cx - r - 15, cy, `${m.level}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '35px',
            color: reached ? '#ffffff' : '#777777',
            stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(1, 0.5));

        // Labels RIGHT of circle
        const labelX = cx + r + 15;
        this.drawLabelsRight(labelX, cy, m, isEgg, isFeature, fInfo, reached);
    }

    /* ─── Shared helpers ─── */
    private getFeatureInfo(m: Milestone, isFeature: boolean) {
        const featureMap: Record<string, { iconKey: string; nameKey: string; descKey: string }> = {
            autoroll:   { iconKey: 'ui_automod_on', nameKey: 'feature_autoroll', descKey: 'autoroll_hint' },
            incubation: { iconKey: 'ui_nests_btn', nameKey: 'feature_incubation', descKey: 'nests_hint' },
            rebirth:    { iconKey: 'ui_rebirth_md', nameKey: 'feature_rebirth', descKey: 'rebirth_hint' },
        };
        return isFeature ? featureMap[m.featureKey ?? 'incubation'] : null;
    }

    private drawIcon(
        x: number, y: number, r: number, m: Milestone,
        isEgg: boolean, isFeature: boolean,
        fInfo: { iconKey: string } | null, reached: boolean,
    ): void {
        if (isFeature && fInfo) {
            const src = this.textures.get(fInfo.iconKey).getSourceImage();
            const iconW = r * 1.5;
            const iconH = Math.round(iconW * src.height / src.width);
            const icon = this.add.image(x, y, fInfo.iconKey).setDisplaySize(iconW, iconH);
            if (!reached) this.applyGrayscale(icon);
            this.trackContainer.add(icon);
        } else if (isEgg && m.eggKey) {
            const eggSize = r * 1.7;
            const icon = this.add.image(x, y, `${m.eggKey}_sm`).setDisplaySize(eggSize, eggSize);
            if (!reached) this.applyGrayscale(icon);
            this.trackContainer.add(icon);
        } else {
            const coinSize = r * 1.3;
            const icon = this.add.image(x, y, 'ui_coin_lg').setDisplaySize(coinSize, coinSize);
            if (!reached) this.applyGrayscale(icon);
            this.trackContainer.add(icon);
        }
    }

    /* Labels below circle — landscape */
    private drawLabelsBelow(
        x: number, labelY: number, m: Milestone,
        isEgg: boolean, isFeature: boolean,
        fInfo: { nameKey: string; descKey: string } | null, reached: boolean,
    ): void {
        if (isFeature && fInfo) {
            const nameText = this.add.text(x, labelY, t(fInfo.nameKey), {
                fontFamily: UI.FONT_STROKE, fontSize: '20px',
                color: reached ? '#ffffff' : '#777777',
                stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
            }).setOrigin(0.5);
            fitText(nameText, 180, 20);
            this.trackContainer.add(nameText);

            this.trackContainer.add(this.add.text(x, labelY + 22, t(fInfo.descKey), {
                fontFamily: UI.FONT_BODY, fontSize: '15px',
                color: reached ? '#aaaaaa' : '#555555',
                stroke: '#000000', strokeThickness: 1,
                wordWrap: { width: 180 }, align: 'center',
            }).setOrigin(0.5, 0));
        } else if (isEgg) {
            const eggName = m.eggNameKey ? t(m.eggNameKey) : t('progression_new_egg');
            const nameText = this.add.text(x, labelY, eggName, {
                fontFamily: UI.FONT_STROKE, fontSize: '20px',
                color: reached ? '#ffffff' : '#777777',
                stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
            }).setOrigin(0.5);
            fitText(nameText, 180, 20);
            this.trackContainer.add(nameText);

            if (m.eggMinOdds) {
                this.trackContainer.add(this.add.text(x, labelY + 27,
                    t('egg_effect', { odds: m.eggMinOdds }), {
                        fontFamily: UI.FONT_BODY, fontSize: '14px',
                        color: reached ? '#aaaaaa' : '#555555',
                        stroke: '#000000', strokeThickness: 1,
                    }).setOrigin(0.5));
            }
            if (m.eggBuffLabel && m.eggIncubationLabel) {
                this.trackContainer.add(this.add.text(x, labelY + 48,
                    t('egg_incubation_info', { buff: m.eggBuffLabel, time: m.eggIncubationLabel }), {
                        fontFamily: UI.FONT_BODY, fontSize: '14px',
                        color: reached ? '#78C828' : '#555555',
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

    /* Labels right of circle — portrait */
    private drawLabelsRight(
        labelX: number, cy: number, m: Milestone,
        isEgg: boolean, isFeature: boolean,
        fInfo: { nameKey: string; descKey: string } | null, reached: boolean,
    ): void {
        const maxW = getGameWidth() - labelX - 15;
        if (isFeature && fInfo) {
            const nameText = this.add.text(labelX, cy - 10, t(fInfo.nameKey), {
                fontFamily: UI.FONT_STROKE, fontSize: '20px',
                color: reached ? '#ffffff' : '#777777',
                stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
            }).setOrigin(0, 0.5);
            fitText(nameText, maxW, 20);
            this.trackContainer.add(nameText);

            this.trackContainer.add(this.add.text(labelX, cy + 16, t(fInfo.descKey), {
                fontFamily: UI.FONT_BODY, fontSize: '15px',
                color: reached ? '#aaaaaa' : '#555555',
                stroke: '#000000', strokeThickness: 1,
                wordWrap: { width: maxW },
            }).setOrigin(0, 0));
        } else if (isEgg) {
            const eggName = m.eggNameKey ? t(m.eggNameKey) : t('progression_new_egg');
            let topY = cy - 20;
            const nameText = this.add.text(labelX, topY, eggName, {
                fontFamily: UI.FONT_STROKE, fontSize: '20px',
                color: reached ? '#ffffff' : '#777777',
                stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
            }).setOrigin(0, 0.5);
            fitText(nameText, maxW, 20);
            this.trackContainer.add(nameText);

            if (m.eggMinOdds) {
                topY += 22;
                this.trackContainer.add(this.add.text(labelX, topY,
                    t('egg_effect', { odds: m.eggMinOdds }), {
                        fontFamily: UI.FONT_BODY, fontSize: '14px',
                        color: reached ? '#aaaaaa' : '#555555',
                        stroke: '#000000', strokeThickness: 1,
                        wordWrap: { width: maxW },
                    }).setOrigin(0, 0.5));
            }
            if (m.eggBuffLabel && m.eggIncubationLabel) {
                topY += 22;
                this.trackContainer.add(this.add.text(labelX, topY,
                    t('egg_incubation_info', { buff: m.eggBuffLabel, time: m.eggIncubationLabel }), {
                        fontFamily: UI.FONT_BODY, fontSize: '14px',
                        color: reached ? '#78C828' : '#555555',
                        stroke: '#000000', strokeThickness: 1,
                        wordWrap: { width: maxW },
                    }).setOrigin(0, 0.5));
            }
        } else {
            this.trackContainer.add(this.add.text(labelX, cy, `+${m.coinAmount}`, {
                fontFamily: UI.FONT_STROKE, fontSize: '20px',
                color: reached ? '#ffc107' : '#777777',
                stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
            }).setOrigin(0, 0.5));
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
        let lastReachedIdx = 0;
        for (let i = 0; i < milestones.length; i++) {
            if (milestones[i].level <= playerLevel) lastReachedIdx = i;
        }

        if (isPortrait()) {
            const gh = getGameHeight();
            const n = milestones.length;
            const totalH = FIRST_OFFSET + (n - 1) * MILESTONE_GAP_P + FIRST_OFFSET;
            const targetY = totalH - FIRST_OFFSET - lastReachedIdx * MILESTONE_GAP_P;
            this.scrollOffset = Math.max(0, targetY - (gh - HEADER_H) * 0.80);
        } else {
            const targetX = FIRST_OFFSET + lastReachedIdx * MILESTONE_GAP;
            this.scrollOffset = Math.max(0, targetX - LANDSCAPE_W * 0.20);
        }
        this.clampScroll();
    }

    private setupScroll(): void {
        const port = isPortrait();

        this.input.on('wheel', (
            _p: Phaser.Input.Pointer,
            _go: Phaser.GameObjects.GameObject[],
            _dx: number,
            dy: number,
        ) => {
            this.scrollOffset += dy * 0.8;
            this.clampScroll();
        });

        let dragStart = 0;
        let startOff = 0;

        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.y > HEADER_H) {
                dragStart = port ? p.y : p.x;
                startOff = this.scrollOffset;
            }
        });
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (p.isDown && dragStart > 0) {
                const delta = port ? (p.y - dragStart) : (p.x - dragStart);
                this.scrollOffset = startOff - delta;
                this.clampScroll();
            }
        });
        this.input.on('pointerup', () => { dragStart = 0; });
    }

    private clampScroll(): void {
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.maxScroll);
        if (isPortrait()) {
            this.trackContainer.y = -this.scrollOffset;
        } else {
            this.trackContainer.x = -this.scrollOffset;
        }
    }

    update(_time: number, delta: number): void {
        this.manager.update(delta);
    }
}
