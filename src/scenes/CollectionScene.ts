import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RARITY_ORDER, RARITY, UI } from '../core/config';
import { PETS, TOTAL_PETS } from '../data/pets';
import { SaveSystem } from '../systems/SaveSystem';
import { PetCard } from '../ui/PetCard';
import { Button } from '../ui/components/Button';
import { t } from '../data/locales';
import { Rarity } from '../types';

const GRID_TOP = 135;
const GRID_H = GAME_HEIGHT - GRID_TOP;
const COLS = 8;
const CARD_SX = 100;
const CARD_SY = 112;

export class CollectionScene extends Scene {
    private gridContainer!: Phaser.GameObjects.Container;
    private scrollOffset = 0;
    private maxScroll = 0;
    private collection!: Set<string>;

    constructor() {
        super('CollectionScene');
    }

    create(): void {
        const save = new SaveSystem();
        this.collection = new Set(save.getData().collection);
        this.scrollOffset = 0;

        // Background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);

        // Grid container + mask (created first so header draws on top)
        this.gridContainer = this.add.container(0, 0);
        const maskGfx = this.make.graphics({});
        maskGfx.fillRect(0, GRID_TOP, GAME_WIDTH, GRID_H);
        this.gridContainer.setMask(maskGfx.createGeometryMask());

        this.createHeader();
        this.createFilters();
        this.createRarityBars();
        this.buildGrid('all');
        this.setupScroll();
    }

    private createHeader(): void {
        const hdr = this.add.graphics();
        hdr.fillStyle(0x000000, 0.5);
        hdr.fillRect(0, 0, GAME_WIDTH, GRID_TOP);
        hdr.lineStyle(1, UI.PANEL_BORDER, 0.3);
        hdr.lineBetween(0, GRID_TOP, GAME_WIDTH, GRID_TOP);

        // Back button
        new Button(this, 55, 25, 90, 32, `← ${t('collection_back')}`, 0x444455, () => {
            this.scene.start('MainScene');
        });

        // Title
        this.add.text(GAME_WIDTH / 2, 16, t('collection_title'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);

        // Collected count
        this.add.text(GAME_WIDTH / 2, 42, t('collection_count', {
            current: String(this.collection.size),
            total: String(TOTAL_PETS),
        }), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '13px',
            color: '#aaaaaa',
        }).setOrigin(0.5);
    }

    private createFilters(): void {
        const y = 68;
        const filters: (Rarity | 'all')[] = ['all', ...RARITY_ORDER];
        const btnW = 90;
        const gap = 6;
        const totalW = filters.length * btnW + (filters.length - 1) * gap;
        const startX = GAME_WIDTH / 2 - totalW / 2 + btnW / 2;

        filters.forEach((f, i) => {
            const label = f === 'all' ? t('filter_all') : t(`rarity_${f}`);
            const color = f === 'all' ? 0x444455 : RARITY[f].color;
            new Button(this, startX + i * (btnW + gap), y, btnW, 26, label, color, () => {
                this.scrollOffset = 0;
                this.buildGrid(f);
            });
        });
    }

    private createRarityBars(): void {
        const barY = 100;
        const segW = 145;
        const barW = 120;
        const barH = 8;
        const startX = GAME_WIDTH / 2 - (5 * segW) / 2 + segW / 2;

        RARITY_ORDER.forEach((r, i) => {
            const cx = startX + i * segW;
            const cfg = RARITY[r];
            const total = PETS.filter(p => p.rarity === r).length;
            const have = PETS.filter(p => p.rarity === r && this.collection.has(p.id)).length;

            // Label + count
            this.add.text(cx, barY, `${t(`rarity_${r}`)} ${have}/${total}`, {
                fontFamily: UI.FONT_MAIN,
                fontSize: '10px',
                color: cfg.colorHex,
            }).setOrigin(0.5);

            // Bar bg
            const bg = this.add.graphics();
            bg.fillStyle(0x1a1a2e, 0.9);
            bg.fillRoundedRect(cx - barW / 2, barY + 9, barW, barH, 3);

            // Bar fill
            const pct = total > 0 ? have / total : 0;
            if (pct > 0) {
                const fill = this.add.graphics();
                fill.fillStyle(cfg.color, 0.9);
                fill.fillRoundedRect(cx - barW / 2, barY + 9, Math.max(4, barW * pct), barH, 3);
            }
        });
    }

    private buildGrid(filter: Rarity | 'all'): void {
        this.gridContainer.removeAll(true);

        const pets = filter === 'all' ? PETS : PETS.filter(p => p.rarity === filter);
        const gridW = COLS * CARD_SX;
        const startX = GAME_WIDTH / 2 - gridW / 2 + CARD_SX / 2;

        pets.forEach((pet, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = startX + col * CARD_SX;
            const y = GRID_TOP + 60 + row * CARD_SY;
            const card = new PetCard(this, x, y, pet, this.collection.has(pet.id));
            this.gridContainer.add(card);
        });

        const rows = Math.ceil(pets.length / COLS);
        const contentH = 60 + rows * CARD_SY;
        this.maxScroll = Math.max(0, contentH - GRID_H);
        this.gridContainer.y = -this.scrollOffset;
    }

    private setupScroll(): void {
        this.input.on('wheel', (
            _p: Phaser.Input.Pointer,
            _go: Phaser.GameObjects.GameObject[],
            _dx: number,
            dy: number,
        ) => {
            this.scrollOffset += dy * 0.5;
            this.clampScroll();
        });

        let dragY = 0;
        let startOff = 0;

        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.y > GRID_TOP) { dragY = p.y; startOff = this.scrollOffset; }
        });
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (p.isDown && dragY > 0) {
                this.scrollOffset = startOff - (p.y - dragY);
                this.clampScroll();
            }
        });
        this.input.on('pointerup', () => { dragY = 0; });
    }

    private clampScroll(): void {
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.maxScroll);
        this.gridContainer.y = -this.scrollOffset;
    }
}
