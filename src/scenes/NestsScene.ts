import { Scene, GameObjects } from 'phaser';
import { UI, NEST_CONFIG } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait } from '../core/orientation';
import { GameManager } from '../core/GameManager';
import { EggSelectPopup, EggOption } from '../ui/EggSelectPopup';
import { NestHatchOverlay } from '../ui/NestHatchOverlay';
import { renderEmptySlot, renderIncubatingSlot, renderReadySlot, renderLockedSlot, SlotLayout } from '../ui/NestSlotCard';
import { t } from '../data/locales';
import { showToast } from '../ui/components/Toast';
import { showInterstitial } from '../platform/interstitial';
import { createSceneHeader } from '../ui/SceneHeader';
import { CoinDisplay } from '../ui/CoinDisplay';

const SLOT_W = 200;
const SLOT_H = 250;
const SLOT_GAP = 30;

export class NestsScene extends Scene {
    private manager!: GameManager;
    private slotsContainer!: GameObjects.Container;
    private coinDisplay: CoinDisplay | null = null;
    private timerAccum = 0;
    private popup: EggSelectPopup | null = null;
    private scrollCleanup: (() => void) | null = null;

    constructor() { super('NestsScene'); }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.timerAccum = 0;
        this.popup = null;
        this.scrollCleanup = null;
        const gw = getGameWidth();
        const gh = getGameHeight();
        this.add.rectangle(gw / 2, gh / 2, gw, gh, 0x12121e);
        this.slotsContainer = this.add.container(0, 0);
        const hdr = createSceneHeader({
            scene: this, titleKey: 'nests_title', backKey: 'nests_back',
            onBack: () => this.scene.start('MainScene'),
            coins: this.manager.progression.coins,
        });
        this.coinDisplay = hdr.coinDisplay;
        this.refreshSlots();
        this.createHint();
    }

    private createHint(): void {
        const port = isPortrait();
        const hintY = port ? 110 : 127;
        const fontSize = port ? '18px' : '14px';
        this.add.text(getGameWidth() / 2, hintY, t('nests_hint'), {
            fontFamily: UI.FONT_BODY, fontSize, color: '#666688',
        }).setOrigin(0.5);
    }

    private refreshSlots(): void {
        if (this.scrollCleanup) { this.scrollCleanup(); this.scrollCleanup = null; }
        this.slotsContainer.removeAll(true);
        const slots = this.manager.nests.getSlots();
        const visible: { index: number }[] = [];
        for (let i = 0; i < slots.length; i++) {
            visible.push({ index: i });
            if (!slots[i].unlocked) break;
        }
        const gw = getGameWidth();
        const gh = getGameHeight();
        const port = isPortrait();

        if (port) {
            this.refreshSlotsPortrait(visible, slots, gw, gh);
        } else {
            this.refreshSlotsLandscape(visible, slots, gw, gh);
        }
        this.coinDisplay?.updateCoins(this.manager.progression.coins);
    }

    private refreshSlotsLandscape(
        visible: { index: number }[], slots: ReturnType<GameManager['nests']['getSlots']>,
        gw: number, gh: number,
    ): void {
        const N = visible.length;
        const layout: SlotLayout = {
            slotY: gh / 2 + 15,
            btnY: gh / 2 + 15 + 125 + 30,
            btnW: 160, btnH: 42,
        };
        const totalW = N * SLOT_W + (N - 1) * SLOT_GAP;
        const startX = gw / 2 - totalW / 2 + SLOT_W / 2;

        for (let vi = 0; vi < N; vi++) {
            const { index } = visible[vi];
            const slot = slots[index];
            const x = startX + vi * (SLOT_W + SLOT_GAP);
            this.renderSlot(x, layout, slot, index);
        }
    }

    private refreshSlotsPortrait(
        visible: { index: number }[], slots: ReturnType<GameManager['nests']['getSlots']>,
        gw: number, gh: number,
    ): void {
        const N = visible.length;
        const SCALE = 1.2;
        const SLOT_H_V = SLOT_H * SCALE;   // 300 visual
        const BTN_H_V = 42 * SCALE;        // ~50 visual
        const GAP_CARD_BTN = 40;
        const GAP_BETWEEN = 20;
        const SLOT_STEP = SLOT_H_V + GAP_CARD_BTN + BTN_H_V + GAP_BETWEEN;
        const GRID_TOP = 145;
        const cx = gw / 2;

        const contentH = N * (SLOT_H_V + GAP_CARD_BTN + BTN_H_V) + (N - 1) * GAP_BETWEEN;
        const viewH = gh - GRID_TOP - 15;
        const maxScroll = Math.max(0, contentH - viewH);

        // Mask for scroll
        const maskGfx = this.make.graphics({});
        maskGfx.fillRect(0, GRID_TOP, gw, viewH);
        this.slotsContainer.setMask(maskGfx.createGeometryMask());

        for (let vi = 0; vi < N; vi++) {
            const { index } = visible[vi];
            const slot = slots[index];
            const slotY = GRID_TOP + SLOT_H_V / 2 + 10 + vi * SLOT_STEP;
            const btnY = slotY + SLOT_H_V / 2 + GAP_CARD_BTN;
            const layout: SlotLayout = { slotY, btnY, btnW: 160, btnH: 42, cardScale: SCALE };
            this.renderSlot(cx, layout, slot, index);
        }

        // Scroll handlers
        let scrollOffset = 0;
        const clampScroll = () => {
            scrollOffset = Phaser.Math.Clamp(scrollOffset, 0, maxScroll);
            this.slotsContainer.y = -scrollOffset;
        };
        const wheelHandler = (_p: Phaser.Input.Pointer, _go: GameObjects.GameObject[], _dx: number, dy: number) => {
            scrollOffset += dy * 0.5; clampScroll();
        };
        let dragY = 0;
        let startOff = 0;
        const downHandler = (p: Phaser.Input.Pointer) => {
            if (p.y > GRID_TOP) { dragY = p.y; startOff = scrollOffset; }
        };
        const moveHandler = (p: Phaser.Input.Pointer) => {
            if (p.isDown && dragY > 0) { scrollOffset = startOff - (p.y - dragY); clampScroll(); }
        };
        const upHandler = () => { dragY = 0; };

        this.input.on('wheel', wheelHandler);
        this.input.on('pointerdown', downHandler);
        this.input.on('pointermove', moveHandler);
        this.input.on('pointerup', upHandler);

        this.scrollCleanup = () => {
            this.input.off('wheel', wheelHandler);
            this.input.off('pointerdown', downHandler);
            this.input.off('pointermove', moveHandler);
            this.input.off('pointerup', upHandler);
            maskGfx.destroy();
            this.slotsContainer.clearMask(true);
        };
    }

    private renderSlot(
        x: number, layout: SlotLayout,
        slot: ReturnType<GameManager['nests']['getSlots']>[number], index: number,
    ): void {
        if (!slot.unlocked) {
            renderLockedSlot(this, this.slotsContainer, x, layout, index,
                this.manager.progression.coins, () => this.onBuySlot(index));
        } else if (slot.startTime === null) {
            renderEmptySlot(this, this.slotsContainer, x, layout, () => this.onSelect(index));
        } else if (this.manager.nests.isReady(index)) {
            renderReadySlot(this, this.slotsContainer, x, layout, slot, () => this.onCollect(index));
        } else {
            renderIncubatingSlot(this, this.slotsContainer, x, layout, slot,
                this.manager.nests, index, this.formatTime, () => this.onSpeedUp(index));
        }
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
            this, eggs,
            (tier) => { this.popup = null; this.manager.placeNestEgg(slotIndex, tier); this.refreshSlots(); },
            () => { this.popup = null; },
            () => { this.popup = null; this.manager.saveState(); this.scene.start('ShopScene', { tab: 'eggs' }); },
        );
    }

    private onCollect(slotIndex: number): void {
        const slot = this.manager.nests.getSlots()[slotIndex];
        const eggKey = slot.eggTier ? `egg_${slot.eggTier}` : 'egg_1';
        const result = this.manager.hatchNest(slotIndex);
        if (!result) return;
        const loader = this.registry.get('deferredLoader') as import('../loading/DeferredLoader').DeferredLoader | undefined;
        const showHatch = () => {
            new NestHatchOverlay(this).play(result, eggKey, async () => {
                this.refreshSlots();
                await showInterstitial(this);
            });
        };
        if (loader && !this.textures.exists(result.pet.imageKey)) {
            loader.ensurePet(result.pet.imageKey).then(showHatch);
        } else {
            showHatch();
        }
    }

    private onSpeedUp(index: number): void {
        const sdk = this.registry.get('platformSDK') as import('../platform/PlatformSDK').PlatformSDK | undefined;
        if (sdk) {
            sdk.showRewardedBreak().then((success: boolean) => {
                if (success) { this.manager.boostNestSlot(index); this.refreshSlots(); }
            });
        }
    }

    private onBuySlot(index: number): void {
        const price = NEST_CONFIG.slotPrices[index] ?? 0;
        if (this.manager.unlockNestSlot(index)) {
            this.coinDisplay?.showFloatingSpend(price, this);
            this.refreshSlots();
        } else {
            showToast(this, t('nests_no_coins'), 'error');
        }
    }

    update(_time: number, delta: number): void {
        this.manager.update(delta);
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
}
