import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RARITY_ORDER, RARITY, UI } from '../core/config';
import { PETS, TOTAL_PETS } from '../data/pets';
import { SaveSystem } from '../systems/SaveSystem';
import { PetCard } from '../ui/PetCard';
import { Button } from '../ui/components/Button';
import { ProgressBar } from '../ui/components/ProgressBar';
import { t } from '../data/locales';
import { Rarity } from '../types';

export class CollectionScene extends Scene {
    private cards: PetCard[] = [];
    private filterButtons: Button[] = [];
    private countText!: Phaser.GameObjects.Text;
    private progressBar!: ProgressBar;

    constructor() {
        super('CollectionScene');
    }

    create(): void {
        const save = new SaveSystem();
        const collection = new Set(save.getData().collection);

        // Dark background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);

        // Header bar
        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x000000, 0.5);
        headerBg.fillRect(0, 0, GAME_WIDTH, 85);
        headerBg.lineStyle(2, UI.PANEL_BORDER, 0.4);
        headerBg.lineBetween(0, 85, GAME_WIDTH, 85);

        // Back button (top left)
        new Button(this, 50, 22, 80, 30, `← ${t('collection_back')}`, 0x444455, () => {
            this.scene.start('MainScene');
        });

        // Title
        this.add.text(GAME_WIDTH / 2, 15, t('collection_title'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);

        // Progress bar + count
        this.progressBar = new ProgressBar(
            this, GAME_WIDTH / 2 - 120, 40, 240, 14, 0x222244, UI.PRIMARY_GREEN,
        );
        this.updateProgress(collection);

        this.countText = this.add.text(GAME_WIDTH / 2, 40, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        this.updateCount(collection);

        // Filter buttons
        const filterY = 68;
        const filters: (Rarity | 'all')[] = ['all', ...RARITY_ORDER];
        const btnW = 82;
        const totalW = filters.length * (btnW + 4);
        const startX = GAME_WIDTH / 2 - totalW / 2 + btnW / 2;

        filters.forEach((f, i) => {
            const label = f === 'all' ? t('filter_all') : RARITY[f].label;
            const color = f === 'all' ? 0x444455 : RARITY[f].color;
            const btn = new Button(
                this,
                startX + i * (btnW + 4),
                filterY,
                btnW, 22, label, color,
                () => this.setFilter(f, collection),
            );
            this.filterButtons.push(btn);
        });

        // Per-rarity counts (small text under filters)
        // Build grid
        this.buildGrid(collection, 'all');
    }

    private setFilter(filter: Rarity | 'all', collection: Set<string>): void {
        this.cards.forEach(c => c.destroy());
        this.cards = [];
        this.buildGrid(collection, filter);
    }

    private buildGrid(collection: Set<string>, filter: Rarity | 'all'): void {
        const pets = filter === 'all' ? PETS : PETS.filter(p => p.rarity === filter);
        const cols = 10;
        const cardW = 78;
        const cardH = 86;
        const startX = GAME_WIDTH / 2 - (cols * cardW) / 2 + cardW / 2;
        const startY = 135;

        pets.forEach((pet, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * cardW;
            const y = startY + row * cardH;
            const found = collection.has(pet.id);
            const card = new PetCard(this, x, y, pet, found);
            this.cards.push(card);
        });
    }

    private updateCount(collection: Set<string>): void {
        this.countText.setText(
            t('collection_count', { current: String(collection.size), total: String(TOTAL_PETS) }),
        );
    }

    private updateProgress(collection: Set<string>): void {
        this.progressBar.setProgress(collection.size / TOTAL_PETS);
    }
}
