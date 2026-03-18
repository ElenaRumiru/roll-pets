import type { AudioSystem } from '../systems/AudioSystem';
import { PlatformSDK } from './PlatformSDK';

export class NullAdapter implements PlatformSDK {
    /** When true, SDK failed to load (adblock) — rewarded ads return false */
    constructor(private isFallback = false) {}

    async init(): Promise<void> { console.warn('[SDK] NullAdapter — no ads'); }
    setAudio(_audio: AudioSystem): void { /* no-op */ }
    gameLoadingFinished(): void { /* no-op */ }
    gameplayStart(): void { /* no-op */ }
    gameplayStop(): void { /* no-op */ }
    async showRewardedBreak(): Promise<boolean> { return !this.isFallback; }
    async commercialBreak(): Promise<void> { /* no-op */ }
    reportLoadingProgress(_p: number): void { /* no-op */ }
    setGame(_game: Phaser.Game): void { /* no-op */ }
}
