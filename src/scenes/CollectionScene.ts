import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRADE_ORDER, GRADE, getGradeForChance, UI } from '../core/config';
import { PETS, TOTAL_PETS, getPetsByGrade } from '../data/pets';
import { SaveSystem } from '../systems/SaveSystem';
import { PetCard } from '../ui/PetCard';
import { Button } from '../ui/components/Button';
import { t } from '../data/locales';
import { Grade } from '../types';

const GRID_TOP = 152;
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

        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);

        this.gridContainer = this.add.container(0, 0);
        const maskGfx = this.make.graphics({});
        maskGfx.fillRect(0, GRID_TOP, GAME_WIDTH, GRID_H);
        this.gridContainer.setMask(maskGfx.createGeometryMask());

        this.createHeader();
        this.createFilters();
        this.buildGrid('all');
        this.setupScroll();
    }

    private createHeader(): void {
        const hdr = this.add.graphics();
        hdr.fillStyle(0x000000, 0.5);
        hdr.fillRect(0, 0, GAME_WIDTH, GRID_TOP);
        hdr.lineStyle(1, UI.PANEL_BORDER, 0.3);
        hdr.lineBetween(0, GRID_TOP, GAME_WIDTH, GRID_TOP);

        new Button(this, 55, 25, 90, 32, `← ${t('collection_back')}`, 0x444455, () => {
            this.scene.start('MainScene');
        });

        this.add.text(GAME_WIDTH / 2, 16, t('collection_title'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);

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
        const filters: (Grade | 'all')[] = ['all', ...GRADE_ORDER];
        const btnW = 68;
        const gap = 4;

        // Row 1: All + first 6 grades
        const row1 = filters.slice(0, 7);
        const row1W = row1.length * btnW + (row1.length - 1) * gap;
        const row1X = GAME_WIDTH / 2 - row1W / 2 + btnW / 2;
        const y1 = 68;

        row1.forEach((f, i) => {
            const { label, color } = this.getFilterStyle(f);
            new Button(this, row1X + i * (btnW + gap), y1, btnW, 24, label, color, () => {
                this.scrollOffset = 0;
                this.buildGrid(f);
            });
        });

        // Row 2: remaining grades
        const row2 = filters.slice(7);
        if (row2.length > 0) {
            const row2W = row2.length * btnW + (row2.length - 1) * gap;
            const row2X = GAME_WIDTH / 2 - row2W / 2 + btnW / 2;
            const y2 = 96;

            row2.forEach((f, i) => {
                const { label, color } = this.getFilterStyle(f);
                new Button(this, row2X + i * (btnW + gap), y2, btnW, 24, label, color, () => {
                    this.scrollOffset = 0;
                    this.buildGrid(f);
                });
            });
        }

        // Compact grade counts row
        const y3 = 122;
        const countW = Math.floor(GAME_WIDTH / GRADE_ORDER.length);
        const countStart = (GAME_WIDTH - countW * GRADE_ORDER.length) / 2 + countW / 2;
        GRADE_ORDER.forEach((g, i) => {
            const total = getPetsByGrade(g).length;
            const have = getPetsByGrade(g).filter(p => this.collection.has(p.id)).length;
            this.add.text(countStart + i * countW, y3, `${have}/${total}`, {
                fontFamily: UI.FONT_MAIN,
                fontSize: '9px',
                color: GRADE[g].colorHex,
            }).setOrigin(0.5);
        });
    }

    private getFilterStyle(f: Grade | 'all'): { label: string; color: number } {
        if (f === 'all') return { label: t('filter_all'), color: 0x444455 };
        return { label: t(`grade_${f}`), color: GRADE[f].color };
    }

    private buildGrid(filter: Grade | 'all'): void {
        this.gridContainer.removeAll(true);

        const pets = filter === 'all'
            ? PETS
            : PETS.filter(p => getGradeForChance(p.chance) === filter);

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
