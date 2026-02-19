export interface PlatformSDK {
    init(): Promise<void>;
    gameLoadingFinished(): void;
    gameplayStart(): void;
    gameplayStop(): void;
    showRewardedBreak(): Promise<boolean>;
    commercialBreak(): Promise<void>;
}
