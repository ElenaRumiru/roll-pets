import type { AudioSystem } from '../systems/AudioSystem';
import type { PlatformSDK } from './PlatformSDK';
import { withTimeout, AD_TIMEOUT_MS } from './adUtil';

export class GamePixAdapter implements PlatformSDK {
    private audio: AudioSystem | null = null;
    private adResolve: ((val: boolean) => void) | null = null;

    async init(): Promise<void> {
        if (typeof GamePix === 'undefined') throw new Error('GamePix SDK not loaded');
        GamePix.on.pause = () => { this.audio?.pauseAll(); };
        GamePix.on.resume = () => {
            this.audio?.resumeAll();
            if (this.adResolve) { this.adResolve(true); this.adResolve = null; }
        };
        GamePix.on.soundOff = () => { this.audio?.pauseAll(); };
        GamePix.on.soundOn = () => { this.audio?.resumeAll(); };
    }

    setAudio(audio: AudioSystem): void { this.audio = audio; }

    gameLoadingFinished(): void {
        GamePix!.game.gameLoaded(() => { /* ready */ });
    }

    gameplayStart(): void { /* no gameplay lifecycle */ }
    gameplayStop(): void { /* no gameplay lifecycle */ }

    reportLoadingProgress(percent: number): void {
        GamePix!.game.gameLoading(Math.min(100, Math.max(0, percent)));
    }

    async showRewardedBreak(): Promise<boolean> {
        this.audio?.pauseAll();
        try {
            return await withTimeout(new Promise<boolean>((resolve) => {
                this.adResolve = resolve;
                GamePix!.showRewardedVideo();
            }), AD_TIMEOUT_MS);
        } catch {
            return false;
        } finally {
            this.adResolve = null;
            this.audio?.resumeAll();
        }
    }

    async commercialBreak(): Promise<void> {
        this.audio?.pauseAll();
        try {
            await withTimeout(new Promise<void>((resolve) => {
                this.adResolve = () => resolve() as unknown as boolean;
                GamePix!.showInterstitial();
            }), AD_TIMEOUT_MS);
        } catch { /* timeout */ }
        finally {
            this.adResolve = null;
            this.audio?.resumeAll();
        }
    }
}
