import type { AudioSystem } from '../systems/AudioSystem';
import type { PlatformSDK } from './PlatformSDK';
import { withTimeout, AD_TIMEOUT_MS, blockInput } from './adUtil';

export class GameMonetizeAdapter implements PlatformSDK {
    private audio: AudioSystem | null = null;
    private pendingResolve: ((val: boolean) => void) | null = null;

    async init(): Promise<void> {
        if (typeof GameMonetize === 'undefined') throw new Error('GameMonetize SDK not loaded');
        window.addEventListener('gm-ad-pause', () => { this.audio?.pauseAll(); });
        window.addEventListener('gm-ad-resume', () => {
            this.audio?.resumeAll();
            if (this.pendingResolve) {
                this.pendingResolve(true);
                this.pendingResolve = null;
            }
        });
    }

    setAudio(audio: AudioSystem): void { this.audio = audio; }
    gameLoadingFinished(): void { /* auto-handled */ }
    gameplayStart(): void { /* no lifecycle API */ }
    gameplayStop(): void { /* no lifecycle API */ }
    reportLoadingProgress(): void { /* no progress API */ }
    setGame(_game: Phaser.Game): void { /* no-op */ }

    async showRewardedBreak(): Promise<boolean> {
        this.audio?.pauseAll();
        const unblock = blockInput();
        try {
            return await withTimeout(new Promise<boolean>((resolve) => {
                this.pendingResolve = resolve;
                GameMonetize!.Instance.ShowAd();
            }), AD_TIMEOUT_MS);
        } catch {
            return false;
        } finally {
            unblock();
            this.pendingResolve = null;
            this.audio?.resumeAll();
        }
    }

    async commercialBreak(): Promise<void> {
        this.audio?.pauseAll();
        const unblock = blockInput();
        try {
            await withTimeout(new Promise<void>((resolve) => {
                this.pendingResolve = () => resolve() as unknown as boolean;
                GameMonetize!.Instance.ShowAd();
            }), AD_TIMEOUT_MS);
        } catch { /* timeout */ }
        finally {
            unblock();
            this.pendingResolve = null;
            this.audio?.resumeAll();
        }
    }
}
