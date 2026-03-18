import { Scene } from 'phaser';
import { UI } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait } from '../core/orientation';
import { COLLECTIONS } from '../data/collections';
import { GameManager } from '../core/GameManager';
import { Button } from '../ui/components/Button';
import { buildAllTab } from '../ui/CollectionAllTab';
import { buildCollectionCards } from '../ui/CollectionCardsGrid';
import { buildDetailView } from '../ui/CollectionDetail';
import { t } from '../data/locales';
import { createSceneHeader } from '../ui/SceneHeader';
import { EventBus } from '../core/EventBus';

type CollTab = 'collections' | 'all';

export class CollectionScene extends Scene {
    private manager!: GameManager;
    private collection!: Set<string>;
    private activeTab: CollTab = 'collections';
    private colTabBtn!: Button;
    private allTabBtn!: Button;
    private allBadge!: Phaser.GameObjects.Container;
    private content!: Phaser.GameObjects.Container;
    private detailContainer: Phaser.GameObjects.Container | null = null;
    private tabCleanup: (() => void) | null = null;
    private detailCleanup: (() => void) | null = null;

    constructor() { super('CollectionScene'); }

    create(data?: { tab?: CollTab }): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.collection = new Set(this.manager.save.getData().collection);
        this.activeTab = data?.tab ?? 'collections';

        const gw = getGameWidth();
        const gh = getGameHeight();

        this.add.rectangle(gw / 2, gh / 2, gw, gh, 0x12121e);
        this.content = this.add.container(0, 0);

        createSceneHeader({
            scene: this, titleKey: 'collection_title', backKey: 'collection_back',
            onBack: () => { this.cleanupAll(); this.scene.start('MainScene'); },
            coins: this.manager.progression.coins,
        });
        this.createTabs();
        this.switchTab(this.activeTab);
        EventBus.on('assets-loaded', this.onAssetsLoaded, this);
        this.events.on('shutdown', () => EventBus.off('assets-loaded', this.onAssetsLoaded, this));
    }

    private onAssetsLoaded(type: string): void {
        if (type === 'collectionIcons' || type === 'pets') this.switchTab(this.activeTab);
    }

    private createTabs(): void {
        const port = isPortrait();
        const tabW = port ? 100 : 110;
        const gap = 10;
        const cx = getGameWidth() / 2;
        const y = 74 + 21;

        this.colTabBtn = new Button(this, cx - tabW / 2 - gap / 2, y, tabW, 36,
            t('col_tab_collections'), 0x444455, () => {
                if (this.detailContainer) this.hideDetail();
                if (this.activeTab !== 'collections') this.switchTab('collections');
            });

        this.allTabBtn = new Button(this, cx + tabW / 2 + gap / 2, y, tabW, 36,
            t('col_tab_all'), 0x444455, () => {
                if (this.detailContainer) this.hideDetail();
                if (this.activeTab !== 'all') this.switchTab('all');
            });

        // Red notification badge on All tab
        const bx = cx + tabW + gap / 2 - 4;
        const by = y - 14;
        const badgeR = 9;
        this.allBadge = this.add.container(0, 0);
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 1);
        bg.fillCircle(bx, by, badgeR + 1.5);
        bg.fillStyle(0xcc0000, 1);
        bg.fillCircle(bx, by, badgeR);
        this.allBadge.add(bg);
        this.allBadge.add(this.add.text(bx, by, '!', {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5));
        this.updateAllBadge();
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

        // Clear NEW! markers only (doesn't affect "!" badges on collection cards)
        this.manager.save.clearNewPets();
        this.updateAllBadge();
    }

    private showDetail(collId: string): void {
        if (this.detailContainer) this.hideDetail();

        // Remove grid scroll handlers so background doesn't scroll
        this.cleanupTab();

        const discovered = this.manager.collectionTracker.getDiscoveredSorted(this.collection);
        const idx = discovered.findIndex(c => c.id === collId);
        const coll = discovered[idx] ?? COLLECTIONS.find(c => c.id === collId)!;

        this.detailContainer = this.add.container(0, 0).setDepth(500);

        const result = buildDetailView(
            this, this.detailContainer, coll,
            this.manager.collectionTracker, this.collection,
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
            this.showDetail(collId);
        }
    }

    private updateAllBadge(): void {
        const hasNew = this.manager.save.getNewPets().length > 0;
        this.allBadge.setVisible(hasNew);
    }

    private cleanupTab(): void {
        if (this.tabCleanup) { this.tabCleanup(); this.tabCleanup = null; }
    }

    private cleanupAll(): void {
        this.hideDetail();
        this.cleanupTab();
    }

    update(_time: number, delta: number): void {
        this.manager.update(delta);
    }
}
