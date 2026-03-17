import type { PlatformSDK } from './PlatformSDK';
import { NullAdapter } from './NullAdapter';

export type PlatformId =
    | 'poki' | 'crazygames' | 'gamedist'
    | 'yandex' | 'gamemonetize' | 'gamepix'
    | 'addictinggames' | 'itchio' | 'dev';

export async function createAdapter(): Promise<PlatformSDK> {
    const id = (import.meta.env.VITE_PLATFORM ?? 'dev') as PlatformId;

    try {
        switch (id) {
            case 'poki': {
                const m = await import('./PokiAdapter');
                const a = new m.PokiAdapter(); await a.init(); return a;
            }
            case 'crazygames': {
                const m = await import('./CrazyGamesAdapter');
                const a = new m.CrazyGamesAdapter(); await a.init(); return a;
            }
            case 'gamedist': {
                const m = await import('./GameDistAdapter');
                const a = new m.GameDistAdapter(); await a.init(); return a;
            }
            case 'yandex': {
                const m = await import('./YandexAdapter');
                const a = new m.YandexAdapter(); await a.init(); return a;
            }
            case 'gamemonetize': {
                const m = await import('./GameMonetizeAdapter');
                const a = new m.GameMonetizeAdapter(); await a.init(); return a;
            }
            case 'gamepix': {
                const m = await import('./GamePixAdapter');
                const a = new m.GamePixAdapter(); await a.init(); return a;
            }
            default: {
                const a = new NullAdapter(); await a.init(); return a;
            }
        }
    } catch (err) {
        console.warn('[SDK] Init failed, falling back to NullAdapter', err);
        return new NullAdapter();
    }
}
