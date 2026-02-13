import { BackgroundTheme } from '../types';

export const BACKGROUNDS: BackgroundTheme[] = [
    {
        id: 'meadow',
        name: 'Meadow',
        levelMin: 1,
        levelMax: 5,
        gradientTop: 0x87ceeb,
        gradientBottom: 0x90ee90,
    },
    {
        id: 'forest',
        name: 'Forest',
        levelMin: 6,
        levelMax: 12,
        gradientTop: 0x2e7d32,
        gradientBottom: 0x00897b,
    },
    {
        id: 'cave',
        name: 'Cave',
        levelMin: 13,
        levelMax: 22,
        gradientTop: 0x616161,
        gradientBottom: 0x6a1b9a,
    },
    {
        id: 'volcano',
        name: 'Volcano',
        levelMin: 23,
        levelMax: 35,
        gradientTop: 0xff6f00,
        gradientBottom: 0xb71c1c,
    },
    {
        id: 'cosmos',
        name: 'Cosmos',
        levelMin: 36,
        levelMax: 999,
        gradientTop: 0x1a237e,
        gradientBottom: 0x000000,
    },
];

export function getBackgroundForLevel(level: number): BackgroundTheme {
    for (let i = BACKGROUNDS.length - 1; i >= 0; i--) {
        if (level >= BACKGROUNDS[i].levelMin) return BACKGROUNDS[i];
    }
    return BACKGROUNDS[0];
}
