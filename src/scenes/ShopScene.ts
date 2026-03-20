import { Scene, GameObjects } from 'phaser';
import { UI, NEST_CONFIG } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait } from '../core/orientation';
import { GameManager } from '../core/GameManager';
import { Button } from '../ui/components/Button';
import { buildPetCards } from '../ui/ShopPetsTab';
import { buildEggCards, EggTabResult } from '../ui/ShopEggsTab';
import { t } from '../data/locales';
import { getEggTierConfig } from '../data/eggTiers';
import { showToast } from '../ui/components/Toast';
import { getEggNameKey } from '../data/eggs';
import { createSceneHeader } from '../ui/SceneHeader';
import { CoinDisplay } from '../ui/CoinDisplay';
import { addAdIcon } from '../ui/components/ChoiceCard';
import { addShineEffect } from '../ui/components/shineEffect';
import { EventBus } from '../core/EventBus';

const HEADER_H = 74;
const TAB_Y = HEADER_H + 25;
const TAB_W = 100;
const TAB_GAP = 10;
const TIMER_Y = HEADER_H + 64;

type ShopTab = 'pets' | 'eggs';

export class ShopScene extends Scene {
    private manager!: GameManager;
    private cardsContainer!: GameObjects.Container;
    private timerText!: GameObjects.Text;
    private coinDisplay: CoinDisplay | null = null;
    private emptyText!: GameObjects.Text;
    private refreshBtn!: Button;
    private timerElapsed = 0;
    private activeTab: ShopTab = 'pets';
    private petsTabBtn: Button | null = null;
    private eggsTabBtn: Button | null = null;
    private eggTabResult: EggTabResult | null = null;
    private hintText!: GameObjects.Text;

    constructor() { super('ShopScene'); }

    create(data?: { tab?: ShopTab }): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.timerElapsed = 0;
        this.eggTabResult = null;
        this.petsTabBtn = null;
        this.eggsTabBtn = null;
        const gw = getGameWidth();
        const gh = getGameHeight();
        const nestsUnlocked = this.manager.progression.level >= NEST_CONFIG.unlockLevel;
        this.activeTab = (data?.tab === 'eggs' && nestsUnlocked) ? 'eggs' : 'pets';
        this.add.rectangle(gw / 2, gh / 2, gw, gh, 0x12121e);
        this.cardsContainer = this.add.container(0, 0);
        const hdr = createSceneHeader({
            scene: this, titleKey: 'shop_title', backKey: 'shop_back',
            onBack: () => { this.cleanupEggTab(); this.scene.start('MainScene'); },
            coins: this.manager.progression.coins,
        });
        this.coinDisplay = hdr.coinDisplay;
        if (nestsUnlocked) this.createTabs();
        this.createTimer();
        const cardsY = this.getCardsY();
        this.emptyText = this.add.text(gw / 2, cardsY, t('shop_empty'), {
            fontFamily: UI.FONT_MAIN, fontSize: '20px', color: '#666688', align: 'center',
        }).setOrigin(0.5).setVisible(false);
        this.refreshBtn = new Button(this, gw / 2, gh - 50, 222, 52,
            t('shop_refresh'), 0x7b42c9, () => this.onRefresh());
        addAdIcon(this, this.refreshBtn);
        addShineEffect(this, this.refreshBtn, 222, 50, 15);
        const hintSize = isPortrait() ? '18px' : '14px';
        this.hintText = this.add.text(gw / 2, TIMER_Y, '', {
            fontFamily: UI.FONT_BODY, fontSize: hintSize, color: '#666688',
        }).setOrigin(0.5);
        this.switchTab(this.activeTab);
        EventBus.on('assets-loaded', this.onAssetsLoaded, this);
        this.events.on('shutdown', () => EventBus.off('assets-loaded', this.onAssetsLoaded, this));
    }

    private onAssetsLoaded(type: string): void {
        if (type === 'eggs' && this.activeTab === 'eggs') this.switchTab('eggs');
        if (type === 'pets' && this.activeTab === 'pets') this.switchTab('pets');
    }

    private createTabs(): void {
        const cx = getGameWidth() / 2;
        const leftX = cx - TAB_W / 2 - TAB_GAP / 2;
        const rightX = cx + TAB_W / 2 + TAB_GAP / 2;

        this.petsTabBtn = new Button(this, leftX, TAB_Y, TAB_W, 36,
            t('shop_tab_pets'), 0x333344, () => this.switchTab('pets'));
        this.eggsTabBtn = new Button(this, rightX, TAB_Y, TAB_W, 36,
            t('shop_tab_eggs'), 0x333344, () => this.switchTab('eggs'));
    }

    private createTimer(): void {
        const timerSize = '18px';
        this.timerText = this.add.text(getGameWidth() / 2, getGameHeight() - 93, '', {
            fontFamily: UI.FONT_BODY, fontSize: timerSize, color: '#aaaaaa',
        }).setOrigin(0.5);
        this.updateTimerText();
    }

    private switchTab(tab: ShopTab): void {
        this.cleanupEggTab();
        this.activeTab = tab;

        // Update tab button visuals
        if (tab === 'pets') {
            this.petsTabBtn?.setColor(0x3498db);
            this.petsTabBtn?.setOutline(0x3498db);
            this.eggsTabBtn?.setColor(0x333344);
            this.eggsTabBtn?.setOutline(null);
        } else {
            this.eggsTabBtn?.setColor(0xffc107);
            this.eggsTabBtn?.setOutline(0xffc107);
            this.petsTabBtn?.setColor(0x333344);
            this.petsTabBtn?.setOutline(null);
        }

        // Show/hide tab-specific elements
        const showPets = tab === 'pets';
        this.timerText.setVisible(showPets);
        this.refreshBtn.setVisible(showPets);
        this.hintText.setText(showPets ? t('shop_pets_hint') : t('shop_eggs_hint'));
        this.emptyText.setVisible(false);

        this.cardsContainer.removeAll(true);

        if (tab === 'pets') {
            this.buildPetsContent();
        } else {
            this.buildEggsContent();
        }

        this.layoutBottomElements(showPets);
    }

    private layoutBottomElements(showPets: boolean): void {
        const gh = getGameHeight();
        if (showPets && isPortrait()) {
            const cardsY = this.getCardsY();
            const rows = 2; // always layout as if 2 rows (standard 5-pet grid)
            const cardTop = cardsY - 80;
            const blockBottom = cardsY + (rows - 1) * 240 + 135;
            const gap = 25;
            this.hintText.setY(cardTop - gap - 20);
            this.timerText.setY(blockBottom + gap + 20 + 7);
            this.refreshBtn.setY(this.timerText.y + 35 + 26);
            // Center empty text between where two card rows would be
            const rowH = 160 + 8 + 47 + 25; // card + btn gap + btn + row gap
            this.emptyText.setY(cardsY + rowH / 2);
        } else {
            this.hintText.setY(TIMER_Y);
            this.timerText.setY(gh - 108);
            this.refreshBtn.setY(gh - 50);
        }
    }

    private getCardsY(): number {
        if (isPortrait()) {
            const gh = getGameHeight();
            const topArea = 140;
            const bottomArea = gh - 110;
            const rowH = 160 + 8 + 47; // card + gap + btn
            const contentH = 2 * rowH + 25; // 2 rows + gap
            return topArea + (bottomArea - topArea - contentH) / 2 + 160 / 2 - 50;
        }
        return 265;
    }

    private getBuyBtnY(): number {
        return this.getCardsY() + 80 + 8 + 24;
    }

    private buildPetsContent(): void {
        const offers = this.manager.shop.getOffers();
        this.emptyText.setVisible(offers.length === 0);
        const port = isPortrait();
        const cardsY = this.getCardsY();
        const buyBtnY = this.getBuyBtnY();
        buildPetCards(this, this.cardsContainer, offers,
            this.manager.progression.coins, cardsY, buyBtnY,
            (petId, canAfford) => this.onBuy(petId, canAfford),
            port ? 3 : undefined);
    }

    private getEggContentY(): number {
        // Hint text at TIMER_Y (~138), ~14px tall; cards start below with gap
        return TIMER_Y + 14 + 20 + 80; // hint bottom + gap + card half-height
    }

    private buildEggsContent(): void {
        const port = isPortrait();
        const contentY = this.getEggContentY();
        const buyBtnY = contentY + 80 + 8 + 24;
        this.eggTabResult = buildEggCards(this, this.cardsContainer,
            this.manager.progression.level,
            this.manager.getEggInventory(),
            this.manager.progression.coins,
            contentY, buyBtnY,
            (tier) => this.onBuyEgg(tier),
            port ? 3 : undefined);
    }

    private cleanupEggTab(): void {
        if (this.eggTabResult) {
            this.eggTabResult.cleanup();
            this.eggTabResult = null;
        }
    }

    private onBuy(petId: string, canAfford: boolean): void {
        if (!canAfford) { showToast(this, t('shop_no_coins'), 'error'); return; }
        const offer = this.manager.shop.getOffers().find(o => o.petId === petId);
        const success = this.manager.purchasePet(petId);
        if (!success) { showToast(this, t('shop_no_coins'), 'error'); return; }
        if (offer) this.coinDisplay?.showFloatingSpend(offer.price, this);
        this.coinDisplay?.updateCoins(this.manager.progression.coins);
        this.switchTab('pets');
    }

    private onBuyEgg(tier: number): void {
        const cfg = getEggTierConfig(tier);
        const success = this.manager.purchaseEgg(tier, cfg.price);
        if (!success) { showToast(this, t('shop_no_coins'), 'error'); return; }
        this.coinDisplay?.showFloatingSpend(cfg.price, this);
        this.coinDisplay?.updateCoins(this.manager.progression.coins);
        const nameKey = getEggNameKey(`egg_${tier}`);
        showToast(this, t('toast_received', { count: 1, item: t(nameKey) }), 'info');
        this.switchTab('eggs');
    }

    private onRefresh(): void {
        const sdk = this.registry.get('platformSDK') as import('../platform/PlatformSDK').PlatformSDK | undefined;
        if (sdk) {
            sdk.showRewardedBreak().then((success: boolean) => {
                if (success) { this.manager.refreshShop(); this.switchTab('pets'); }
            });
        }
    }

    update(_time: number, delta: number): void {
        this.manager.update(delta);
        this.timerElapsed += delta;
        if (this.timerElapsed >= 1000) {
            this.timerElapsed -= 1000;
            this.updateTimerText();
        }
    }

    private updateTimerText(): void {
        const secs = this.manager.shop.getSecondsUntilReset();
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        this.timerText.setText(t('shop_timer', { time }));
    }

}
