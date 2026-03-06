import { PlatformSDK } from './PlatformSDK';

/** Timestamp of game session start (module load time) */
const sessionStartMs = Date.now();

/** Timestamp of last interstitial attempt */
let lastInterstitialMs = 0;

/** Poki policy: no ads in first 2 minutes */
const MIN_SESSION_MS = 120_000;

/** Minimum gap between two interstitials (40s) */
const COOLDOWN_MS = 40_000;

/**
 * Show an interstitial ad if session guard + cooldown pass.
 * Returns true if ad was attempted, false if skipped.
 */
export async function showInterstitial(
    scene: Phaser.Scene,
): Promise<boolean> {
    const now = Date.now();
    if (now - sessionStartMs < MIN_SESSION_MS) return false;
    if (now - lastInterstitialMs < COOLDOWN_MS) return false;

    const sdk = scene.registry.get('platformSDK') as PlatformSDK | undefined;
    if (!sdk) return false;

    lastInterstitialMs = Date.now();
    sdk.gameplayStop();
    try { await sdk.commercialBreak(); } catch { /* ad failed */ }
    sdk.gameplayStart();
    return true;
}
