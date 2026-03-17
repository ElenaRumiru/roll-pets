import type { AudioSystem } from '../systems/AudioSystem';
import type { PlatformSDK } from './PlatformSDK';
import { withTimeout, AD_TIMEOUT_MS, blockInput } from './adUtil';

export class PokiAdapter implements PlatformSDK {
    private audio: AudioSystem | null = null;

    async init(): Promise<void> {
        if (typeof PokiSDK === 'undefined') throw new Error('PokiSDK not loaded');
        await PokiSDK.init();
    }

    setAudio(audio: AudioSystem): void { this.audio = audio; }
    gameLoadingFinished(): void { PokiSDK.gameLoadingFinished(); }
    gameplayStart(): void { PokiSDK.gameplayStart(); }
    gameplayStop(): void { PokiSDK.gameplayStop(); }
    reportLoadingProgress(): void { /* Poki has no progress API */ }

    async showRewardedBreak(): Promise<boolean> {
        this.audio?.pauseAll();
        const unblock = blockInput();
        try {
            return await withTimeout(PokiSDK.rewardedBreak(), AD_TIMEOUT_MS);
        } catch {
            return false;
        } finally {
            unblock();
            this.audio?.resumeAll();
        }
    }

    async commercialBreak(): Promise<void> {
        this.audio?.pauseAll();
        const unblock = blockInput();
        try {
            await withTimeout(PokiSDK.commercialBreak(), AD_TIMEOUT_MS);
        } catch { /* ad failed or timed out */ }
        finally { unblock(); this.audio?.resumeAll(); }
    }
}
