import { SaveData } from '../types';

const SAVE_KEY = 'pets_go_lite_save';
const CURRENT_VERSION = 3;

function getDefaults(): SaveData {
    return {
        version: CURRENT_VERSION,
        level: 1,
        xp: 0,
        collection: [],
        totalRolls: 0,
        settings: { music: true, sfx: true, volume: 0.3, sfxVolume: 0.2 },
        buffs: { x2xp: 0, autoroll: 0, luck: 0 },
        rollLog: [],
    };
}

function migrate(data: SaveData): SaveData {
    if (data.version === 2) {
        if (data.settings.volume === undefined) data.settings.volume = 0.3;
        if (data.settings.sfxVolume === undefined) data.settings.sfxVolume = 0.2;
        data.version = 3;
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

    reset(): void {
        this.data = getDefaults();
        this.save();
    }
}
