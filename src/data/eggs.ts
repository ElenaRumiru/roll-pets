import { EggTier } from '../types';

export const EGG_TIERS: EggTier[] = [
    {
        id: 1,
        name: 'Basic Egg',
        levelMin: 1,
        levelMax: 5,
        color: 0xf5f5f5,
        accentColor: 0x81c784,
        particleColor: 0xffffff,
    },
    {
        id: 2,
        name: 'Golden Egg',
        levelMin: 6,
        levelMax: 12,
        color: 0xffd54f,
        accentColor: 0xffb300,
        particleColor: 0xffd700,
    },
    {
        id: 3,
        name: 'Crystal Egg',
        levelMin: 13,
        levelMax: 22,
        color: 0x81d4fa,
        accentColor: 0x4fc3f7,
        particleColor: 0x00bcd4,
    },
    {
        id: 4,
        name: 'Fire Egg',
        levelMin: 23,
        levelMax: 35,
        color: 0xff7043,
        accentColor: 0xff5722,
        particleColor: 0xff9800,
    },
    {
        id: 5,
        name: 'Cosmic Egg',
        levelMin: 36,
        levelMax: 999,
        color: 0x311b92,
        accentColor: 0x7c4dff,
        particleColor: 0xb388ff,
    },
];

export function getEggTierForLevel(level: number): EggTier {
    for (let i = EGG_TIERS.length - 1; i >= 0; i--) {
        if (level >= EGG_TIERS[i].levelMin) return EGG_TIERS[i];
    }
    return EGG_TIERS[0];
}
