import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI, GRADE, getGradeForChance, getOddsString } from '../core/config';
import { GameManager } from '../core/GameManager';
import { PETS } from '../data/pets';
import { Button } from '../ui/components/Button';
import { t } from '../data/locales';
import { fitText } from '../ui/components/fitText';
import { ShopOffer, PetDef } from '../types';

const HEADER_H = 74;
const CARD_W = 141;
const CARD_H = 160;
const CARD_GAP = 17;
const CARDS_Y = 265;
const BUY_BTN_Y = CARDS_Y + CARD_H / 2 + 35;

export class ShopScene extends Scene {
    private manager!: GameManager;
    private cardsContainer!: GameObjects.Container;
    private timerText!: GameObjects.Text;
    private coinText!: GameObjects.Text;
    private emptyText!: GameObjects.Text;
    private timerElapsed = 0;

    constructor() { super('ShopScene'); }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.timerElapsed = 0;
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);
        this.cardsContainer = this.add.container(0, 0);
        this.createHeader();
        this.createTimer();
        this.emptyText = this.add.text(GAME_WIDTH / 2, CARDS_Y, t('shop_empty'), {
            fontFamily: UI.FONT_MAIN, fontSize: '20px', color: '#666688', align: 'center',
        }).setOrigin(0.5).setVisible(false);
        new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 37, 222, 52,
            `\u25B6 ${t('shop_refresh')}`, 0x7b42c9, () => this.onRefresh());
        this.buildCards();
    }

    private createHeader(): void {
        const hdr = this.add.graphics();
        hdr.fillStyle(0x000000, 0.5);
        hdr.fillRect(0, 0, GAME_WIDTH, HEADER_H);
        hdr.lineStyle(1, UI.PANEL_BORDER, 0.3);
        hdr.lineBetween(0, HEADER_H, GAME_WIDTH, HEADER_H);
        new Button(this, 68, 37, 111, 39, `\u2190 ${t('shop_back')}`, 0x444455, () => {
            this.scene.start('MainScene');
        });
        this.add.text(GAME_WIDTH / 2, 37, t('shop_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '25px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add.image(GAME_WIDTH - 123, 37, 'ui_coin_md').setDisplaySize(35, 35);
        this.coinText = this.add.text(GAME_WIDTH - 101, 37, this.formatCoins(this.manager.progression.coins), {
            fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0, 0.5);
    }

    private createTimer(): void {
        this.timerText = this.add.text(GAME_WIDTH / 2, HEADER_H + 32, '', {
            fontFamily: UI.FONT_BODY, fontSize: '16px', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.updateTimerText();
    }

    private buildCards(): void {
        this.cardsContainer.removeAll(true);
        const offers = this.manager.shop.getOffers();
        this.emptyText.setVisible(offers.length === 0);
        if (offers.length === 0) return;
        const totalW = offers.length * CARD_W + (offers.length - 1) * CARD_GAP;
        const startX = GAME_WIDTH / 2 - totalW / 2 + CARD_W / 2;
        offers.forEach((offer, i) => {
            const pet = PETS.find(p => p.id === offer.petId);
            if (!pet) return;
            const x = startX + i * (CARD_W + CARD_GAP);
            this.createOfferCard(x, offer, pet);
        });
    }

    private createOfferCard(x: number, offer: ShopOffer, pet: PetDef): void {
        const cfg = GRADE[getGradeForChance(pet.chance)];
        const r = 15;
        const container = this.add.container(x, CARDS_Y);

        // Card bg
        const bg = this.add.graphics();
        bg.fillStyle(0x2a2a3e, 1);
        bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
        bg.lineStyle(2, cfg.color, 0.8);
        bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
        bg.fillStyle(cfg.color, 0.1);
        bg.fillRoundedRect(-CARD_W / 2 + 1, -CARD_H / 2 + 1, CARD_W - 2, CARD_H * 0.35,
            { tl: r - 1, tr: r - 1, bl: 0, br: 0 });
        container.add(bg);

        // Pet image
        const img = this.add.image(0, -20, pet.imageKey).setScale(0.47);
        container.add(img);

        // Name (native crisp font)
        const name = this.add.text(0, CARD_H / 2 - 37, t('pet_' + pet.id), {
            fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);
        fitText(name, CARD_W - 10, 17);
        container.add(name);

        // Odds
        const odds = this.add.text(0, CARD_H / 2 - 17, getOddsString(pet.chance), {
            fontFamily: UI.FONT_MAIN, fontSize: '14px', color: cfg.colorHex,
        }).setOrigin(0.5);
        container.add(odds);

        this.cardsContainer.add(container);

        // Buy button
        const canAfford = this.manager.progression.coins >= offer.price;
        const btnColor = canAfford ? 0x27ae60 : 0x555566;
        const btnW = 148;
        const btnH = 47;
        const priceStr = this.formatCoins(offer.price);
        const btn = new Button(this, x, BUY_BTN_Y, btnW, btnH,
            priceStr, btnColor, () => this.onBuy(offer.petId, canAfford));

        // label is at index 2 (outlineGfx=0, bg=1, label=2)
        const label = btn.list[2] as GameObjects.Text;
        const textW = label.width;
        const iconSize = 20;
        const gap = 4;
        const groupW = iconSize + gap + textW;
        const iconX = -groupW / 2 + iconSize / 2;
        const textShift = iconX + iconSize / 2 + gap + textW / 2;

        label.setX(textShift).setY(-3);
        const ci = this.add.image(iconX, -3, 'ui_coin_md').setDisplaySize(iconSize, iconSize);
        btn.add(ci);

        if (!canAfford) btn.setEnabled(false);
        this.cardsContainer.add(btn);
    }

    private onBuy(petId: string, canAfford: boolean): void {
        if (!canAfford) { this.showToast(t('shop_no_coins')); return; }
        const success = this.manager.purchasePet(petId);
        if (!success) { this.showToast(t('shop_no_coins')); return; }
        this.coinText.setText(this.formatCoins(this.manager.progression.coins));
        this.buildCards();
    }

    private showToast(message: string): void {
        const toast = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 74, message, {
            fontFamily: UI.FONT_STROKE, fontSize: '20px', color: '#ff4444',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5).setDepth(10);
        this.tweens.add({
            targets: toast, y: toast.y - 30, alpha: 0,
            duration: 1200, ease: 'Power2',
            onComplete: () => toast.destroy(),
        });
    }

    private onRefresh(): void {
        const sdk = this.registry.get('platformSDK') as import('../platform/PlatformSDK').PlatformSDK | undefined;
        if (sdk) {
            sdk.showRewardedBreak().then((success: boolean) => {
                if (success) { this.manager.refreshShop(); this.buildCards(); }
            });
        } else {
            this.manager.refreshShop();
            this.buildCards();
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

    private formatCoins(n: number): string {
        if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
        return n.toLocaleString('en-US');
    }
}
