# Technical Review — PETS GO Lite

CTO-level audit. Project is structurally sound — issues below are about scalability, safety, and Poki readiness.

---

## BLOCKER — Poki Submission

### 1. Bundle size: 80 MB (limit 5 MB initial load)
- `dist/assets/ui/` = 39 MB — UI PNGs are 2048x2048, displayed at 30-100px
- `dist/assets/eggs/` = 26 MB — 17 egg PNGs at 1024x1024, displayed at max 296px
- `dist/assets/pets/` = 8.4 MB — 187 pet sprites
- Fix: pre-build resize script (2x max display size), PNG optimize / WebP convert (Already Done)
- Also: lazy loading for non-MainScene assets (backgrounds, grade SFX, collection icons)

### 2. PokiAdapter missing
- `PlatformSDK` interface exists, `NullAdapter` exists, but no real Poki SDK integration
- Need: `PokiAdapter.ts` with `PokiSDK.init()`, rewarded/commercial break calls, gameplay lifecycle

### 3. Coin economy may be broken
```ts
// ProgressionSystem.ts:22
const coinsGained = pet.chance;  // Legendary = 750,000,000 coins per roll
```
CLAUDE.md says "New Legendary = 10K coins". Either this is a placeholder or a bug. Verify against the balance spreadsheet.
No Owner said thats good. You mast change only documentation.
---

## HIGH Priority

### 4. SaveSystem.getData() returns mutable reference
Any code can directly mutate save data (`data.eggInventory`, `data.rebirthCount`, `data.totalRolls`). This is actively used throughout GameManager. No single point of mutation, no validation possible, no change tracking.

**Fix:** Either return deep copies, or route all mutations through SaveSystem methods.

### 5. EventBus is untyped
```ts
EventBus.emit('roll-complete', result);  // result: any
EventBus.on('league-promotion', handler);  // handler params: any
```
Phaser EventEmitter accepts `any`. Contract breakage is only caught at runtime.

**Fix:** Create typed wrapper:
```ts
interface GameEvents {
    'roll-complete': [RollResult];
    'level-up': [LevelUpData];
    'league-promotion': [LeaguePromotionData];
    // ...
}
```

### 6. No save integrity / anti-cheat
localStorage is editable from DevTools. Critical when real leaderboard connects — players can set coins/rebirthCount to any value.

**Fix (minimal):** HMAC checksum on save data with embedded salt.

---

## MEDIUM Priority

### 7. GameManager is a God Object (482 lines, growing)
Coordinates roll, buff, quest, shop, nest, daily bonus, rebirth, collection, leaderboard, egg purchase, save. Every new feature adds 20+ lines here.

**Fix:** Extract domain facades — `RollCoordinator` (roll + level-up + league promo + rebirth chain), `EconomyFacade` (coins, purchases, rewards).

### 8. MainScene = 678 lines (violates <200 line rule)
Contains UI building, overlay chaining (levelUp -> leaguePromo -> rebirth), pause, idle detection, autoroll, quest claim with ad SDK. The overlay chain is a hidden state machine using `pendingX` fields.

**Fix:** Extract `OverlayChain` class (state machine) and `PauseManager`.

### 9. LeaderboardSystem has no data source abstraction
Generates fake bots from seed. When real API arrives, entire class needs rewriting. No async pattern, no error handling for network calls.

**Fix:** `ILeaderboardProvider` interface with `LocalBotProvider` and future `ServerProvider`.

### 10. No persistence abstraction for server save
`SaveSystem` is hardcoded to localStorage. Server save (mandatory for Poki to prevent progress loss) requires:
- `ISaveProvider` with `load()/save()`
- `LocalStorageProvider` + `ServerProvider`
- Offline-first with sync-on-connect + conflict resolution

---

## LOW Priority

### 11. PlatformSDK access pattern duplicated 7+ times
```ts
const sdk = this.registry.get('platformSDK') as PlatformSDK | undefined;
if (sdk) { sdk.showRewardedBreak().then(...) }
```
**Fix:** Helper `withRewardedAd(scene, onSuccess, onFail?)`.

### 12. config.ts = 341 lines, mixed concerns
Grade configs, quest configs, nest configs, UI constants, theme, utility functions all in one file.
**Fix:** Split into `config/grades.ts`, `config/quests.ts`, `config/ui.ts`, etc.

### 13. GRADE and GRADE_HOLD_MS use Record<string, ...>
Should be `Record<Grade, ...>` for type safety on keys.

### 14. 6 files exceed 350 lines
MainScene (678), GameManager (482), QuestScene (430), LevelUpOverlay (405), BootScene (402), SettingsPanel (396). The <200 line rule is not enforced for core files.

---

## What's Good (keep doing this)

- **Logic vs Render separation** — systems/ has zero Phaser imports. Portable to server for validation.
- **EventBus** — 3 lines, no over-engineering. Proper decoupling.
- **Config-driven balance** — all numbers in config.ts, not scattered in logic.
- **Compact codebase** — 83 files, ~13K lines for a full game with 9 scenes. Impressive.
- **Save migrations** (v2->v21) — mature approach, no progress loss on updates.
- **Composition over inheritance** — no class hierarchies, UI built from small components.
- **Localization ready** — all strings through `t('key')`, two languages shipped.
