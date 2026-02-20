import { ShopOffer, ShopState } from '../types';
import { PETS } from '../data/pets';

const MAX_OFFERS = 5;

export class ShopSystem {
    private offers: ShopOffer[] = [];
    private lastRefreshDate = '';

    generateOffers(collection: Set<string>): void {
        const uncollected = PETS.filter(p => !collection.has(p.id));
        const shuffled = uncollected.sort(() => Math.random() - 0.5);
        this.offers = shuffled.slice(0, MAX_OFFERS).map(p => ({
            petId: p.id,
            price: p.chance * 2,
        }));
        this.lastRefreshDate = ShopSystem.getTodayUTC();
    }

    purchase(petId: string, currentCoins: number): number | null {
        const idx = this.offers.findIndex(o => o.petId === petId);
        if (idx === -1) return null;
        const price = this.offers[idx].price;
        if (currentCoins < price) return null;
        this.offers.splice(idx, 1);
        return price;
    }

    refresh(collection: Set<string>): void {
        this.generateOffers(collection);
    }

    checkDailyReset(collection: Set<string>): boolean {
        const today = ShopSystem.getTodayUTC();
        if (this.lastRefreshDate === today) return false;
        this.generateOffers(collection);
        return true;
    }

    loadFromSave(state: ShopState): void {
        this.lastRefreshDate = state.lastRefreshDate;
        this.offers = [...state.offers];
    }

    toSave(): ShopState {
        return {
            lastRefreshDate: this.lastRefreshDate,
            offers: this.offers.map(o => ({ ...o })),
        };
    }

    getOffers(): ShopOffer[] {
        return this.offers;
    }

    getSecondsUntilReset(): number {
        const now = new Date();
        const tomorrow = new Date(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1,
        ));
        return Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
    }

    private static getTodayUTC(): string {
        const d = new Date();
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
}
