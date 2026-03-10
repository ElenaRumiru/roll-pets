# Tech Review Plan — PETS GO Lite (CTO-level)

## Context

Previous reviewer identified 14 issues. Some are already resolved (bundle size reduced 80MB→23MB, save checksum implemented). This plan is a deeper audit — we go beyond surface observations into architectural debt, runtime risks, and Poki submission blockers.

Codebase: 83 files, ~13K LOC. Architecture is solid (logic/render separation, EventBus, composition). The problems are in the details.

---

## TIER 1 — BLOCKERS (must fix before Poki submission)

### 1.1 PokiAdapter missing
- `PlatformSDK.ts` interface exists, `NullAdapter` works, but **no real Poki SDK integration**
- Need `PokiAdapter.ts`: `PokiSDK.init()`, `gameplayStart/Stop`, rewarded/commercial breaks
- 7 ad call sites already follow correct pattern — just need real adapter
- **Files:** `src/platform/PokiAdapter.ts` (new), `src/game/main.ts` (SDK init)

### 1.2 ~~HTML title says "Phaser - Template"~~ DONE
- ~~`index.html` still has generic title — Poki will reject or display wrong name~~
- Renamed to **PETS ROLL** everywhere: `index.html`, `package.json`, `BootScene.ts` loading screen
- **File:** `index.html`, `package.json`, `src/scenes/BootScene.ts`

### 1.3 Bundle size: 23MB total, needs lazy loading strategy
- JS bundle: 1.4MB (OK). Assets: ~21MB (heavy for initial load)
- Poki requires fast first-screen. 187 pet sprites + 17 egg textures + grade SFX load upfront in BootScene
- **Fix:** Split loading — load MainScene essentials first, defer collection/shop/progression assets
- **Files:** `src/scenes/BootScene.ts` (402 lines — also violates 200-line rule)

---

## TIER 2 — HIGH (architectural debt, runtime risks)

### 2.1 ~~GameManager is a God Object (494 lines)~~ ✅ DONE
- ~~Holds 10 system references, coordinates roll/buff/quest/shop/nest/rebirth/collection/leaderboard~~
- ~~`roll()` method alone is 73 lines with 20+ logic steps~~
- ~~Every new feature adds 20+ lines here~~
- **Fixed:** Extracted `RollCoordinator` (170 lines: roll chain, level-up, league promo, rebirth, nest hatch) and `EconomyCoordinator` (200 lines: purchases, claims, buff activation, nest operations). GameManager is now a thin delegator (199 lines). Zero scene changes — full backward compatibility via delegation methods + getter/setters.
- **Files:** `src/core/GameManager.ts` (494→199), new `src/core/RollCoordinator.ts`, new `src/core/EconomyCoordinator.ts`

### 2.2 ~~MainScene: 676 lines, overlay chaining is a hidden state machine~~ ✅ DONE
- ~~3 `pending*` fields + 3 `show*` methods + 3 `finish*` methods = manual callback chain~~
- ~~Order: levelUp → leaguePromo → rebirth → finishRoll~~
- ~~Adding a 4th overlay (achievements? events?) makes this O(n^2) complexity~~
- **Fixed:** Extracted `OverlayQueue` (36 lines, pure TS) — queue-based system with `enqueue(task)` / `start(onAllComplete)`. Each event handler pushes a task closure; queue drains sequentially; single `dismissOverlayAndComplete()` replaces 3× duplicated cleanup. MainScene 676→624 lines. Zero changes to overlay classes, CenterStage, or GameManager.
- `refreshUI()` called on every event, updates all 12+ panels even if only 1 data point changed — no batching
- **Files:** `src/scenes/MainScene.ts` (676→624), new `src/ui/OverlayQueue.ts`

### 2.3 ~~SaveSystem.getData() returns mutable reference~~ ✅ DONE
- ~~Any code can directly mutate save data without triggering save/validation~~
- ~~GameManager calls `persistSave()` explicitly — implicit contract, not enforced~~
- ~~If a developer forgets `persistSave()`, data drifts from localStorage~~
- **Fixed:** `getData()` returns `DeepReadonly<SaveData>` (compile-time protection). New `update(fn)` method grants temporary mutable access + auto-saves. All 10 mutation sites migrated.
- **Files:** `src/systems/SaveSystem.ts`, `src/core/GameManager.ts`, `src/core/RollCoordinator.ts`, `src/core/EconomyCoordinator.ts`, `src/ui/SettingsPanel.ts`

### 2.4 ~~EventBus is fully untyped~~ ✅ DONE
- ~~`EventBus.emit('roll-complete', result)` — result is `any`~~
- ~~Typo in event name = silent failure at runtime, zero compile-time help~~
- ~~13+ events across the codebase, all string-keyed~~
- **Fixed:** Created `GameEventMap` interface (22 events) + `TypedEventEmitter` facade. Wraps Phaser's `Events.EventEmitter` with compile-time type safety for `emit()`, `on()`, `off()`, `once()`. Zero runtime cost — same EventEmitter underneath, only the TypeScript types change. All 15+ emitter/listener sites now get autocomplete and payload type checking.
- **Files:** `src/core/EventBus.ts` (4→43 lines), all emitters/listeners (~15 files)

### 2.5 ~~Overlay code duplication (~60 lines x3)~~ ✅ DONE
- ~~`LevelUpOverlay`, `LeaguePromotionOverlay`, `QuestClaimPopup` have **identical** `buildChoiceCard()` code~~
- ~~Same card background, button styling, shine effects, fitText calls~~
- ~~Bug fix = apply in 3 places~~
- **Fixed:** Extracted shared utility `src/ui/components/ChoiceCard.ts` (103 lines) with `buildChoiceButton()`, `drawCardBg()`, `drawBadgeRibbon()`, and shared color/size constants (`FREE_COLOR`, `AD_COLOR`, `BTN_W`, `BTN_H`, etc.). All three overlay files now import from ChoiceCard instead of duplicating code.
- **Files:** new `src/ui/components/ChoiceCard.ts`, `src/ui/LevelUpOverlay.ts`, `src/ui/LeaguePromotionOverlay.ts`, `src/ui/QuestClaimPopup.ts`

### 2.6 ~~Depth management: no system, collision risks~~ WON'T FIX
- ~~Scattered depth values with no documented hierarchy~~
- ~~NestHatchOverlay (500-503) collides with LevelUp/League/Rebirth (500-501)~~
- **Analysis:** No actual collisions. NestHatchOverlay is in **NestsScene**, LevelUp/LeaguePromo/Rebirth are in **MainScene** — Phaser scenes isolate depth, these never coexist. CollectionDetail (500) is in CollectionScene — also isolated. Within each scene, depth ranges are clean: MainScene 0→100→200→300→400→500→1000, NestsScene 0→500, CollectionScene 0→50→500.
- **Decision:** Local `const DEPTH` per file is sufficient. Centralizing into config.ts would touch ~15 files for zero functional change.

---

## TIER 3 — MEDIUM (code quality, maintainability)

### 3.1 Six files violate the <200 line rule
| File | Lines | Over by |
|------|-------|---------|
| MainScene.ts | 676 | 476 |
| ~~GameManager.ts~~ | ~~494~~ | ✅ 199 |
| QuestScene.ts | 430 | 230 |
| LevelUpOverlay.ts | 405 | 205 |
| BootScene.ts | 402 | 202 |
| SettingsPanel.ts | 396 | 196 |

- Fix 2.1 ✅ addressed GameManager. Fixes in 2.2, 2.5 address MainScene, LevelUpOverlay
- BootScene: extract asset preprocessing pipeline to `src/utils/assetPipeline.ts`
- QuestScene: extract quest card builder
- SettingsPanel: extract language dropdown logic

### 3.2 ~~config.ts (342 lines) — mixed concerns~~ WON'T FIX
- ~~Grade configs, quest configs, nest configs, UI constants, theme, utility functions all in one file~~
- **Analysis:** File contains only flat constants and simple utility functions — no complex logic. 59 files import from it; splitting with barrel re-export changes nothing for consumers. The 200-line rule targets complex logic files, not declarative config. File is already well-organized with clear commented sections.

### 3.3 Hardcoded magic numbers across overlays
- Button interaction delay `1500` ms — 3 files
- Choice card colors `0x78C828` (green), `0x7B2FBE` (purple) — 4 files
- Tween durations `250`, `300` ms — scattered
- **Fix:** Extract to `OVERLAY_CONFIG` and `CHOICE_CARD_COLORS` constants

### 3.4 GameManager EventBus listeners never cleaned up
- `setupListeners()` registers 5 listeners with no corresponding cleanup
- GameManager is a singleton so impact is low, but semantically incorrect
- If scene restarts cause re-registration, handlers stack
- **Fix:** Store listener references, add `cleanup()` method

### 3.5 No error handling in GameManager.roll()
- If RNG or progression system throws, game state becomes inconsistent
- No try/catch around the 73-line roll chain
- **Fix:** Wrap in try/catch, emit error event, preserve last known good state

### 3.6 `GRADE` and `GRADE_HOLD_MS` use `Record<string, ...>`
- Should be `Record<Grade, ...>` for key type safety
- Prevents typos like `GRADE_HOLD_MS['commmon']`
- **Files:** `src/core/config.ts`

---

## TIER 4 — LOW (polish, future-proofing)

### 4.1 PlatformSDK access pattern duplicated 7 times
```ts
const sdk = this.registry.get('platformSDK') as PlatformSDK | undefined;
if (sdk) { sdk.showRewardedBreak().then(...) }
```
- **Fix:** Helper `withRewardedAd(scene, onSuccess, onFail?)`

### 4.2 Graphics objects: no explicit .clear() before .destroy()
- Overlays create 16+ graphics objects per show() call
- Container.destroy() cascades, but `.clear()` is not called first
- Minor memory leak risk on repeated show/hide cycles
- **Fix:** Add `graphics.clear()` in cleanup methods

### 4.3 LeaderboardSystem has no data source abstraction
- Generates fake bots from seed, no async pattern
- When real API arrives, needs complete rewrite
- **Fix (future):** `ILeaderboardProvider` interface

### 4.4 No persistence abstraction for server-side saves
- SaveSystem hardcoded to localStorage
- Poki players lose progress on device switch
- **Fix (future):** `ISaveProvider` with `LocalStorageProvider` + `ServerProvider`

### 4.5 Pre-launch: strip dev-era save migrations
- `SaveSystem.ts` has 20 migration steps (v2→v21, ~130 lines) accumulated during development
- No real player has saves older than the launch version — all migrations are dead code
- Dead migrations add confusion for future devs and bloat a critical file (290 lines)
- **Fix (before first publish):**
  1. Delete entire `migrate()` function
  2. In `load()`: if `parsed.version !== CURRENT_VERSION` → reset to `getDefaults()` (treat outdated save as corrupted)
  3. Keep `patchDefaults()` as safety net for partial field corruption
  4. Set `CURRENT_VERSION` to 1 (clean start for production)
  5. Future migrations start from v1→v2 with real player data in mind
- **Timing:** Do this as the very last step before Poki submission — after all other save-format changes are finalized. Any change that bumps save version (new fields, restructuring) should land first.
- **Files:** `src/systems/SaveSystem.ts`

### 4.6 MainScene depth update on every frame during autoroll
```ts
if (autoActive && !this.wasAutorollActive) {
  this.setUIDepth(105); // called per frame, not just on state change
}
```
- **Fix:** Call only on state **change**: `if (autoActive !== this.wasAutorollActive)`

---

## What's Good (keep doing this)

- **Logic/Render separation** — systems/ has zero Phaser imports. Portable to server.
- **EventBus** — 4 lines, proper decoupling, no over-engineering.
- **Config-driven balance** — all numbers in config.ts, not scattered in logic.
- **Compact codebase** — 83 files, ~13K lines for a full game with 9 scenes.
- **Save migrations** (v2→v21) — mature pattern, to be stripped before launch (see 4.5).
- **Composition over inheritance** — zero class hierarchies.
- **Localization** — all strings through `t('key')`, two languages shipped.
- **Security** — checksum on saves, delta capping, reward validation, level guards.
- **Ad safety** — all 7 call sites verified, cooldown guards, session timer.
- **Asset pipeline** — BootScene trim/downscale reduces WebGL aliasing.
- **No `any`** — strict TypeScript everywhere, zero untyped code found.
- **Clean scene lifecycle** — all 13 MainScene listeners properly unregistered in shutdown.

---

## Execution Order

**Phase 1 (Blockers):** 1.1 → 1.2 → 1.3
**Phase 2 (Architecture):** 2.5 → 2.6 → 2.4 → 2.1 → 2.2 → 2.3
**Phase 3 (Quality):** 3.1 → 3.3 → 3.4 → 3.5 → 3.6 → 3.2
**Phase 4 (Polish):** 4.1 → 4.6 → 4.2 → 4.3 → 4.4
**Pre-launch (last step):** 4.5

Start with low-risk high-value items (overlay dedup, depth system, typed events) before touching core architecture (GameManager split, OverlayQueue).

---

## Verification

After each change:
1. `npm run build` — must pass with zero errors
2. Playwright: navigate to `http://localhost:8080/`, take screenshot, verify UI
3. Click ROLL, open Collection, Shop, Progression — verify interactions
4. Check `browser_console_messages` for runtime errors
5. Verify save/load cycle (roll a pet, reload page, check persistence)
6. Test overlay chain: trigger level-up + league promo on same roll
7. Final: `npm run build` → check dist/ size stays under 5MB JS, 25MB total

---

## Changelog

### 2026-03-10 — Rebrand + Loading Screen

**1.2 Rebrand: PETS GO Lite → PETS ROLL**
- `index.html:8` — `<title>PETS ROLL</title>`
- `package.json:2` — `"name": "pets-roll"`
- `src/scenes/BootScene.ts:26` — loading screen title text
- `SAVE_KEY` intentionally kept as `pets_go_lite_save` (changing would wipe existing saves)

**Loading screen redesign (`src/scenes/BootScene.ts`)**
- Dark background `0x12121e` (THEME.SCENE_BG) instead of black
- Illustration (`public/assets/ui/illustration.png`) pre-downscaled via canvas to 420px with `imageSmoothingQuality: 'high'` (same pipeline as all other assets), positioned at `cy - 75`
- Title "PETS ROLL" in Rubik Black 38px, white fill, black stroke 8px
- Progress bar: pill-shaped 300×22, triple outline (black→gold→black), blue fill `0x3cb8e8`, highlight shine, percentage text centered
- Matches game-wide visual patterns (THEME colors, triple outlines, Rubik fonts, ProgressBar shine)

**Daily Bonus checkmark fix (`src/ui/DailyBonusCards.ts`)**
- Bug: `setDisplaySize(20,20).setScale(0)` zeroed `displayWidth`, so `displayWidth/width = 0` → checkmark tween target was 0 (invisible forever)
- Fix: save `targetScale` before `setScale(0)`, tween to saved value

### 2026-03-10 — OverlayQueue (2.2)

**Extract OverlayQueue from MainScene overlay chaining**
- New `src/ui/OverlayQueue.ts` (36 lines) — pure TS queue: `enqueue(task)` / `start(onAllComplete)` / `clear()`
- Removed 3 `pending*` fields + 5 chaining methods (`finishLevelUp`, `showLeaguePromo`, `finishLeaguePromo`, `showRebirth`, `finishRebirth`)
- 3× duplicated cleanup code (setKeepOverlay + fade tween + completeRoll) → single `dismissOverlayAndComplete()`
- Event handlers (`onLevelUp`, `onLeaguePromotion`, `onRebirthTriggered`) now push task closures to queue
- `onRollComplete` simplified: after hatch → `overlayQueue.start()` → queue drains → cleanup
- Zero changes to overlay classes, CenterStage, GameManager, or EventBus
- MainScene: 676→624 lines (-52)

### 2026-03-10 — SaveSystem immutability (2.3)

**Fix: `getData()` returns mutable reference**
- Added `DeepReadonly<T>` recursive type to `SaveSystem.ts` — compile-time protection, zero runtime cost
- `getData()` now returns `DeepReadonly<SaveData>` — direct mutations cause TypeScript errors
- Added `update(fn: (data: SaveData) => void)` — grants temporary mutable access + auto-saves
- All 10 mutation sites migrated to `update()`:
  - `GameManager.persistSave()` — bulk sync wrapped in `save.update()`
  - `RollCoordinator.performRebirth()` — `rebirthCount++` via `save.update()`
  - `EconomyCoordinator` (3 sites) — `eggInventory` mutations via `save.update()`
  - `SettingsPanel` (5 sites) — settings mutations via `save.update()`, removed manual `save()` calls
- Read-only consumers unchanged (BootScene, MainScene, CollectionScene, GameManager getters)
- **Files:** `SaveSystem.ts`, `GameManager.ts`, `RollCoordinator.ts`, `EconomyCoordinator.ts`, `SettingsPanel.ts`

**Added pre-launch task 4.5: strip dev-era save migrations**
- 20 migration steps (v2→v21, ~130 lines) are dead code — no real players have old saves
- Scheduled as last step before Poki submission
- **File:** `TECH_REVIEW_2.md`

### 2026-03-10 — Typed EventBus (2.4)

**Fix: EventBus is fully untyped**
- Added `GameEventMap` interface with 22 typed events in `src/core/EventBus.ts`
- Created `TypedEventEmitter` facade: typed `emit()`, `on()`, `off()`, `once()` over Phaser's `Events.EventEmitter`
- Zero runtime cost — same EventEmitter underneath, only compile-time types added
- All ~15 emitter/listener files now get autocomplete + payload type checking
- Event typos and wrong payloads now caught at compile time
- **Files:** `src/core/EventBus.ts` (4→43 lines)

### 2026-03-10 — ChoiceCard shared utility (2.5)

**Fix: Overlay code duplication (~60 lines x3)**
- Extracted `src/ui/components/ChoiceCard.ts` (103 lines) from duplicated code in LevelUpOverlay, LeaguePromotionOverlay, QuestClaimPopup
- Exports: `buildChoiceButton()` (pill button with shadow, highlight, shine, feedback), `drawCardBg()` (rounded rect card), `drawBadgeRibbon()` (+300% ribbon)
- Shared constants: `FREE_COLOR/AD_COLOR/FREE_DARK/AD_DARK`, `BTN_W=111/BTN_H=35/BTN_R/BTN_SHADOW`
- All three overlay files refactored to import from ChoiceCard
- **Files:** new `src/ui/components/ChoiceCard.ts`, `src/ui/LevelUpOverlay.ts`, `src/ui/LeaguePromotionOverlay.ts`, `src/ui/QuestClaimPopup.ts`
