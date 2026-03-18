import type { AudioSystem } from '../systems/AudioSystem';
import type { PlatformSDK } from './PlatformSDK';
import { withTimeout, AD_TIMEOUT_MS, blockInput } from './adUtil';

export class PokiAdapter implements PlatformSDK {
    private audio: AudioSystem | null = null;
    private game: Phaser.Game | null = null;

    async init(): Promise<void> {
        if (typeof PokiSDK === 'undefined') throw new Error('PokiSDK not loaded');
        try { await PokiSDK.init(); } catch { /* SDK docs: continue anyway */ }
    }

    setAudio(audio: AudioSystem): void { this.audio = audio; }
    setGame(game: Phaser.Game): void { this.game = game; }
    gameLoadingFinished(): void { PokiSDK.gameLoadingFinished(); }
    gameplayStart(): void { PokiSDK.gameplayStart(); }
    gameplayStop(): void { PokiSDK.gameplayStop(); }
    reportLoadingProgress(): void { /* Poki has no progress API */ }

    async showRewardedBreak(): Promise<boolean> {
        const unblock = blockInput(this.game!);
        try {
            return await withTimeout(
                PokiSDK.rewardedBreak(() => { this.audio?.pauseAll(); }),
                AD_TIMEOUT_MS,
            );
        } catch {
            return false;
        } finally {
            unblock();
            this.audio?.resumeAll();
        }
    }

    async commercialBreak(): Promise<void> {
        const unblock = blockInput(this.game!);
        try {
            await withTimeout(
                PokiSDK.commercialBreak(() => { this.audio?.pauseAll(); }),
                AD_TIMEOUT_MS,
            );
        } catch { /* ad failed or timed out */ }
        finally { unblock(); this.audio?.resumeAll(); }
    }
}
