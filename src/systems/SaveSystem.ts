import { SaveData, Grade } from '../types';
import { PETS } from '../data/pets';
import { getGradeForChance, getDefaultQuestState } from '../core/config';

const SAVE_KEY = 'pets_go_lite_save';
const CURRENT_VERSION = 12;

function getDefaults(): SaveData {
    return {
        version: CURRENT_VERSION,
        level: 1,
        xp: 0,
        coins: 0,
        collection: [],
        totalRolls: 0,
        settings: { music: true, sfx: true, volume: 0.3, sfxVolume: 0.2 },
        buffs: { lucky: 0, super: 0, epic: 0, autorollEnabled: false, autorollRunning: false, queueIndex: 0 },
        rollLog: [],
        nickname: '',
        newPets: [],
        quests: getDefaultQuestState(),
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
                const parsed = JSON.parse(raw) as SaveData;
                if (parsed.version < CURRENT_VERSION) migrate(parsed);
                return this.patchDefaults(parsed);
            }
        } catch { /* localStorage unavailable */ }
        return getDefaults();
    }

    /** Fill in any missing settings fields with defaults */
    private patchDefaults(data: SaveData): SaveData {
        const defaults = getDefaults();
        data.version = CURRENT_VERSION;
        data.settings = { ...defaults.settings, ...data.settings };
        data.buffs = { ...defaults.buffs, ...data.buffs };
        data.quests = data.quests ?? getDefaultQuestState();
        return data;
    }

    save(): void {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
        } catch { /* silently fail */ }
    }

    getData(): SaveData {
        return this.data;
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

    reset(): void {
        this.data = getDefaults();
        this.save();
    }
}
