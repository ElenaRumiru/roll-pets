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
    coinsNew: number;
    coinsDup: number;
    minChance: number;
    maxChance: number;
}

export interface RollResult {
    pet: PetDef;
    isNew: boolean;
    xpGained: number;
    coinsGained: number;
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
    coinReward: number;
}

export interface LeaguePromotionData {
    tier: LeagueTier;
    coinReward: number;
}

export interface SaveData {
    version: number;
    level: number;
    xp: number;
    coins: number;
    collection: string[];
    totalRolls: number;
    settings: { music: boolean; sfx: boolean; volume: number; sfxVolume: number; language: string };
    buffs: BuffState;
    rollLog: RollLogEntry[];
    nickname: string;
    newPets: string[];
    quests: QuestState;
    shop: ShopState;
    dailyBonus: DailyBonusState;
}

export interface BuffState {
    lucky: number;
    super: number;
    epic: number;
    autorollEnabled: boolean;
    autorollRunning: boolean;
    queueIndex?: number;
}

export interface QuestProgress {
    current: number;
    target: number;
    sequenceIndex: number;
}

export interface OnlineQuestProgress {
    current: number;       // seconds accumulated today
    target: number;        // target in seconds
    sequenceIndex: number;
}

export interface QuestMilestoneState {
    completedCount: number;       // quests completed today (0..N)
    claimedMilestones: number[];  // indices of claimed milestone rewards
}

export interface QuestState {
    lastResetDate: string;
    rollQuest: QuestProgress;
    gradeQuest: QuestProgress;
    onlineQuest: OnlineQuestProgress;
    milestones: QuestMilestoneState;
}

export interface ShopOffer {
    petId: string;
    price: number;
}

export interface ShopState {
    lastRefreshDate: string;
    offers: ShopOffer[];
}

// ── Daily Bonus ──

export interface DailyBonusReward {
    type: 'buff' | 'coins';
    buffType?: 'lucky' | 'super' | 'epic';
    count: number;
}

export interface DailyBonusState {
    totalLogins: number;
    weekDay: number;
    lastLoginDate: string;
    claimedToday: boolean;
    monthMilestonesClaimed: boolean[];
}

// ── Leaderboard / Leagues ──

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'master';

export interface LeagueConfig {
    tier: LeagueTier;
    label: string;       // locale key, e.g. 'league_bronze'
    color: number;       // Phaser hex tint
    colorHex: string;    // CSS hex for text
    minChance: number;   // inclusive lower bound
    maxChance: number;   // exclusive upper bound
}

export interface LeaderboardEntry {
    name: string;
    chance: number;      // best pet's chance value
    isPlayer: boolean;
}
