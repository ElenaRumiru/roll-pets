import { PlatformSDK } from './PlatformSDK';

/** Timestamp of game session start (module load time) */
const sessionStartMs = Date.now();

/** True while an interstitial ad is playing */
let adActive = false;

/** True while gameplay is active (between gameplayStart and gameplayStop) */
let gameplayActive = false;

/** Poki policy: no ads in first 2 minutes */
const MIN_SESSION_MS = 120_000;

/** Check if an interstitial ad is currently playing */
export function isAdActive(): boolean { return adActive; }

/** Check if gameplay is currently active (gameplayStart was called) */
export function isGameplayActive(): boolean { return gameplayActive; }

/** Mark gameplay as started (call after sdk.gameplayStart()) */
export function markGameplayStarted(): void { gameplayActive = true; }

/** Mark gameplay as stopped (call after sdk.gameplayStop()) */
export function markGameplayStopped(): void { gameplayActive = false; }

/**
 * Mid-gameplay interstitial (Pattern A).
 * Used during active gameplay: every 50 rolls, autoroll toggle, dream buff.
 * Calls gameplayStop → commercialBreak → gameplayStart.
 */
export async function showInterstitial(
    scene: Phaser.Scene,
): Promise<boolean> {
    if (Date.now() - sessionStartMs < MIN_SESSION_MS) return false;

    const sdk = scene.registry.get('platformSDK') as PlatformSDK | undefined;
    if (!sdk) return false;

    adActive = true;
    if (gameplayActive) {
        sdk.gameplayStop();
        gameplayActive = false;
    }
    try { await sdk.commercialBreak(); } catch { /* ad failed */ }
    finally { adActive = false; }
    sdk.gameplayStart();
    gameplayActive = true;
    return true;
}

/**
 * Scene-return interstitial (Pattern B).
 * Used when returning from sub-scene to MainScene.
 * Gameplay was already stopped on sub-scene entry.
 * ALWAYS calls gameplayStart at the end, regardless of whether ad played.
 */
export async function showSceneReturnBreak(
    scene: Phaser.Scene,
): Promise<void> {
    const sdk = scene.registry.get('platformSDK') as PlatformSDK | undefined;

    if (sdk && Date.now() - sessionStartMs >= MIN_SESSION_MS) {
        adActive = true;
        try { await sdk.commercialBreak(); } catch { /* ad failed */ }
        finally { adActive = false; }
    }

    // ALWAYS resume gameplay, even if no ad was shown or no SDK
    if (sdk && !gameplayActive) {
        sdk.gameplayStart();
        gameplayActive = true;
    }
}
