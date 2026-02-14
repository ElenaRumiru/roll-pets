export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface PetDef {
    id: string;
    name: string;
    emoji: string;
    imageKey: string;
    rarity: Rarity;
}

export interface EggTier {
    id: number;
    name: string;
    levelMin: number;
    levelMax: number;
    color: number;
    accentColor: number;
    particleColor: number;
}

export interface BackgroundTheme {
    id: string;
    name: string;
    levelMin: number;
    levelMax: number;
    gradientTop: number;
    gradientBottom: number;
}

export interface RarityConfig {
    baseWeight: number;
    color: number;
    colorHex: string;
    outlineColor: number;
    outlineHex: string;
    label: string;
    xpNewPercent: number;
    xpDupPercent: number;
    luckBonus: number;
}

export interface RollResult {
    pet: PetDef;
    isNew: boolean;
    xpGained: number;
    rarity: Rarity;
}

export interface RollLogEntry {
    id: string;
    rarity: Rarity;
    isNew: boolean;
    xp: number;
}

export interface SaveData {
    version: number;
    level: number;
    xp: number;
    collection: string[];
    totalRolls: number;
    settings: { music: boolean; sfx: boolean; volume: number };
    buffs: { x2xp: number; autoroll: number; luck: number };
    rollLog: RollLogEntry[];
}
