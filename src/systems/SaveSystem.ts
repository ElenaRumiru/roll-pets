import { SaveData, Grade } from '../types';
import { PETS } from '../data/pets';
import { getGradeForChance } from '../core/config';

const SAVE_KEY = 'pets_go_lite_save';
const CURRENT_VERSION = 6;

function getDefaults(): SaveData {
    return {
        version: CURRENT_VERSION,
        level: 1,
        xp: 0,
        collection: [],
        totalRolls: 0,
        settings: { music: true, sfx: true, volume: 0.3, sfxVolume: 0.2 },
        buffs: { lucky: 0, super: 0, epic: 0, autoroll: 0, autorollPaused: false },
        rollLog: [],
        nickname: '',
    };
}

function migrate(data: SaveData): SaveData {
    if (data.version === 2) {
        if (data.settings.volume === undefined) data.settings.volume = 0.3;
        if (data.settings.sfxVolume === undefined) data.settings.sfxVolume = 0.2;
        data.version = 3;
    }
    if (data.version === 3) {
        const old = data.buffs as unknown as { x2xp: number; autoroll: number; luck: number };
        data.buffs = {
            lucky: 0,
            super: 0,
            epic: 0,
            autoroll: old?.autoroll ?? 0,
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

    reset(): void {
        this.data = getDefaults();
        this.save();
    }
}
