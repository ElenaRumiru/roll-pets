import type { AudioSystem } from '../systems/AudioSystem';
import { PlatformSDK } from './PlatformSDK';

export class NullAdapter implements PlatformSDK {
    async init(): Promise<void> { console.warn('[SDK] NullAdapter — no ads'); }
    setAudio(_audio: AudioSystem): void { /* no-op */ }
    gameLoadingFinished(): void { /* no-op */ }
    gameplayStart(): void { /* no-op */ }
    gameplayStop(): void { /* no-op */ }
    async showRewardedBreak(): Promise<boolean> { return true; }
    async commercialBreak(): Promise<void> { /* no-op */ }
    reportLoadingProgress(_p: number): void { /* no-op */ }
}
