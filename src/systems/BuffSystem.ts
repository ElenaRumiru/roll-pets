import { BUFF_CONFIG } from '../core/config';
import { BuffState } from '../types';

export type CountBuff = 'lucky' | 'super' | 'epic';

export class BuffSystem {
    private counts: Record<CountBuff, number> = { lucky: 0, super: 0, epic: 0 };
    private autorollEnabled = false;
    private autorollRunning = false;
    private epicTimer = 0;
    private superCooldown = 0;
    private _superOffered = false;
    private superOfferTimer = 0;

    addLucky(n: number): void {
        this.counts.lucky += n;
    }

    addSuper(n: number): void {
        this.counts.super += n;
        this._superOffered = false;
        this.superOfferTimer = 0;
        this.superCooldown = BUFF_CONFIG.super.offerCooldown;
    }

    addEpic(n: number): void {
        this.counts.epic = Math.min(this.counts.epic + n, BUFF_CONFIG.epic.maxStack);
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
        if (this.epicTimer < BUFF_CONFIG.epic.timer) {
            this.epicTimer = Math.min(this.epicTimer + deltaMs, BUFF_CONFIG.epic.timer);
        }

        if (this._superOffered) {
            this.superOfferTimer = Math.max(0, this.superOfferTimer - deltaMs);
            if (this.superOfferTimer <= 0) {
                this._superOffered = false;
                this.superCooldown = BUFF_CONFIG.super.offerCooldown;
            }
        } else if (this.superCooldown > 0) {
            this.superCooldown = Math.max(0, this.superCooldown - deltaMs);
            if (this.superCooldown <= 0) {
                this._superOffered = true;
                this.superOfferTimer = BUFF_CONFIG.super.offerDuration;
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
    isSuperOffered(): boolean { return this._superOffered; }
    getSuperOfferRemaining(): number { return this.superOfferTimer; }
    getSuperCooldown(): number { return this.superCooldown; }
    getEpicTimerRemaining(): number { return Math.max(0, BUFF_CONFIG.epic.timer - this.epicTimer); }

    /** Claim epic charge (player clicked the button). Returns true if granted. */
    claimEpic(): boolean {
        if (this.epicTimer < BUFF_CONFIG.epic.timer) return false;
        this.addEpic(1);
        this.epicTimer = 0;
        return true;
    }

    isEpicReady(): boolean {
        return this.epicTimer >= BUFF_CONFIG.epic.timer;
    }

    /** Mark super offer as consumed (button slides out) */
    consumeSuperOffer(): void {
        this._superOffered = false;
    }

    /** Start the super cooldown (e.g., on first load) */
    startSuperCooldown(): void {
        if (this.superCooldown <= 0 && !this._superOffered) {
            this.superCooldown = BUFF_CONFIG.super.offerCooldown;
        }
    }

    loadFromSave(buffs: BuffState): void {
        this.counts.lucky = buffs.lucky;
        this.counts.super = buffs.super;
        this.counts.epic = buffs.epic;
        this.autorollEnabled = buffs.autorollEnabled ?? false;
        this.autorollRunning = buffs.autorollRunning ?? false;
        this.epicTimer = buffs.epicTimer ?? 0;
    }

    toSave(): BuffState {
        return {
            lucky: this.counts.lucky,
            super: this.counts.super,
            epic: this.counts.epic,
            autorollEnabled: this.autorollEnabled,
            autorollRunning: this.autorollRunning,
            epicTimer: this.epicTimer,
        };
    }
}
