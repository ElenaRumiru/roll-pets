import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI, NEST_CONFIG } from '../core/config';
import { GameManager } from '../core/GameManager';
import { Button } from '../ui/components/Button';
import { buildPetCards } from '../ui/ShopPetsTab';
import { buildEggCards, EggTabResult } from '../ui/ShopEggsTab';
import { t } from '../data/locales';
import { getEggTierConfig } from '../data/eggTiers';
import { showCoinSpend } from '../ui/components/FloatingText';
import { showToast } from '../ui/components/Toast';
import { getEggNameKey } from '../data/eggs';
import { showInterstitial } from '../platform/interstitial';
import { formatCoins } from '../core/formatCoins';

const HEADER_H = 74;
const TAB_Y = HEADER_H + 25;
const TAB_W = 100;
const TAB_GAP = 10;
const TIMER_Y = HEADER_H + 64;
const CARDS_Y = 265;
const BUY_BTN_Y = CARDS_Y + 80 + 8 + 24; // card half-height(80) + gap(8) + btn half-height(24)

type ShopTab = 'pets' | 'eggs';

export class ShopScene extends Scene {
    private manager!: GameManager;
    private cardsContainer!: GameObjects.Container;
    private timerText!: GameObjects.Text;
    private coinText!: GameObjects.Text;
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
        const nestsUnlocked = this.manager.progression.level >= NEST_CONFIG.unlockLevel;
        this.activeTab = (data?.tab === 'eggs' && nestsUnlocked) ? 'eggs' : 'pets';
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);
        this.cardsContainer = this.add.container(0, 0);
        this.createHeader();
        if (nestsUnlocked) this.createTabs();
        this.createTimer();
        this.emptyText = this.add.text(GAME_WIDTH / 2, CARDS_Y, t('shop_empty'), {
            fontFamily: UI.FONT_MAIN, fontSize: '20px', color: '#666688', align: 'center',
        }).setOrigin(0.5).setVisible(false);
        this.refreshBtn = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 50, 222, 52,
            `\u25B6 ${t('shop_refresh')}`, 0x7b42c9, () => this.onRefresh());
        this.hintText = this.add.text(GAME_WIDTH / 2, TIMER_Y, '', {
            fontFamily: UI.FONT_BODY, fontSize: '14px', color: '#666688',
        }).setOrigin(0.5);
        this.switchTab(this.activeTab);
    }

    private createHeader(): void {
        const hdr = this.add.graphics();
        hdr.fillStyle(0x000000, 0.5);
        hdr.fillRect(0, 0, GAME_WIDTH, HEADER_H);
        hdr.lineStyle(1, UI.PANEL_BORDER, 0.3);
        hdr.lineBetween(0, HEADER_H, GAME_WIDTH, HEADER_H);
        new Button(this, 68, 37, 111, 39, `\u2190 ${t('shop_back')}`, 0x444455, () => {
            this.cleanupEggTab();
            this.scene.start('MainScene');
        });
        this.add.text(GAME_WIDTH / 2, 37, t('shop_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '25px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add.image(GAME_WIDTH - 123, 37, 'ui_coin_md').setDisplaySize(35, 35);
        this.coinText = this.add.text(GAME_WIDTH - 101, 37, formatCoins(this.manager.progression.coins), {
            fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0, 0.5);
    }

    private createTabs(): void {
        const cx = GAME_WIDTH / 2;
        const leftX = cx - TAB_W / 2 - TAB_GAP / 2;
        const rightX = cx + TAB_W / 2 + TAB_GAP / 2;

        this.petsTabBtn = new Button(this, leftX, TAB_Y, TAB_W, 36,
            t('shop_tab_pets'), 0x333344, () => this.switchTab('pets'));
        this.eggsTabBtn = new Button(this, rightX, TAB_Y, TAB_W, 36,
            t('shop_tab_eggs'), 0x333344, () => this.switchTab('eggs'));
    }

    private createTimer(): void {
        this.timerText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 93, '', {
            fontFamily: UI.FONT_BODY, fontSize: '14px', color: '#aaaaaa',
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
    }

    private buildPetsContent(): void {
        const offers = this.manager.shop.getOffers();
        this.emptyText.setVisible(offers.length === 0);
        buildPetCards(this, this.cardsContainer, offers,
            this.manager.progression.coins, CARDS_Y, BUY_BTN_Y,
            (petId, canAfford) => this.onBuy(petId, canAfford));
    }

    private buildEggsContent(): void {
        this.eggTabResult = buildEggCards(this, this.cardsContainer,
            this.manager.progression.level,
            this.manager.getEggInventory(),
            this.manager.progression.coins,
            CARDS_Y, BUY_BTN_Y,
            (tier) => this.onBuyEgg(tier));
    }

    private cleanupEggTab(): void {
        if (this.eggTabResult) {
            this.eggTabResult.cleanup();
            this.eggTabResult = null;
        }
    }

    private async onBuy(petId: string, canAfford: boolean): Promise<void> {
        if (!canAfford) { showToast(this, t('shop_no_coins'), 'error'); return; }
        const offer = this.manager.shop.getOffers().find(o => o.petId === petId);
        const success = this.manager.purchasePet(petId);
        if (!success) { showToast(this, t('shop_no_coins'), 'error'); return; }
        if (offer) showCoinSpend(this, GAME_WIDTH - 100, 55, formatCoins(offer.price));
        this.coinText.setText(formatCoins(this.manager.progression.coins));
        await showInterstitial(this);
        this.switchTab('pets');
    }

    private async onBuyEgg(tier: number): Promise<void> {
        const cfg = getEggTierConfig(tier);
        const success = this.manager.purchaseEgg(tier, cfg.price);
        if (!success) { showToast(this, t('shop_no_coins'), 'error'); return; }
        showCoinSpend(this, GAME_WIDTH - 100, 55, formatCoins(cfg.price));
        this.coinText.setText(formatCoins(this.manager.progression.coins));
        const nameKey = getEggNameKey(`egg_${tier}`);
        showToast(this, t('toast_received', { count: 1, item: t(nameKey) }), 'info');
        await showInterstitial(this);
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
