/**
 * Lightweight save data peek for BootScene — reads level + collection
 * from localStorage without creating a full SaveSystem instance.
 * Used to determine which assets to load in Phase 1.
 */

const SAVE_KEY = 'pets_go_lite_save';
const HASH_SALT = 'pG!7kQ#xR2';

function computeHash(json: string): string {
    let h = 0x811c9dc5;
    const s = HASH_SALT + json;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
}

export interface SavePeekResult {
    level: number;
    collection: string[];
}

/** Read level + collection from localStorage without full SaveSystem */
export function peekSaveData(): SavePeekResult {
    const defaults: SavePeekResult = { level: 1, collection: [] };
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return defaults;
        const envelope = JSON.parse(raw) as { data?: { level?: number; collection?: string[] }; hash?: string };
        if (envelope.data && envelope.hash) {
            const json = JSON.stringify(envelope.data);
            if (computeHash(json) !== envelope.hash) return defaults;
            return {
                level: Math.max(1, Math.min(1000, envelope.data.level ?? 1)),
                collection: Array.isArray(envelope.data.collection) ? envelope.data.collection : [],
            };
        }
        // Legacy save format
        const legacy = envelope as unknown as { level?: number; collection?: string[] };
        return {
            level: Math.max(1, Math.min(1000, legacy.level ?? 1)),
            collection: Array.isArray(legacy.collection) ? legacy.collection : [],
        };
    } catch {
        return defaults;
    }
}
