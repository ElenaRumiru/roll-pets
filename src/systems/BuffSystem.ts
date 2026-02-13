import { BUFF_DURATIONS } from '../core/config';

export type BuffType = 'x2xp' | 'autoroll' | 'luck';

export class BuffSystem {
    private timers: Record<BuffType, number> = {
        x2xp: 0,
        autoroll: 0,
        luck: 0,
    };

    activate(buff: BuffType): void {
        this.timers[buff] = BUFF_DURATIONS[buff];
    }

    update(deltaMs: number): void {
        for (const key of Object.keys(this.timers) as BuffType[]) {
            if (this.timers[key] > 0) {
                this.timers[key] = Math.max(0, this.timers[key] - deltaMs);
            }
        }
    }

    isActive(buff: BuffType): boolean {
        return this.timers[buff] > 0;
    }

    getRemaining(buff: BuffType): number {
        return this.timers[buff];
    }

    loadFromSave(buffs: Record<BuffType, number>): void {
        this.timers = { ...buffs };
    }

    toSave(): Record<BuffType, number> {
        return { ...this.timers };
    }
}
