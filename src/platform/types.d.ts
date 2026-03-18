/* Global SDK type declarations injected via <script> tags in per-platform index.html */

declare const PokiSDK: {
    init(): Promise<void>;
    gameLoadingFinished(): void;
    gameplayStart(): void;
    gameplayStop(): void;
    rewardedBreak(onStart?: () => void): Promise<boolean>;
    commercialBreak(onStart?: () => void): Promise<void>;
};

declare namespace CrazyGames {
    namespace SDK {
        function init(): Promise<void>;
        namespace ad {
            function requestAd(
                type: 'rewarded' | 'midgame',
                callbacks: {
                    adStarted?: () => void;
                    adFinished?: () => void;
                    adError?: (error: string) => void;
                },
            ): void;
        }
        namespace game {
            function gameplayStart(): void;
            function gameplayStop(): void;
            function loadingStart(): void;
            function loadingStop(): void;
        }
    }
}

declare function gdsdk_showAd(type?: string): void;

interface GdSdkGlobal {
    showAd(type?: 'rewarded' | 'interstitial'): void;
}
declare const gdsdk: GdSdkGlobal | undefined;

interface YandexAdvCallbacks {
    onOpen?: () => void;
    onClose?: (wasShown?: boolean) => void;
    onRewarded?: () => void;
    onError?: (err: unknown) => void;
}

interface YandexSDKInstance {
    adv: {
        showFullscreenAdv(opts: { callbacks: YandexAdvCallbacks }): void;
        showRewardedVideo(opts: { callbacks: YandexAdvCallbacks }): void;
    };
}

declare const YaGames: {
    init(): Promise<YandexSDKInstance>;
};

interface GameMonetizeInstance {
    ShowAd(): void;
}

interface GameMonetizeGlobal {
    Instance: GameMonetizeInstance;
}
declare const GameMonetize: GameMonetizeGlobal | undefined;

interface GamePixGlobal {
    showRewardedVideo(): void;
    showInterstitial(): void;
    on: {
        pause: (() => void) | null;
        resume: (() => void) | null;
        soundOn: (() => void) | null;
        soundOff: (() => void) | null;
    };
    game: {
        gameLoading(percent: number): void;
        gameLoaded(cb: () => void): void;
    };
    lang(): string;
}
declare const GamePix: GamePixGlobal | undefined;
