import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI } from '../core/config';
import { TOTAL_PETS } from '../data/pets';
import { COLLECTIONS } from '../data/collections';
import { GameManager } from '../core/GameManager';
import { Button } from '../ui/components/Button';
import { buildAllTab } from '../ui/CollectionAllTab';
import { buildCollectionCards } from '../ui/CollectionCardsGrid';
import { buildDetailView } from '../ui/CollectionDetail';
import { t } from '../data/locales';
import { showToast } from '../ui/components/Toast';

type CollTab = 'collections' | 'all';

export class CollectionScene extends Scene {
    private manager!: GameManager;
    private collection!: Set<string>;
    private activeTab: CollTab = 'collections';
    private colTabBtn!: Button;
    private allTabBtn!: Button;
    private content!: Phaser.GameObjects.Container;
    private detailContainer: Phaser.GameObjects.Container | null = null;
    private tabCleanup: (() => void) | null = null;
    private detailCleanup: (() => void) | null = null;

    constructor() { super('CollectionScene'); }

    create(data?: { tab?: CollTab }): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.collection = new Set(this.manager.save.getData().collection);
        this.activeTab = data?.tab ?? 'collections';

        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);
        this.content = this.add.container(0, 0);

        this.createHeader();
        this.createTabs();
        this.switchTab(this.activeTab);
    }

    private createHeader(): void {
        const hdr = this.add.graphics();
        hdr.fillStyle(0x000000, 0.5);
        hdr.fillRect(0, 0, GAME_WIDTH, 74);
        hdr.lineStyle(1, 0xffffff, 0.1);
        hdr.lineBetween(0, 74, GAME_WIDTH, 74);

        new Button(this, 68, 31, 111, 39, `\u2190 ${t('collection_back')}`, 0x444455, () => {
            this.cleanupAll();
            this.manager.save.clearNewPets();
            this.scene.start('MainScene');
        });

        this.add.text(GAME_WIDTH / 2, 20, t('collection_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '25px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 52, t('collection_count', {
            current: String(this.collection.size), total: String(TOTAL_PETS),
        }), { fontFamily: UI.FONT_MAIN, fontSize: '16px', color: '#aaaaaa' }).setOrigin(0.5);
    }

    private createTabs(): void {
        const tabW = 110;
        const gap = 10;
        const cx = GAME_WIDTH / 2;
        const y = 74 + 21;

        this.colTabBtn = new Button(this, cx - tabW / 2 - gap / 2, y, tabW, 28,
            t('col_tab_collections'), 0x444455, () => {
                if (this.detailContainer) this.hideDetail();
                if (this.activeTab !== 'collections') this.switchTab('collections');
            });

        this.allTabBtn = new Button(this, cx + tabW / 2 + gap / 2, y, tabW, 28,
            t('col_tab_all'), 0x444455, () => {
                if (this.detailContainer) this.hideDetail();
                if (this.activeTab !== 'all') this.switchTab('all');
            });
    }

    private switchTab(tab: CollTab): void {
        this.cleanupTab();
        this.content.removeAll(true);
        this.activeTab = tab;

        const accentCol = tab === 'collections' ? 0x78C828 : 0x3498db;
        this.colTabBtn.setColor(tab === 'collections' ? accentCol : 0x333344);
        this.colTabBtn.setOutline(tab === 'collections' ? accentCol : null);
        this.allTabBtn.setColor(tab === 'all' ? accentCol : 0x333344);
        this.allTabBtn.setOutline(tab === 'all' ? accentCol : null);

        if (tab === 'collections') this.buildCollectionsTab();
        else this.buildAllTab();
    }

    private buildCollectionsTab(): void {
        const result = buildCollectionCards(
            this, this.content, this.manager.collectionTracker, this.collection,
            (collId) => this.showDetail(collId),
        );
        this.tabCleanup = result.cleanup;
    }

    private buildAllTab(): void {
        const newPetIds = new Set(this.manager.save.getNewPets());
        const result = buildAllTab(this, this.content, this.collection, newPetIds);
        this.tabCleanup = result.cleanup;
    }

    private showDetail(collId: string): void {
        if (this.detailContainer) this.hideDetail();

        // Remove grid scroll handlers so background doesn't scroll
        this.cleanupTab();

        const discovered = this.manager.collectionTracker.getDiscoveredSorted(this.collection);
        const idx = discovered.findIndex(c => c.id === collId);

        this.detailContainer = this.add.container(0, 0).setDepth(500);

        const newPetIds = new Set(this.manager.save.getNewPets());
        const result = buildDetailView(
            this, this.detailContainer,
            discovered[idx] ?? COLLECTIONS.find(c => c.id === collId)!,
            this.manager.collectionTracker, this.collection, newPetIds,
            (dir) => {
                const next = (idx + dir + discovered.length) % discovered.length;
                this.showDetail(discovered[next].id);
            },
            (id) => this.handleClaim(id),
            () => this.hideDetail(),
        );
        this.detailCleanup = result.cleanup;
        this.manager.saveState();
    }

    private hideDetail(): void {
        if (this.detailCleanup) { this.detailCleanup(); this.detailCleanup = null; }
        if (this.detailContainer) { this.detailContainer.destroy(true); this.detailContainer = null; }
        // Rebuild collections tab to restore scroll handlers
        this.switchTab('collections');
    }

    private handleClaim(collId: string): void {
        if (this.manager.claimCollection(collId)) {
            const coll = COLLECTIONS.find(c => c.id === collId);
            if (coll) showToast(this, t('col_complete', { name: t(coll.nameKey) }), 'info');
            this.showDetail(collId);
        }
    }

    private cleanupTab(): void {
        if (this.tabCleanup) { this.tabCleanup(); this.tabCleanup = null; }
    }

    private cleanupAll(): void {
        this.hideDetail();
        this.cleanupTab();
    }
}
