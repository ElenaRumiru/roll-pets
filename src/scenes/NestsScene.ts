import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI, NEST_CONFIG } from '../core/config';
import { GameManager } from '../core/GameManager';
import { Button } from '../ui/components/Button';
import { EggSelectPopup, EggOption } from '../ui/EggSelectPopup';
import { NestHatchOverlay } from '../ui/NestHatchOverlay';
import { renderEmptySlot, renderIncubatingSlot, renderReadySlot, renderLockedSlot, SlotLayout } from '../ui/NestSlotCard';
import { t } from '../data/locales';
import { showCoinSpend } from '../ui/components/FloatingText';

const HEADER_H = 74;
const SLOT_W = 200;
const SLOT_GAP = 30;
const LAYOUT: SlotLayout = {
    slotY: GAME_HEIGHT / 2 + 15,
    btnY: GAME_HEIGHT / 2 + 15 + 125 + 30,
    btnW: 160,
    btnH: 42,
};

export class NestsScene extends Scene {
    private manager!: GameManager;
    private slotsContainer!: GameObjects.Container;
    private coinText!: GameObjects.Text;
    private timerAccum = 0;
    private popup: EggSelectPopup | null = null;

    constructor() { super('NestsScene'); }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.timerAccum = 0;
        this.popup = null;
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);
        this.slotsContainer = this.add.container(0, 0);
        this.createHeader();
        this.refreshSlots();
        this.createHint();
    }

    private createHeader(): void {
        const hdr = this.add.graphics();
        hdr.fillStyle(0x000000, 0.5);
        hdr.fillRect(0, 0, GAME_WIDTH, HEADER_H);
        hdr.lineStyle(1, UI.PANEL_BORDER, 0.3);
        hdr.lineBetween(0, HEADER_H, GAME_WIDTH, HEADER_H);
        new Button(this, 68, 37, 111, 39, `\u2190 ${t('nests_back')}`, 0x444455, () => {
            this.scene.start('MainScene');
        });
        this.add.text(GAME_WIDTH / 2, 37, t('nests_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '25px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        this.add.image(GAME_WIDTH - 123, 37, 'ui_coin_md').setDisplaySize(35, 35);
        this.coinText = this.add.text(GAME_WIDTH - 101, 37,
            this.formatCoins(this.manager.progression.coins), {
                fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
                stroke: '#000000', strokeThickness: UI.STROKE_THIN,
            }).setOrigin(0, 0.5);
    }

    private createHint(): void {
        this.add.text(GAME_WIDTH / 2, 127, t('nests_hint'), {
            fontFamily: UI.FONT_BODY, fontSize: '14px', color: '#666688',
        }).setOrigin(0.5);
    }

    private refreshSlots(): void {
        this.slotsContainer.removeAll(true);
        const slots = this.manager.nests.getSlots();
        const visible: { index: number }[] = [];
        for (let i = 0; i < slots.length; i++) {
            visible.push({ index: i });
            if (!slots[i].unlocked) break;
        }
        const N = visible.length;
        const totalW = N * SLOT_W + (N - 1) * SLOT_GAP;
        const startX = GAME_WIDTH / 2 - totalW / 2 + SLOT_W / 2;

        for (let vi = 0; vi < N; vi++) {
            const { index } = visible[vi];
            const slot = slots[index];
            const x = startX + vi * (SLOT_W + SLOT_GAP);
            if (!slot.unlocked) {
                renderLockedSlot(this, this.slotsContainer, x, LAYOUT, index,
                    this.manager.progression.coins, () => this.onBuySlot(index), this.formatCoins);
            } else if (slot.startTime === null) {
                renderEmptySlot(this, this.slotsContainer, x, LAYOUT, () => this.onSelect(index));
            } else if (this.manager.nests.isReady(index)) {
                renderReadySlot(this, this.slotsContainer, x, LAYOUT, slot, () => this.onCollect(index));
            } else {
                renderIncubatingSlot(this, this.slotsContainer, x, LAYOUT, slot,
                    this.manager.nests, index, this.formatTime, () => this.onSpeedUp(index));
            }
        }
        this.coinText.setText(this.formatCoins(this.manager.progression.coins));
    }

    private onSelect(slotIndex: number): void {
        if (this.popup) return;
        const inv = this.manager.getEggInventory();
        const eggs: EggOption[] = [];
        for (const key of Object.keys(inv)) {
            const count = inv[key];
            if (count > 0) eggs.push({ tier: Number(key), count });
        }
        eggs.sort((a, b) => a.tier - b.tier);

        this.popup = new EggSelectPopup(
            this,
            eggs,
            (tier) => {
                this.popup = null;
                this.manager.placeNestEgg(slotIndex, tier);
                this.refreshSlots();
            },
            () => { this.popup = null; },
            () => {
                this.popup = null;
                this.manager.saveState();
                this.scene.start('ShopScene', { tab: 'eggs' });
            },
        );
    }

    private onCollect(slotIndex: number): void {
        const slot = this.manager.nests.getSlots()[slotIndex];
        const eggKey = slot.eggTier ? `egg_${slot.eggTier}` : 'egg_1';
        const result = this.manager.hatchNest(slotIndex);
        if (!result) return;
        new NestHatchOverlay(this).play(result, eggKey, () => this.refreshSlots());
    }

    private onSpeedUp(index: number): void {
        const sdk = this.registry.get('platformSDK') as import('../platform/PlatformSDK').PlatformSDK | undefined;
        if (sdk) {
            sdk.showRewardedBreak().then((success: boolean) => {
                if (success) { this.manager.boostNestSlot(index); this.refreshSlots(); }
            });
        } else {
            this.manager.boostNestSlot(index);
            this.refreshSlots();
        }
    }

    private onBuySlot(index: number): void {
        const price = NEST_CONFIG.slotPrices[index] ?? 0;
        if (this.manager.unlockNestSlot(index)) {
            showCoinSpend(this, GAME_WIDTH - 100, 55, this.formatCoins(price));
            this.refreshSlots();
        } else {
            this.showToast(t('nests_no_coins'));
        }
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

    update(_time: number, delta: number): void {
        this.timerAccum += delta;
        if (this.timerAccum < 100) return;
        this.timerAccum = 0;
        let needsRefresh = false;
        this.slotsContainer.each((child: GameObjects.GameObject) => {
            if (!(child instanceof GameObjects.Container)) return;
            child.each((sub: GameObjects.GameObject) => {
                if (!(sub instanceof GameObjects.Text)) return;
                const idx = sub.getData('nestIndex') as number | undefined;
                if (idx === undefined) return;
                if (this.manager.nests.isReady(idx)) needsRefresh = true;
                else sub.setText(this.formatTime(this.manager.nests.getTimeRemainingMs(idx)));
            });
        });
        if (needsRefresh) this.refreshSlots();
    }

    private formatTime(ms: number): string {
        const totalSec = Math.ceil(ms / 1000);
        if (totalSec >= 3600) {
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    private formatCoins(n: number): string {
        if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
        return n.toLocaleString('en-US');
    }
}
