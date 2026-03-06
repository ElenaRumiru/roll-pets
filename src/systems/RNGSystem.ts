import { PetDef } from '../types';

export function splitmix32(a: number): () => number {
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

export function sfc32(a: number, b: number, c: number, d: number): () => number {
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

    /**
     * Single-roll sequential check from rarest to most common.
     * One random value per roll; first pet whose threshold exceeds it wins.
     * checkChance = min(1.0, luckMultiplier / pet.chance)
     * Fallback = most common pet.
     */
    rollPet(eligiblePets: PetDef[], luckMultiplier: number): PetDef {
        const sorted = [...eligiblePets].sort((a, b) => b.chance - a.chance);
        const r = this.next();

        for (const pet of sorted) {
            const checkChance = Math.min(1.0, luckMultiplier / pet.chance);
            if (r < checkChance) {
                return pet;
            }
        }

        return sorted[sorted.length - 1];
    }
}
