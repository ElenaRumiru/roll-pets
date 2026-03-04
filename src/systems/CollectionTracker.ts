import { COLLECTIONS, CollectionDef, getCollectionsByPetId } from '../data/collections';

export interface CollectionEvent {
    discovered: string[];   // collectionIds discovered for the first time
    completed: string[];    // collectionIds just completed
}

export class CollectionTracker {
    private claimed: Record<string, boolean> = {};
    private seenPets: Record<string, string[]> = {};

    loadFromSave(claimed: Record<string, boolean>, seenPets: Record<string, string[]>): void {
        this.claimed = { ...claimed };
        this.seenPets = {};
        for (const [k, v] of Object.entries(seenPets)) {
            this.seenPets[k] = Array.isArray(v) ? [...v] : [];
        }
    }

    toSaveClaimed(): Record<string, boolean> { return { ...this.claimed }; }
    toSaveSeenPets(): Record<string, string[]> {
        const out: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(this.seenPets)) out[k] = [...v];
        return out;
    }

    /**
     * Called after a new pet is added to the player's collection.
     * Returns IDs of newly discovered and newly completed collections.
     */
    onPetCollected(petId: string, playerCollection: Set<string>): CollectionEvent {
        const result: CollectionEvent = { discovered: [], completed: [] };
        const affected = getCollectionsByPetId(petId);
        for (const coll of affected) {
            const progress = this.getProgress(coll, playerCollection);
            if (progress.current === 1) result.discovered.push(coll.id);
            if (progress.current === progress.total && !this.claimed[coll.id]) {
                result.completed.push(coll.id);
            }
        }
        return result;
    }

    isDiscovered(collId: string, playerCollection: Set<string>): boolean {
        const coll = COLLECTIONS.find(c => c.id === collId);
        if (!coll) return false;
        return coll.petIds.some(id => playerCollection.has(id));
    }

    isComplete(collId: string, playerCollection: Set<string>): boolean {
        const coll = COLLECTIONS.find(c => c.id === collId);
        if (!coll) return false;
        return coll.petIds.every(id => playerCollection.has(id));
    }

    getProgress(coll: CollectionDef, playerCollection: Set<string>): { current: number; total: number } {
        const current = coll.petIds.filter(id => playerCollection.has(id)).length;
        return { current, total: coll.petIds.length };
    }

    getProgressById(collId: string, playerCollection: Set<string>): { current: number; total: number } {
        const coll = COLLECTIONS.find(c => c.id === collId);
        if (!coll) return { current: 0, total: 0 };
        return this.getProgress(coll, playerCollection);
    }

    claim(collId: string): boolean {
        if (this.claimed[collId]) return false;
        this.claimed[collId] = true;
        return true;
    }

    isClaimed(collId: string): boolean { return this.claimed[collId] === true; }

    /** Mark all owned pets of this collection as "seen". */
    markSeen(collId: string, playerCollection: Set<string>): void {
        const coll = COLLECTIONS.find(c => c.id === collId);
        if (!coll) return;
        this.seenPets[collId] = coll.petIds.filter(id => playerCollection.has(id));
    }

    /** Get pet IDs that are owned but not yet seen in this collection. */
    getUnseenPetIds(collId: string, playerCollection: Set<string>): string[] {
        const coll = COLLECTIONS.find(c => c.id === collId);
        if (!coll) return [];
        const seen = new Set(this.seenPets[collId] ?? []);
        return coll.petIds.filter(id => playerCollection.has(id) && !seen.has(id));
    }

    /** Number of unseen new pets in a specific collection. */
    getUnseenCount(collId: string, playerCollection: Set<string>): number {
        return this.getUnseenPetIds(collId, playerCollection).length;
    }

    /** Whether any discovered collection has unseen pets. */
    hasAnyUnseen(playerCollection: Set<string>): boolean {
        for (const coll of COLLECTIONS) {
            if (!coll.petIds.some(id => playerCollection.has(id))) continue;
            if (this.getUnseenCount(coll.id, playerCollection) > 0) return true;
        }
        return false;
    }

    /** Number of collections ready to claim (complete but not yet claimed). */
    getClaimableCount(playerCollection: Set<string>): number {
        let count = 0;
        for (const coll of COLLECTIONS) {
            if (this.claimed[coll.id]) continue;
            if (coll.petIds.every(id => playerCollection.has(id))) count++;
        }
        return count;
    }

    /** Get discovered collections sorted: claimable → unseen → incomplete → claimed. */
    getDiscoveredSorted(playerCollection: Set<string>): CollectionDef[] {
        return COLLECTIONS
            .filter(c => c.petIds.some(id => playerCollection.has(id)))
            .sort((a, b) => {
                const aGroup = this.getSortGroup(a, playerCollection);
                const bGroup = this.getSortGroup(b, playerCollection);
                if (aGroup !== bGroup) return aGroup - bGroup;
                const aP = this.getProgress(a, playerCollection);
                const bP = this.getProgress(b, playerCollection);
                return (bP.current / bP.total) - (aP.current / aP.total);
            });
    }

    /** Sort group: 0=claimable, 1=unseen, 2=incomplete, 3=claimed */
    private getSortGroup(coll: CollectionDef, pc: Set<string>): number {
        const complete = coll.petIds.every(id => pc.has(id));
        if (complete && !this.claimed[coll.id]) return 0;
        if (this.claimed[coll.id]) return 3;
        if (this.getUnseenCount(coll.id, pc) > 0) return 1;
        return 2;
    }
}
