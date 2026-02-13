import { Rarity } from '../types';
import { RARITY, RARITY_ORDER } from '../core/config';

function splitmix32(a: number): () => number {
    return () => {
        a |= 0;
        a = (a + 0x9e3779b9) | 0;
        let t = a ^ (a >>> 16);
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ (t >>> 15);
        t = Math.imul(t, 0x735a2d97);
        return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
    };
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
    return () => {
        a |= 0; b |= 0; c |= 0; d |= 0;
        const t = ((a + b) | 0) + d | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

export class RNGSystem {
    private rng: () => number;

    constructor(seed?: number) {
        const s = splitmix32(seed ?? (Date.now() ^ (Math.random() * 0x100000000)));
        this.rng = sfc32(s() * 2 ** 32, s() * 2 ** 32, s() * 2 ** 32, s() * 2 ** 32);
    }

    next(): number {
        return this.rng();
    }

    nextInt(min: number, max: number): number {
        return min + Math.floor(this.next() * (max - min + 1));
    }

    weightedRandom<T>(items: { value: T; weight: number }[]): T {
        const total = items.reduce((sum, item) => sum + item.weight, 0);
        let roll = this.next() * total;
        for (const item of items) {
            roll -= item.weight;
            if (roll <= 0) return item.value;
        }
        return items[items.length - 1].value;
    }

    rollRarity(level: number, luckBuff: boolean): Rarity {
        const weights = RARITY_ORDER.map(r => {
            const cfg = RARITY[r];
            let w = cfg.baseWeight + level * cfg.luckBonus;
            if (luckBuff && r !== 'common') w *= 1.05;
            return { value: r, weight: Math.max(0, w) };
        });
        return this.weightedRandom(weights);
    }
}
