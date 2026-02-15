import { PetDef } from '../types';

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

    /**
     * Sequential check from rarest to most common.
     * checkChance = min(1.0, luckMultiplier / pet.chance)
     * First pet to pass = result. Fallback = most common pet.
     */
    rollPet(eligiblePets: PetDef[], luckMultiplier: number): PetDef {
        const sorted = [...eligiblePets].sort((a, b) => b.chance - a.chance);

        for (const pet of sorted) {
            const checkChance = Math.min(1.0, luckMultiplier / pet.chance);
            if (this.next() < checkChance) {
                return pet;
            }
        }

        return sorted[sorted.length - 1];
    }
}
