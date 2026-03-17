import type { AudioSystem } from '../systems/AudioSystem';
import type { PlatformSDK } from './PlatformSDK';
import { withTimeout, AD_TIMEOUT_MS, blockInput } from './adUtil';

export class YandexAdapter implements PlatformSDK {
    private audio: AudioSystem | null = null;
    private ysdk: YandexSDKInstance | null = null;

    async init(): Promise<void> {
        if (typeof YaGames === 'undefined') throw new Error('Yandex SDK not loaded');
        this.ysdk = await YaGames.init();
    }

    setAudio(audio: AudioSystem): void { this.audio = audio; }
    gameLoadingFinished(): void { /* Yandex has no explicit loading signal */ }
    gameplayStart(): void { /* Yandex has no gameplay lifecycle */ }
    gameplayStop(): void { /* Yandex has no gameplay lifecycle */ }
    reportLoadingProgress(): void { /* no progress API */ }

    async showRewardedBreak(): Promise<boolean> {
        if (!this.ysdk) return false;
        this.audio?.pauseAll();
        const unblock = blockInput();
        try {
            return await withTimeout(new Promise<boolean>((resolve) => {
                let rewarded = false;
                this.ysdk!.adv.showRewardedVideo({
                    callbacks: {
                        onRewarded: () => { rewarded = true; },
                        onClose: () => resolve(rewarded),
                        onError: () => resolve(false),
                    },
                });
            }), AD_TIMEOUT_MS);
        } catch {
            return false;
        } finally {
            unblock();
            this.audio?.resumeAll();
        }
    }

    async commercialBreak(): Promise<void> {
        if (!this.ysdk) return;
        this.audio?.pauseAll();
        const unblock = blockInput();
        try {
            await withTimeout(new Promise<void>((resolve) => {
                this.ysdk!.adv.showFullscreenAdv({
                    callbacks: {
                        onClose: () => resolve(),
                        onError: () => resolve(),
                    },
                });
            }), AD_TIMEOUT_MS);
        } catch { /* timeout */ }
        finally { unblock(); this.audio?.resumeAll(); }
    }
}
