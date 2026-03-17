import type { AudioSystem } from '../systems/AudioSystem';
import type { PlatformSDK } from './PlatformSDK';
import { withTimeout, AD_TIMEOUT_MS } from './adUtil';

export class GameDistAdapter implements PlatformSDK {
    private audio: AudioSystem | null = null;
    private resumeResolve: (() => void) | null = null;

    async init(): Promise<void> {
        if (typeof gdsdk === 'undefined') throw new Error('GD SDK not loaded');
        /* GD SDK fires events via the GD_OPTIONS.onEvent callback set in index-gamedist.html.
           We listen on window for forwarded custom events. */
        window.addEventListener('gdsdk-resume', () => {
            this.audio?.resumeAll();
            if (this.resumeResolve) { this.resumeResolve(); this.resumeResolve = null; }
        });
        window.addEventListener('gdsdk-pause', () => {
            this.audio?.pauseAll();
        });
    }

    setAudio(audio: AudioSystem): void { this.audio = audio; }
    gameLoadingFinished(): void { /* GD handles automatically */ }
    gameplayStart(): void { /* GD uses event-based lifecycle */ }
    gameplayStop(): void { /* GD uses event-based lifecycle */ }
    reportLoadingProgress(): void { /* no progress API */ }

    async showRewardedBreak(): Promise<boolean> {
        this.audio?.pauseAll();
        try {
            await withTimeout(new Promise<void>((resolve) => {
                this.resumeResolve = resolve;
                gdsdk!.showAd('rewarded');
            }), AD_TIMEOUT_MS);
            return true;
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
                this.resumeResolve = resolve;
                gdsdk!.showAd();
            }), AD_TIMEOUT_MS);
        } catch { /* timeout */ }
        finally { this.audio?.resumeAll(); }
    }
}
