import { NestSlot, NestState } from '../types';
import { NEST_CONFIG } from '../core/config';

export class NestSystem {
    private slots: NestSlot[] = [];

    loadFromSave(state: NestState): void {
        this.slots = state.slots.map(s => ({ ...s }));
        while (this.slots.length < NEST_CONFIG.maxSlots) {
            this.slots.push({
                unlocked: false, eggTier: null, level: null,
                startTime: null, duration: NEST_CONFIG.incubationMs, boosted: false,
                buffMultiplier: 1,
            });
        }
        for (const s of this.slots) {
            if (s.boosted === undefined) s.boosted = false;
            if (s.buffMultiplier === undefined) (s as unknown as Record<string, unknown>).buffMultiplier = 1;
        }
    }

    toSave(): NestState {
        return { slots: this.slots.map(s => ({ ...s })) };
    }

    getSlots(): NestSlot[] {
        return this.slots;
    }

    unlockSlot(index: number, currentCoins: number): boolean {
        const slot = this.slots[index];
        if (!slot || slot.unlocked) return false;
        const price = NEST_CONFIG.slotPrices[index] ?? 0;
        if (currentCoins < price) return false;
        slot.unlocked = true;
        return true;
    }

    placeEgg(slotIndex: number, eggTier: number, level: number, duration: number, buffMultiplier: number): boolean {
        const slot = this.slots[slotIndex];
        if (!slot || !slot.unlocked || slot.startTime !== null) return false;
        slot.eggTier = eggTier;
        slot.level = level;
        slot.startTime = Date.now();
        slot.duration = duration;
        slot.buffMultiplier = buffMultiplier;
        slot.boosted = false;
        return true;
    }

    collectHatch(slotIndex: number): { eggTier: number; level: number; buffMultiplier: number } | null {
        const slot = this.slots[slotIndex];
        if (!slot || !this.isReady(slotIndex)) return null;
        const info = { eggTier: slot.eggTier!, level: slot.level!, buffMultiplier: slot.buffMultiplier };
        slot.eggTier = null;
        slot.level = null;
        slot.startTime = null;
        slot.buffMultiplier = 1;
        return info;
    }

    isReady(index: number): boolean {
        const slot = this.slots[index];
        if (!slot || slot.startTime === null) return false;
        return Date.now() >= slot.startTime + slot.duration;
    }

    getTimeRemainingMs(index: number): number {
        const slot = this.slots[index];
        if (!slot || slot.startTime === null) return 0;
        return Math.max(0, (slot.startTime + slot.duration) - Date.now());
    }

    boostSlot(index: number): boolean {
        const slot = this.slots[index];
        if (!slot || slot.startTime === null || slot.boosted) return false;
        if (this.isReady(index)) return false;
        slot.duration = Math.round(slot.duration * 0.7);
        slot.boosted = true;
        return true;
    }

    hasReadyNest(): boolean {
        return this.slots.some((_, i) => this.isReady(i));
    }

    getReadyCount(): number {
        return this.slots.filter((_, i) => this.isReady(i)).length;
    }

    hasEmptySlot(): boolean {
        return this.slots.some(s => s.unlocked && s.startTime === null);
    }
}
