# Poki Compliance Audit — PETS ROLL

**Date:** 2026-03-17
**Sources:** [Requirements](https://sdk.poki.com/new-requirements.html) | [HTML5 SDK](https://sdk.poki.com/html5.html) | [Poki Inspector](https://sdk.poki.com/poki-inspector.html)

---

## PASS — Requirements Met

| # | Requirement | Status | Evidence |
|---|-----------|--------|----------|
| 1 | **16:9 aspect ratio, Scale.FIT** | PASS | `src/game/main.ts:20-29` — 1031×580, `Scale.FIT`, `Scale.CENTER_BOTH` |
| 2 | **Multi-device (desktop + mobile + tablet)** | PASS | Portrait/landscape detection in `src/core/orientation.ts`, scene restart on rotate |
| 3 | **localStorage wrapped in try/catch** | PASS | `src/systems/SaveSystem.ts` — `load()` line 209, `save()` line 250 both try/catch |
| 4 | **ESC key for pause/resume** | PASS | `src/scenes/MainScene.ts:240` — `keydown-ESC` → `togglePause()` |
| 5 | **No splash screens** | PASS | BootScene shows only loading bar + "PETS ROLL" title |
| 6 | **No outgoing links** | PASS | No external URLs, social links, or "play more" buttons |
| 7 | **No external requests** | PASS | Font Rubik bundled locally (`public/assets/fonts/Rubik.woff2`), no CDN/Google Fonts |
| 8 | **No external ads** | PASS | Only Poki SDK ads via `PokiAdapter.ts` |
| 9 | **SDK init failure = non-blocking** | PASS | `src/platform/createAdapter.ts` catch → NullAdapter fallback, game continues |
| 10 | **`gameLoadingFinished()` called** | PASS | `src/scenes/BootScene.ts:141` — after asset load + post-processing |
| 11 | **Audio muted during ads** | PASS | `PokiAdapter.ts` — `pauseAll()` before ad, `resumeAll()` in `finally` block |
| 12 | **No double SDK events** | PASS | `interstitial.ts` atomic: `gameplayStop()` → `commercialBreak()` → `gameplayStart()` |
| 13 | **Interstitial ads integrated** | PASS | 6 call sites via `showInterstitial()`: MainScene×3, ShopScene×2, CollectionScene×1, NestsScene×1 |
| 14 | **Rewarded failure → no ad reward** | PASS | All 7 call sites: `showRewardedBreak()` returns `false` → free amount or nothing |
| 15 | **FREE/Ad buttons shown simultaneously** | PASS | `ChoiceCard.ts` side-by-side layout in overlays |
| 16 | **FREE button green, Ad button not green** | PASS | `FREE_COLOR = 0x78C828` (green), `AD_COLOR = 0x7B2FBE` (purple) |
| 17 | **FREE button same size as Ad button** | PASS | Both use `BTN_W=111, BTN_H=35` from `ChoiceCard.ts` |
| 18 | **Progress saving** | PASS | `SaveSystem.ts` — auto-save to localStorage with hash validation |
| 19 | **Localization available** | PASS | EN + RU via `t('key')` from `data/locales/` |
| 20 | **Initial download < 8MB** | PASS | Phase 1 lazy loading: ~2-3MB (UI + top 3 pets + current bg/egg + audio). See "Lazy Loading" section |
| 21 | **No debug code in production** | PASS | Terser 2-pass minification, `noEmit: true`, no console.log in game code |
| 22 | **`showInterstitial()` timing guards** | PASS | `interstitial.ts` — 120s session guard + 40s cooldown |

---

## FAIL — Fixes Required

### F1: `gameplayStart()` not called on first user input — CRITICAL — DONE

**Requirement:** "gameplayStart() must fire on player's first input, not on load" ([html5.html](https://sdk.poki.com/html5.html))

**Problem:** `gameplayStart()` is currently ONLY called inside `interstitial.ts:32` after commercial breaks. It is NEVER called on the player's first click/tap. Poki uses this event to track when the player actually starts engaging — without it, metrics and ad timing are broken.

**Fix:**

File: `src/scenes/MainScene.ts`

In `create()`, after SDK is available, add a one-shot first-input handler:

```typescript
const sdk = this.registry.get('platformSDK') as PlatformSDK | undefined;
if (sdk && !this.registry.get('_gameplayStarted')) {
    this.input.once('pointerdown', () => {
        this.registry.set('_gameplayStarted', true);
        sdk.gameplayStart();
    });
}
```

The flag is stored in registry (not local variable) because MainScene can restart on orientation change. The flag ensures `gameplayStart()` fires exactly once per session.

**Result:** Implemented in `MainScene.ts:79-84`. One-shot `pointerdown` handler with `_gameplayStarted` registry flag.

---

### F2: `togglePause()` doesn't call `gameplayStop/Start` — HIGH — DONE

**Requirement:** "gameplayStop() must trigger during any gameplay interruption (pause, menu)" ([new-requirements.html](https://sdk.poki.com/new-requirements.html))

**Problem:** ESC pause mutes audio but doesn't signal Poki. Poki tracks engagement duration via these events.

**Fix:**

File: `src/scenes/MainScene.ts:574-580`

```typescript
private togglePause(): void {
    if (this.settingsPanel.isVisible) return;
    this.isPaused = !this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);
    const sdk = this.registry.get('platformSDK') as PlatformSDK | undefined;
    if (this.isPaused) {
        this.audio.pauseAll();
        sdk?.gameplayStop();
    } else {
        this.audio.resumeAll();
        sdk?.gameplayStart();
    }
}
```

**Result:** Implemented in `MainScene.ts:584-595`. `sdk?.gameplayStop()` on pause, `sdk?.gameplayStart()` on unpause.

---

### F3: Keyboard/wheel input not disabled during ads — HIGH — DONE

**Requirement:** "Disable keyboard (space, arrow keys) and wheel events during ads" ([html5.html](https://sdk.poki.com/html5.html))

**Problem:** Currently only audio is muted during ad playback. Space/arrows/scroll can interfere with the ad iframe overlay.

**Fix:**

File: `src/platform/adUtil.ts` — add shared utility:

```typescript
export function blockInput(): () => void {
    const onKey = (e: KeyboardEvent) => {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
            e.preventDefault();
        }
    };
    const onWheel = (e: Event) => e.preventDefault();
    document.addEventListener('keydown', onKey, { capture: true });
    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => {
        document.removeEventListener('keydown', onKey, { capture: true } as EventListenerOptions);
        document.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
    };
}
```

Then in every adapter's `showRewardedBreak()` and `commercialBreak()`:

```typescript
async showRewardedBreak(): Promise<boolean> {
    this.audio?.pauseAll();
    const unblock = blockInput();
    try {
        return await withTimeout(PokiSDK.rewardedBreak(), AD_TIMEOUT_MS);
    } catch { return false; }
    finally { unblock(); this.audio?.resumeAll(); }
}
```

**Files to update:** `PokiAdapter.ts`, `CrazyGamesAdapter.ts`, `GameDistAdapter.ts`, `YandexAdapter.ts`, `GameMonetizeAdapter.ts`, `GamePixAdapter.ts` (all 6 adapters, 2 methods each = 12 call sites).

**Result:** `blockInput()` utility added to `adUtil.ts`. All 6 adapters updated — `const unblock = blockInput()` before ad, `unblock()` in finally block.

---

### F4: No video icon on WATCH/Ad buttons — MEDIUM — DONE

**Requirement:** "Include prominent video icons on reward buttons" ([new-requirements.html](https://sdk.poki.com/new-requirements.html))

**Problem:** Ad buttons use text `▶ WATCH` but lack a prominent video icon image. Poki reviewers check for clear visual distinction.

**Fix:**

Ad film/play icons already loaded in Phase 1: `ui_ad_film` and `ui_ad_play` (from `AssetRegistry.ts`).

Add a small video icon sprite next to the WATCH text in ChoiceCard ad buttons. Update label rendering in `buildChoiceButton()` to optionally accept an icon key:

Files: `src/ui/components/ChoiceCard.ts` — add optional `iconKey` to `ChoiceButtonConfig`.

Call sites to update with icon:
- `src/ui/LevelUpOverlay.ts` — ad choice button
- `src/ui/LeaguePromotionOverlay.ts` — ad choice button
- `src/ui/QuestClaimPopup.ts` — ad choice button

**Result:** Replaced `▶` with 🎬 emoji in locale keys (`quest_watch` in en/ru/es) and BonusPanel. Removed `iconKey` sprite approach — emoji in text is simpler and consistent across all ad buttons.

---

### F5: NullAdapter grants ad-tier rewards when adblock active — MEDIUM — DONE

**Requirement:** "When ad blockers are detected, do not follow through and provide rewards" ([new-requirements.html](https://sdk.poki.com/new-requirements.html))

**Problem:** If Poki SDK script fails to load (adblock), `createAdapter.ts` catch block creates `NullAdapter` which returns `true` for `showRewardedBreak()`. Player gets ad rewards without watching ads.

**Fix:**

File: `src/platform/NullAdapter.ts`

```typescript
export class NullAdapter implements PlatformSDK {
    constructor(private isFallback = false) {}
    // ...
    async showRewardedBreak(): Promise<boolean> {
        return !this.isFallback; // true in dev mode, false when SDK failed (adblock)
    }
}
```

File: `src/platform/createAdapter.ts` — in catch block:

```typescript
catch (err) {
    console.warn('[SDK] Init failed, falling back to NullAdapter', err);
    return new NullAdapter(true); // isFallback = true
}
```

Default constructor `new NullAdapter()` (no args) still returns `true` for dev testing.

**Result:** `NullAdapter(isFallback)` constructor added. `createAdapter.ts` catch block passes `true`. Dev mode = `true`, adblock fallback = `false`.

---

### F6: No `commercialBreak()` on sub-scene return — MEDIUM — DONE

**Requirement:** "Call commercialBreak before every gameplayStart when user intends to continue playing" ([html5.html](https://sdk.poki.com/html5.html))

**Problem:** When player returns from Collection/Shop/Nests/Progression back to MainScene, no `commercialBreak()` fires. These are natural break points that Poki expects games to signal.

**Fix:**

File: `src/scenes/MainScene.ts` — in `create()`, detect sub-scene return:

```typescript
// Sub-scene return = potential ad break
const isReturn = this.registry.get('_gameplayStarted') === true;
if (isReturn) {
    showInterstitial(this); // timing guard in interstitial.ts handles cooldown
}
```

The existing 40s cooldown in `interstitial.ts` prevents ad spam. Not every call shows an ad — Poki's system decides.

**Result:** `showInterstitial(this)` called in `MainScene.create()` when `_gameplayStarted` is true (= sub-scene return). Timing guards in `interstitial.ts` handle cooldown.

---

### F7: Race condition — ESC during interstitial ad — MEDIUM — DONE

**Problem:** If player presses ESC while interstitial ad is playing, `togglePause()` calls `gameplayStop()` a second time → consecutive duplicate SDK event.

**Fix:** Added `adActive` flag in `interstitial.ts` + `isAdActive()` export. `togglePause()` in MainScene checks `isAdActive()` and returns early if ad is playing.

**Result:** `interstitial.ts` sets `adActive = true` before ad, `false` in finally. `MainScene.togglePause()` guards with `if (isAdActive()) return;`.

---

### F8: ESC in sub-scenes returns to MainScene — MEDIUM — DONE

**Problem:** ESC key only worked in MainScene. Sub-scenes (Shop, Collection, Nests, etc.) had no ESC handling.

**Fix:** Added `scene.input.keyboard?.on('keydown-ESC', onBack)` inside `SceneHeader.ts`. All 7 sub-scenes automatically get ESC → back because they all use `createSceneHeader()`.

**Result:** One line in `SceneHeader.ts:62`. All sub-scenes inherit ESC behavior.

---

### F9: Ad buttons — replaced ▶ with 🎬 emoji — LOW — DONE

**Problem:** Ad buttons used `▶` Unicode triangle. Needed prominent video icon per Poki requirements.

**Fix:** Changed `quest_watch` locale key from `"▶ WATCH"` to `"🎬 WATCH"` in en/ru/es. BonusPanel WATCH button also updated. Removed unused `iconKey` sprite approach from ChoiceCard.

**Result:** All ad buttons now show 🎬 emoji. Consistent across all overlays and BonusPanel.

---

## Lazy Loading Status

Two-phase asset loading is implemented and working:

| | Phase 1 (BootScene) | Phase 2 (Background) |
|---|---|---|
| **When** | Before game starts | After MainScene creates |
| **Size** | ~2-3 MB | ~25+ MB |
| **Content** | UI icons, top 3 pets, current bg/egg, core SFX, BGM | Remaining 184 pets, 16 eggs, 32 backgrounds, grade SFX, luck icons, collection icons |
| **Blocking?** | Yes (progress bar shown) | No (silent background) |
| **Batching** | N/A | 30-pet batches, 100ms delay |
| **On-demand** | N/A | `ensurePet()` for rolled pets not yet loaded |
| **Roll safety** | N/A | Pauses during roll animation, resumes after |

**Key files:**
- `src/loading/AssetRegistry.ts` — Phase 1/2 asset lists
- `src/loading/DeferredLoader.ts` — Background loader with pause/resume
- `src/loading/SavePeek.ts` — Peek save data without full SaveSystem
- `src/loading/PostProcess.ts` — Trim/downscale utilities

---

## Pre-Submission Checklist

Before uploading `dist/poki/` to [Poki Inspector](https://inspector.poki.dev/):

- [ ] **F1 fixed:** `gameplayStart()` fires on first pointer input
- [ ] **F2 fixed:** ESC pause calls `gameplayStop()`, unpause calls `gameplayStart()`
- [ ] **F3 fixed:** Keyboard/wheel blocked during all ad playback
- [ ] **F4 fixed:** Video icon visible on WATCH/Ad buttons
- [ ] **F5 fixed:** NullAdapter fallback returns `false` for rewarded (no free ad rewards)
- [ ] **F6 fixed:** `commercialBreak()` fires on sub-scene return
- [ ] Build with `npm run build:poki`
- [ ] Verify `dist/poki/index-poki.html` contains Poki SDK script tag
- [ ] Upload to Poki Inspector
- [ ] Check **Event Log**: `gameLoadingFinished` → (first click) → `gameplayStart` → ...
- [ ] Verify no `gameplayStart` fires before first user input
- [ ] Verify `gameplayStop`/`gameplayStart` alternate correctly (no duplicates)
- [ ] Check **Warnings** tab: no external resources, no unexpected behavior
- [ ] Test on mobile via QR code in Inspector
- [ ] Test with ad blocker enabled — game must be playable, no ad rewards granted
- [ ] Verify ESC pauses/resumes correctly in Inspector
- [ ] Prepare thumbnails: static + animated (required for global release)
- [ ] Replace `YOUR_GD_GAME_ID` / `YOUR_GM_GAME_ID` in platform index files (not Poki-related but good hygiene)

---

## Poki SDK Event Flow (Expected)

```
[Boot]
  → gameLoadingFinished()

[MainScene loads, player sees game]
  → (player clicks ROLL or any element)
  → gameplayStart()                    ← FIRST INPUT

[During gameplay]
  → (ESC pressed)
  → gameplayStop()
  → (ESC again to unpause)
  → gameplayStart()

[Interstitial ad triggers (every 50 rolls / on scene return)]
  → gameplayStop()
  → commercialBreak()                  ← may or may not show ad
  → gameplayStart()

[Rewarded ad (buff/coins/quest)]
  → (player clicks WATCH button)
  → rewardedBreak()                    ← returns true/false
  → (reward granted only if true)

[Sub-scene navigation]
  → (player opens Collection)
  → gameplayStop()                     ← optional, good practice
  → (player returns to MainScene)
  → commercialBreak()                  ← natural break point
  → gameplayStart()
```
