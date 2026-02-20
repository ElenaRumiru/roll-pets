import { BUFF_CONFIG } from '../core/config';
import { BuffState } from '../types';

export type CountBuff = 'lucky' | 'super' | 'epic';

const OFFER_QUEUE: CountBuff[] = ['lucky', 'super', 'epic'];

export class BuffSystem {
    private counts: Record<CountBuff, number> = { lucky: 0, super: 0, epic: 0 };
    private autorollEnabled = false;
    private autorollRunning = false;

    private queueIndex = 0;
    private offerActive = false;
    private offerTimer = 0;
    private cooldownTimer = 0;

    addLucky(n: number): void {
        this.counts.lucky += n;
    }

    addSuper(n: number): void {
        this.counts.super += n;
    }

    addEpic(n: number): void {
        this.counts.epic += n;
    }

    setAutorollEnabled(enabled: boolean): void {
        this.autorollEnabled = enabled;
        if (!enabled) this.autorollRunning = false;
    }

    startAutoroll(): void {
        this.autorollRunning = true;
    }

    stopAutoroll(): void {
        this.autorollRunning = false;
    }

    update(deltaMs: number): void {
        if (this.offerActive) {
            this.offerTimer = Math.max(0, this.offerTimer - deltaMs);
            if (this.offerTimer <= 0) {
                this.offerActive = false;
                this.advanceQueue();
                this.cooldownTimer = BUFF_CONFIG.offer.cooldown;
            }
        } else if (this.cooldownTimer > 0) {
            this.cooldownTimer = Math.max(0, this.cooldownTimer - deltaMs);
            if (this.cooldownTimer <= 0) {
                this.offerActive = true;
                this.offerTimer = BUFF_CONFIG.offer.duration;
            }
        }
    }

    /** Consume one charge of each active count buff. Returns combined luck multiplier. */
    consumeForRoll(): number {
        let mult = 1;
        if (this.counts.lucky > 0) { this.counts.lucky--; mult *= BUFF_CONFIG.lucky.multiplier; }
        if (this.counts.super > 0) { this.counts.super--; mult *= BUFF_CONFIG.super.multiplier; }
        if (this.counts.epic > 0)  { this.counts.epic--;  mult *= BUFF_CONFIG.epic.multiplier; }
        return mult;
    }

    /** Preview multiplier without consuming */
    peekMultiplier(): number {
        let mult = 1;
        if (this.counts.lucky > 0) mult *= BUFF_CONFIG.lucky.multiplier;
        if (this.counts.super > 0) mult *= BUFF_CONFIG.super.multiplier;
        if (this.counts.epic > 0)  mult *= BUFF_CONFIG.epic.multiplier;
        return mult;
    }

    getCount(buff: CountBuff): number { return this.counts[buff]; }
    isAutorollActive(): boolean { return this.autorollEnabled && this.autorollRunning; }
    isAutorollEnabled(): boolean { return this.autorollEnabled; }

    /** Get the buff type of the current offer */
    getCurrentOffer(): CountBuff {
        return OFFER_QUEUE[this.queueIndex];
    }

    /** Is an offer currently being displayed? */
    isOfferActive(): boolean { return this.offerActive; }

    /** Remaining ms on the current offer timer */
    getOfferRemaining(): number { return this.offerActive ? this.offerTimer : 0; }

    /** Player watched the ad — consume the offer and start cooldown */
    consumeOffer(): void {
        this.offerActive = false;
        this.offerTimer = 0;
        this.advanceQueue();
        this.cooldownTimer = BUFF_CONFIG.offer.cooldown;
    }

    /** Start the initial cooldown (called on game start) */
    startOfferCooldown(): void {
        if (!this.offerActive && this.cooldownTimer <= 0) {
            this.cooldownTimer = BUFF_CONFIG.offer.cooldown;
        }
    }

    private advanceQueue(): void {
        this.queueIndex = (this.queueIndex + 1) % OFFER_QUEUE.length;
    }

    loadFromSave(buffs: BuffState): void {
        this.counts.lucky = buffs.lucky;
        this.counts.super = buffs.super;
        this.counts.epic = buffs.epic;
        this.autorollEnabled = buffs.autorollEnabled ?? false;
        this.autorollRunning = buffs.autorollRunning ?? false;
        this.queueIndex = (buffs.queueIndex ?? 0) % OFFER_QUEUE.length;
    }

    toSave(): BuffState {
        return {
            lucky: this.counts.lucky,
            super: this.counts.super,
            epic: this.counts.epic,
            autorollEnabled: this.autorollEnabled,
            autorollRunning: this.autorollRunning,
            queueIndex: this.queueIndex,
        };
    }
}
