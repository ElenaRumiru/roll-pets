export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface PetDef {
    id: string;
    name: string;
    emoji: string;
    imageKey: string;
    rarity: Rarity;
    chance: number; // X from "1 in X" — individual pet drop chance
}

export interface EggTier {
    id: number;
    levelMin: number;
    levelMax: number;
    filter: number; // pets with chance <= filter are excluded from this egg
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
    settings: { music: boolean; sfx: boolean; volume: number; sfxVolume: number };
    buffs: BuffState;
    rollLog: RollLogEntry[];
}

export interface BuffState {
    lucky: number;    // count of Lucky Rolls remaining
    super: number;    // count of Super Rolls remaining
    epic: number;     // count of Epic Rolls remaining
    autoroll: number; // ms remaining for autoroll timer
    autorollPaused: boolean; // true when user stopped autoroll (time preserved)
}
