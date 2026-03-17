import type { AudioSystem } from '../systems/AudioSystem';
import type { PlatformSDK } from './PlatformSDK';
import { withTimeout, AD_TIMEOUT_MS } from './adUtil';

export class CrazyGamesAdapter implements PlatformSDK {
    private audio: AudioSystem | null = null;

    async init(): Promise<void> {
        if (typeof CrazyGames === 'undefined') throw new Error('CrazyGames SDK not loaded');
        await CrazyGames.SDK.init();
    }

    setAudio(audio: AudioSystem): void { this.audio = audio; }
    gameLoadingFinished(): void { CrazyGames.SDK.game.loadingStop(); }
    gameplayStart(): void { CrazyGames.SDK.game.gameplayStart(); }
    gameplayStop(): void { CrazyGames.SDK.game.gameplayStop(); }
    reportLoadingProgress(): void { /* no progress API */ }

    async showRewardedBreak(): Promise<boolean> {
        this.audio?.pauseAll();
        try {
            return await withTimeout(new Promise<boolean>((resolve) => {
                CrazyGames.SDK.ad.requestAd('rewarded', {
                    adStarted: () => { /* already muted */ },
                    adFinished: () => resolve(true),
                    adError: () => resolve(false),
                });
            }), AD_TIMEOUT_MS);
        } catch {
            return false;
        } finally {
            this.audio?.resumeAll();
        }
    }

    async commercialBreak(): Promise<void> {
        this.audio?.pauseAll();
        try {
            await withTimeout(new Promise<void>((resolve) => {
                CrazyGames.SDK.ad.requestAd('midgame', {
                    adFinished: () => resolve(),
                    adError: () => resolve(),
                });
            }), AD_TIMEOUT_MS);
        } catch { /* timeout */ }
        finally { this.audio?.resumeAll(); }
    }
}
