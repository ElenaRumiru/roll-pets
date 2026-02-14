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
        settings: { music: true, sfx: true, volume: 0.3 },
        buffs: { x2xp: 0, autoroll: 0, luck: 0 },
        rollLog: [],
    };
}

function migrate(data: SaveData): SaveData {
    if (data.version === 2) {
        if (data.settings.volume === undefined) data.settings.volume = 0.3;
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
                if (parsed.version === CURRENT_VERSION) return parsed;
                if (parsed.version < CURRENT_VERSION) return migrate(parsed);
            }
        } catch { /* localStorage unavailable */ }
        return getDefaults();
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
