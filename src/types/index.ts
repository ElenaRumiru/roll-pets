export type Grade =
    | 'common' | 'uncommon' | 'improved' | 'rare' | 'valuable'
    | 'elite' | 'epic' | 'heroic' | 'mythic' | 'ancient' | 'legendary'
    | 'astral' | 'cosmic' | 'divine' | 'absolute';

export interface PetDef {
    id: string;
    name: string;
    emoji: string;
    imageKey: string;
    chance: number; // X from "1 in X" — grade derived via getGradeForChance()
}

export interface GradeConfig {
    color: number;
    colorHex: string;
    outlineColor: number;
    outlineHex: string;
    strokeThickness: number;
    label: string;
    xpNewPercent: number;
    xpDupPercent: number;
    minChance: number;
    maxChance: number;
}

export interface RollResult {
    pet: PetDef;
    isNew: boolean;
    xpGained: number;
    grade: Grade;
}

export interface RollLogEntry {
    id: string;
    grade: Grade;
    isNew: boolean;
    xp: number;
}

export interface LevelUpData {
    level: number;
    eggKey: string;
    bgKey: string;
    oldEggKey: string;
    eggChanged: boolean;
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
    nickname: string;
    newPets: string[];
}

export interface BuffState {
    lucky: number;
    super: number;
    epic: number;
    autoroll: number;
    autorollPaused: boolean;
    epicTimer?: number;
}
