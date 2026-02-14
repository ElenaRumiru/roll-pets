import { GameObjects, Scene } from 'phaser';
import { UI, RARITY, RARITY_ORDER } from '../core/config';
import { PETS, TOTAL_PETS } from '../data/pets';
import { t } from '../data/locales';

const PANEL_W = 140;
const PANEL_H = 220;
const BAR_W = 118;
const BAR_H = 12;
const ROW_GAP = 32;

export class CollectionButton extends GameObjects.Container {
    private countText: GameObjects.Text;
    private barFills: GameObjects.Graphics[] = [];
    private barTexts: GameObjects.Text[] = [];
    private totals: Record<string, number> = {};

    constructor(scene: Scene, onClick: () => void) {
        super(scene, 78, 195);

        for (const r of RARITY_ORDER) {
            this.totals[r] = PETS.filter(p => p.rarity === r).length;
        }

        // Panel background
        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.65);
        bg.fillRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 12);
        bg.lineStyle(2, UI.PANEL_BORDER, 0.5);
        bg.strokeRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 12);
        this.add(bg);

        // Title
        const title = scene.add.text(0, -90, t('collection_button'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        this.add(title);

        // Total count
        this.countText = scene.add.text(0, -70, `0/${TOTAL_PETS}`, {
            fontFamily: UI.FONT_MAIN,
            fontSize: '16px',
            color: UI.ACCENT_ORANGE_HEX,
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add(this.countText);

        // Rarity progress bars
        RARITY_ORDER.forEach((rarity, i) => {
            const cfg = RARITY[rarity];
            const rowY = -44 + i * ROW_GAP;

            // Rarity label (left)
            const lbl = scene.add.text(-BAR_W / 2, rowY, t(`rarity_${rarity}`), {
                fontFamily: UI.FONT_MAIN,
                fontSize: '11px',
                color: cfg.colorHex,
            }).setOrigin(0, 0.5);
            this.add(lbl);

            // Count text (right)
            const cnt = scene.add.text(BAR_W / 2, rowY, `0/${this.totals[rarity]}`, {
                fontFamily: UI.FONT_MAIN,
                fontSize: '11px',
                color: '#dddddd',
            }).setOrigin(1, 0.5);
            this.add(cnt);
            this.barTexts.push(cnt);

            // Bar background
            const barBg = scene.add.graphics();
            barBg.fillStyle(0x1a1a2e, 0.9);
            barBg.fillRoundedRect(-BAR_W / 2, rowY + 8, BAR_W, BAR_H, 5);
            barBg.lineStyle(1, 0x444466, 0.4);
            barBg.strokeRoundedRect(-BAR_W / 2, rowY + 8, BAR_W, BAR_H, 5);
            this.add(barBg);

            // Bar fill (updated dynamically)
            const barFill = scene.add.graphics();
            this.add(barFill);
            this.barFills.push(barFill);
        });

        this.setSize(PANEL_W, PANEL_H);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerdown', onClick);

        scene.add.existing(this);
    }

    updateCount(n: number, collection?: Set<string>): void {
        this.countText.setText(`${n}/${TOTAL_PETS}`);
        if (!collection) return;

        RARITY_ORDER.forEach((rarity, i) => {
            const total = this.totals[rarity];
            const have = PETS.filter(p => p.rarity === rarity && collection.has(p.id)).length;
            const pct = total > 0 ? have / total : 0;
            const cfg = RARITY[rarity];
            const rowY = -44 + i * ROW_GAP;

            this.barTexts[i].setText(`${have}/${total}`);

            const fill = this.barFills[i];
            fill.clear();
            if (pct > 0) {
                fill.fillStyle(cfg.color, 0.9);
                fill.fillRoundedRect(
                    -BAR_W / 2, rowY + 8,
                    Math.max(8, BAR_W * pct), BAR_H, 5,
                );
            }
        });
    }
}
