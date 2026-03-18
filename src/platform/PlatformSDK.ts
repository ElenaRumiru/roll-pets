import type { AudioSystem } from '../systems/AudioSystem';

export interface PlatformSDK {
    init(): Promise<void>;
    setAudio(audio: AudioSystem): void;
    gameLoadingFinished(): void;
    gameplayStart(): void;
    gameplayStop(): void;
    showRewardedBreak(): Promise<boolean>;
    commercialBreak(): Promise<void>;
    reportLoadingProgress(percent: number): void;
    setGame(game: Phaser.Game): void;
}
