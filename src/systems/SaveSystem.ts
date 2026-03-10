import { SaveData, Grade } from '../types';
import { PETS } from '../data/pets';
import { getGradeForChance, getDefaultQuestState, getDefaultDailyBonusState, getDefaultNestState, REBIRTH_CONFIG } from '../core/config';

const SAVE_KEY = 'pets_go_lite_save';
const CURRENT_VERSION = 21;
const HASH_SALT = 'pG!7kQ#xR2';

const VALID_PET_IDS = new Set(PETS.map(p => p.id));

export type DeepReadonly<T> =
    T extends (infer U)[] ? readonly DeepReadonly<U>[]
    : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

function computeHash(json: string): string {
    let h = 0x811c9dc5;
    const s = HASH_SALT + json;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
}

function validateData(data: SaveData): void {
    data.level = Math.max(1, Math.min(1000, Math.floor(data.level) || 1));
    data.coins = Math.max(0, Math.floor(data.coins) || 0);
    data.xp = Math.max(0, data.xp || 0);
    data.totalRolls = Math.max(0, Math.floor(data.totalRolls) || 0);
    data.rebirthCount = Math.max(0, Math.min(REBIRTH_CONFIG.maxCount, Math.floor(data.rebirthCount) || 0));
    data.collection = data.collection.filter(id => VALID_PET_IDS.has(id));
    const b = data.buffs;
    b.lucky = Math.max(0, Math.min(9999, Math.floor(b.lucky) || 0));
    b.super = Math.max(0, Math.min(9999, Math.floor(b.super) || 0));
    b.epic = Math.max(0, Math.min(9999, Math.floor(b.epic) || 0));
    b.dream = Math.max(0, Math.min(9999, Math.floor(b.dream) || 0));
    const validInv: Record<string, number> = {};
    for (const [k, v] of Object.entries(data.eggInventory)) {
        const tier = parseInt(k, 10);
        if (tier >= 1 && tier <= 17 && typeof v === 'number' && v > 0) {
            validInv[k] = Math.floor(v);
        }
    }
    data.eggInventory = validInv;
}

function getDefaults(): SaveData {
    return {
        version: CURRENT_VERSION,
        level: 1,
        xp: 0,
        coins: 0,
        collection: [],
        totalRolls: 0,
        settings: { music: true, sfx: true, volume: 0.3, sfxVolume: 0.2, language: 'en' },
        buffs: { lucky: 0, super: 0, epic: 0, dream: 0, autorollEnabled: false, autorollRunning: false, queueIndex: 0 },
        rollLog: [],
        nickname: '',
        newPets: [],
        quests: getDefaultQuestState(),
        shop: { lastRefreshDate: '', offers: [] },
        dailyBonus: getDefaultDailyBonusState(),
        nests: getDefaultNestState(),
        eggInventory: { '1': 3 },
        rebirthCount: 0,
        collectionsClaimed: {},
        collectionsSeenPets: {},
    };
}

function migrate(data: SaveData): SaveData {
    if (data.version === 2) {
        if (data.settings.volume === undefined) data.settings.volume = 0.3;
        if (data.settings.sfxVolume === undefined) data.settings.sfxVolume = 0.2;
        data.version = 3;
    }
    if (data.version === 3) {
        (data as unknown as Record<string, unknown>).buffs = {
            lucky: 0,
            super: 0,
            epic: 0,
            autoroll: 0,
            autorollPaused: false,
        };
        data.version = 4;
    }
    if (data.version === 4) {
        data.nickname = data.nickname ?? '';
        data.version = 5;
    }
    if (data.version === 5) {
        // Migrate rollLog: rarity → grade (recompute from pet chance)
        for (const entry of data.rollLog) {
            const old = entry as unknown as { rarity?: string; grade?: Grade };
            if (old.rarity && !old.grade) {
                const pet = PETS.find(p => p.id === entry.id);
                entry.grade = pet ? getGradeForChance(pet.chance) : 'common';
                delete old.rarity;
            }
        }
        data.version = 6;
    }
    if (data.version === 6) {
        data.newPets = data.newPets ?? [];
        data.version = 7;
    }
    if (data.version === 7) {
        const old = data.buffs as unknown as Record<string, unknown>;
        data.buffs = {
            lucky: data.buffs.lucky,
            super: data.buffs.super,
            epic: data.buffs.epic,
            dream: 0,
            autorollEnabled: false,
            autorollRunning: false,
        };
        (data.buffs as unknown as Record<string, unknown>).epicTimer = old.epicTimer;
        data.version = 8;
    }
    if (data.version === 8) {
        data.quests = getDefaultQuestState();
        data.version = 9;
    }
    if (data.version === 9) {
        delete (data.buffs as unknown as Record<string, unknown>).epicTimer;
        data.buffs.queueIndex = 0;
        data.version = 10;
    }
    if (data.version === 10) {
        data.collection = [];
        data.rollLog = [];
        data.newPets = [];
        data.totalRolls = 0;
        data.level = 1;
        data.xp = 0;
        data.version = 11;
    }
    if (data.version === 11) {
        data.coins = data.coins ?? 0;
        data.version = 12;
    }
    if (data.version === 12) {
        data.shop = { lastRefreshDate: '', offers: [] };
        data.version = 13;
    }
    if (data.version === 13) {
        data.settings.language = data.settings.language ?? 'en';
        data.version = 14;
    }
    if (data.version === 14) {
        const q = data.quests;
        if (!q.onlineQuest) {
            q.onlineQuest = { current: 0, target: 180, sequenceIndex: 0 };
        }
        if (!q.milestones) {
            q.milestones = { completedCount: 0, claimedMilestones: [] };
        }
        data.version = 15;
    }
    if (data.version === 15) {
        data.dailyBonus = getDefaultDailyBonusState();
        data.version = 16;
    }
    if (data.version === 16) {
        data.nests = getDefaultNestState();
        data.version = 17;
    }
    if (data.version === 17) {
        data.eggInventory = data.eggInventory ?? {};
        if (data.nests) {
            data.nests.slots.forEach(s => {
                (s as unknown as Record<string, unknown>).buffMultiplier ??= 1;
            });
        }
        data.version = 18;
    }
    if (data.version === 18) {
        data.rebirthCount = data.rebirthCount ?? 0;
        data.version = 19;
    }
    if (data.version === 19) {
        data.collectionsClaimed = data.collectionsClaimed ?? {};
        data.collectionsSeenPets = data.collectionsSeenPets ?? {};
        data.version = 20;
    }
    if (data.version === 20) {
        // Migrate collectionsSeenPets from Record<string,number> to Record<string,string[]>
        const old = data.collectionsSeenPets as unknown as Record<string, number | string[]>;
        const migrated: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(old)) {
            if (Array.isArray(v)) migrated[k] = v;
            else migrated[k] = []; // drop count-based data, will rebuild on next view
        }
        data.collectionsSeenPets = migrated;
        data.version = 21;
    }
    return data;
}

export class SaveSystem {
    private data: SaveData;

    constructor() {
        this.data = this.load();
    }

    private load(): SaveData {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const envelope = JSON.parse(raw) as { data?: SaveData; hash?: string };
                let parsed: SaveData;
                if (envelope.data && envelope.hash) {
                    const json = JSON.stringify(envelope.data);
                    if (computeHash(json) !== envelope.hash) return getDefaults();
                    parsed = envelope.data;
                } else {
                    // Legacy save without hash — accept once, will be re-saved with hash
                    parsed = envelope as unknown as SaveData;
                }
                if (parsed.version < CURRENT_VERSION) migrate(parsed);
                const result = this.patchDefaults(parsed);
                validateData(result);
                return result;
            }
        } catch { /* localStorage unavailable or corrupted */ }
        return getDefaults();
    }

    /** Fill in any missing settings fields with defaults */
    private patchDefaults(data: SaveData): SaveData {
        const defaults = getDefaults();
        data.version = CURRENT_VERSION;
        data.settings = { ...defaults.settings, ...data.settings };
        data.buffs = { ...defaults.buffs, ...data.buffs };
        data.quests = data.quests ?? getDefaultQuestState();
        const dq = getDefaultQuestState();
        data.quests.onlineQuest = data.quests.onlineQuest ?? dq.onlineQuest;
        data.quests.milestones = data.quests.milestones ?? dq.milestones;
        data.dailyBonus = data.dailyBonus ?? getDefaultDailyBonusState();
        data.nests = data.nests ?? getDefaultNestState();
        data.eggInventory = data.eggInventory ?? {};
        data.collectionsClaimed = data.collectionsClaimed ?? {};
        data.collectionsSeenPets = data.collectionsSeenPets ?? {};
        return data;
    }

    save(): void {
        try {
            const json = JSON.stringify(this.data);
            const envelope = JSON.stringify({ data: this.data, hash: computeHash(json) });
            localStorage.setItem(SAVE_KEY, envelope);
        } catch { /* silently fail */ }
    }

    getData(): DeepReadonly<SaveData> {
        return this.data;
    }

    update(fn: (data: SaveData) => void): void {
        fn(this.data);
        this.save();
    }

    getNickname(): string {
        return this.data.nickname;
    }

    setNickname(name: string): void {
        this.data.nickname = name;
        this.save();
    }

    addNewPet(id: string): void {
        this.data.newPets.push(id);
        this.save();
    }

    getNewPets(): string[] {
        return this.data.newPets;
    }

    clearNewPets(): void {
        this.data.newPets = [];
        this.save();
    }

    removeNewPets(ids: readonly string[]): void {
        const toRemove = new Set(ids);
        this.data.newPets = this.data.newPets.filter(id => !toRemove.has(id));
        this.save();
    }

    reset(): void {
        this.data = getDefaults();
        this.save();
    }
}
