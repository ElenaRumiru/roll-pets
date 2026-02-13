import { PlatformSDK } from './PlatformSDK';

export class NullAdapter implements PlatformSDK {
    async init(): Promise<void> { /* no-op */ }
    gameLoadingFinished(): void { /* no-op */ }
    gameplayStart(): void { /* no-op */ }
    gameplayStop(): void { /* no-op */ }
    async showRewardedBreak(): Promise<boolean> { return true; }
}
