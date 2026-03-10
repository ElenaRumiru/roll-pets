# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PETS GO Lite — 2D RNG casual/gacha-lite web game built with Phaser 3 + TypeScript + Vite. Target platforms: Poki, CrazyGames, GameDistribution. Monetization: rewarded video ads (buffs) + interstitial ads (autoroll toggle).

Core loop: Click egg → hatch → get pet → XP + coins → level up → better luck → repeat. No pity system, infinite free rolls. Coins can be spent in the Shop to buy specific uncollected pets.

## Commands

```bash
npm run dev          # Start Vite dev server on localhost:8080
npm run build        # Production build to dist/ (terser minification)
npm run dev-nolog    # Dev server without Phaser analytics ping
npm run build-nolog  # Build without analytics ping
```

No test framework configured yet. TypeScript checking is done by Vite at build time (`noEmit: true` in tsconfig).

## Architecture

**Core principle: Logic vs Render separation.** Systems are pure TypeScript (no Phaser imports). Scenes only handle display and input, delegating all logic to systems via GameManager.

**Communication: EventBus pattern.** Scenes and systems never call each other directly. All communication goes through a central EventEmitter (`core/EventBus.ts`). Example: Scene emits `roll-requested` → GameManager handles logic → emits `roll-complete` → Scene plays animation.

**GameManager** is the central coordinator (thin delegator). It creates all systems, exposes high-level methods, and delegates logic to two coordinators: `RollCoordinator` (roll chain, level-up, league promo, rebirth, nest hatch) and `EconomyCoordinator` (purchases, claims, buff activation, nest operations). Scenes access GameManager via Phaser's registry — no global variables.

**Composition over inheritance.** UI panels are built from small reusable components (Button, ProgressBar, FloatingText). No class inheritance chains.

**Entry flow:** `index.html` → `src/main.ts` (awaits `document.fonts.ready`) → `src/game/main.ts` (Phaser config, 1031x580 16:9, Scale.FIT)

**Scene flow:** Boot → Main ↔ Collection / Progression / Shop / Nests / Leaderboard

```
src/
├── main.ts                         # DOM ready → StartGame()
├── game/main.ts                    # Phaser config & scene registration
│
├── core/
│   ├── EventBus.ts                 # Central event emitter (~10 lines)
│   ├── GameManager.ts              # Thin delegator: creates systems, delegates to coordinators
│   ├── RollCoordinator.ts          # Roll chain, level-up, league promo, rebirth, nest hatch
│   ├── EconomyCoordinator.ts       # Purchases, claims, buff activation, nest operations
│   └── config.ts                   # All balance constants + UI HUD configs (COIN_HUD, XP_HUD)
│
├── types/index.ts                  # All interfaces (Pet, Grade, SaveData, LevelUpData, LeaguePromotionData, RebirthData, etc.)
│
├── data/
│   ├── pets.ts                     # 187 pets (id, name, emoji, imageKey, chance)
│   ├── eggs.ts                     # Dynamic egg filter by level/visual tier
│   ├── eggTiers.ts                 # 17 egg tier configs (price, buffMultiplier, incubationMs)
│   ├── milestones.ts               # Milestone data generator for progression track
│   ├── leaderboard.ts              # League tiers (Bronze→Master), getLeagueForChance()
│   ├── backgrounds.ts              # 17 background themes
│   └── locales/
│       ├── en.ts                   # English strings (base)
│       ├── ru.ts                   # Russian strings
│       └── index.ts                # t('key') lookup function
│
├── systems/                        # Pure TS, zero Phaser dependency
│   ├── RNGSystem.ts                # sfc32 PRNG + weightedRandom
│   ├── ProgressionSystem.ts        # XP, coins, levels, luck formula
│   ├── SaveSystem.ts               # localStorage with checksum + validation (v21)
│   ├── AudioSystem.ts              # Play/stop/mute wrapper
│   ├── BuffSystem.ts               # Buff state (lucky/super/epic multipliers, autoroll toggle, rebirth multiplier)
│   ├── QuestSystem.ts              # Daily quest logic, progress tracking, UTC midnight reset
│   ├── ShopSystem.ts              # Daily shop: offers, purchases, refresh, UTC midnight reset
│   ├── NestSystem.ts              # Nest slot management, incubation timers, hatch logic
│   └── LeaderboardSystem.ts       # League standings, fake bot players, rating calculation
│
├── scenes/
│   ├── BootScene.ts                # Asset loading + image pre-downscaling (trim, resize icons)
│   ├── MainScene.ts                # Gameplay dashboard (creates UI panels)
│   ├── CollectionScene.ts          # Pet grid with filters
│   ├── ProgressionScene.ts         # Level-up rewards track (horizontal scroll)
│   ├── ShopScene.ts               # Daily shop + egg shop (two tabs when incubation unlocked)
│   ├── NestsScene.ts              # Incubation: 3 nest slots, egg placement, hatch collection
│   └── LeaderboardScene.ts        # Full-screen leaderboard with league tabs
│
├── ui/
│   ├── TopBar.ts                   # Shield icon with level number + blue XP bar (top-left, clickable → ProgressionScene)
│   ├── CoinDisplay.ts             # Coin HUD (top-right, left of settings)
│   ├── SettingsButton.ts          # Settings icon image (top-right)
│   ├── CollectionButton.ts        # Collection count (bottom-left)
│   ├── ShopButton.ts              # Shop entry (bottom-right, aligned with bonus/quest panels)
│   ├── CenterStage.ts             # 3 pedestal slots + rhombus shadows + roll overlay (pet + odds + rewards)
│   ├── RightPanel.ts              # Roll button (bottom-center) + autoroll toggle (locked/unlocked)
│   ├── QuestPanel.ts              # Daily quest panel (right side, above BonusPanel)
│   ├── QuestClaimPopup.ts         # Quest reward confirmation popup (free vs ad)
│   ├── OverlayQueue.ts            # Queue-based overlay sequencer (levelUp → leaguePromo → rebirth)
│   ├── LevelUpOverlay.ts          # Level-up popup: feature unlock / egg / coins variants
│   ├── LeaguePromotionOverlay.ts  # League promotion popup: rating icon + free vs ad coin choice
│   ├── RebirthOverlay.ts          # Rebirth/Samsara popup: informational overlay with ACCEPT button
│   ├── NestsButton.ts             # Incubation button (bottom, locked/unlocked states)
│   ├── NestSlotCard.ts            # Single nest slot card (empty/incubating/ready)
│   ├── NestHatchOverlay.ts        # Hatch animation overlay for nests
│   ├── EggSelectPopup.ts          # Egg selection grid popup for nest placement
│   ├── ShopPetsTab.ts             # Pet cards builder for shop Pets tab
│   ├── ShopEggsTab.ts             # Egg cards builder for shop Eggs tab
│   ├── Leaderboard.ts             # Mini leaderboard widget with rating icon on main screen
│   ├── PetCard.ts                  # Single pet card with image sprite (for collection grid)
│   ├── PetThought.ts               # Dream buff thought bubble (x100, 15min timer, alternates sides)
│   └── components/
│       ├── Button.ts               # Reusable button with tween
│       ├── ProgressBar.ts          # Reusable progress bar
│       ├── FloatingText.ts         # "+25 XP" floating text
│       ├── fitText.ts              # Auto-shrink text to fit max width
│       ├── buttonFeedback.ts       # Press/release scale tween for buttons
│       └── shineEffect.ts         # Diagonal shine sweep for CLAIM/WATCH buttons
│
└── platform/
    ├── PlatformSDK.ts              # Interface (showRewardedBreak, commercialBreak)
    ├── PokiAdapter.ts              # Poki SDK implementation
    └── NullAdapter.ts              # No-op for local dev
```

**Code rules:**
- No file exceeds 200 lines — split if it grows
- No `any` — strict TypeScript everywhere
- No inheritance between game objects — composition only
- No hardcoded UI strings — all text goes through `t('key')` from `data/locales/`
- ~33 files, ~2500 lines total, average file ~60-80 lines

**Localization:** All user-facing text is stored in `data/locales/en.ts` as key-value pairs. Scenes use `t('roll_button')` instead of `'ROLL!'`. To add a language: copy `en.ts`, translate values (AI-ready), register in `index.ts`.

**Fonts:** Bundled Rubik variable `.woff2` in `public/assets/fonts/Rubik.woff2` (~115 KB, single file, all weights). Three font constants via `@font-face` in `public/style.css`: **Rubik Black 900** (`UI.FONT_MAIN`) for headings without stroke, **Rubik Medium 500** (`UI.FONT_STROKE`) for text with outline/stroke, **Rubik Light 300** (`UI.FONT_BODY`) for body text. `font-display: block` prevents FOUT. Game startup awaits `document.fonts.ready` before creating the Phaser instance.

**Resolution:** 1031x580 (Poki-recommended 16:9). Phaser Scale.FIT fills the canvas on all devices.

**Safe zone:** 15px from all screen edges for HUD elements. Left/right margins use `LEFT_PANEL.x = 15` and `GAME_WIDTH - w - 15`. Top margin = 15px (TopBar, CoinDisplay, SettingsButton). Bottom margin = 15px (CollectionButton, ShopButton, Roll button bottom edge, Autoroll toggle).

**UI color theme:** Panel backgrounds use `THEME.PANEL_BG` (`0x111122`) with `THEME.PANEL_ALPHA` (`0.8`). Main-screen panels (CollectionButton, ShopButton, NestsButton, DailyBonusButton, QuestPanel, Leaderboard) have double outline: outer black `lineStyle(4, 0x000000, 1)` + inner gold `lineStyle(1.5, 0xFEBF07, 1)`. Small HUD elements (CoinDisplay, SettingsButton, ProgressBar/XP bar) use single black outline `lineStyle(2, 0x000000, 0.7)`. Dropdowns use single white `lineStyle(2, 0xffffff, 0.2)`. Buff offer cards (BonusPanel) use double outline with buff-specific color instead of gold. THEME constants in `config.ts`: `PANEL_BG`, `PANEL_ALPHA`, `SCENE_BG` (`0x12121e`), `POPUP_BG` (`0x1a1a2e`), `CARD_BG` (`0x2a2a3e`), `BAR_BG` (`0x222244`). Accent green `0x78C828` for CLAIM/FREE buttons. XP bar blue `0x3cb8e8`. Notification badges use double `fillCircle` technique (black outer r+1.5, colored inner r) instead of `strokeCircle` for crisp edges. CLAIM/WATCH buttons have diagonal shine sweep effect (`addShineEffect` utility).

**TopBar (XP panel):** Pill-shaped progress bar (192×32, `XP_HUD` config) with no dark background. Blue shield icon (`ui/lvl_icon.png`, trimmed+resized in BootScene) overlaps left edge at 42×42 display, level number centered inside. XP text overlay on bar. Mirrors CoinDisplay's visual pattern.

**SettingsButton:** Uses image icon (`ui/settings_icon.png`, trimmed+resized to `ui_settings_md`) instead of Unicode character. 31×31 display inside circular dark bg.

**SettingsPanel:** All text uses `UI.FONT_STROKE` with black stroke for consistency with rest of game. Panel background is fully opaque (`alpha: 1`).

**Leaderboard widget:** Has `ICON_AREA = 48` for rating icon (`ui/Rating_icon_3.png`, trimmed via `trimToWidth` at exact display width=99px for 1:1 pixel mapping — no WebGL scaling, avoids aliasing on thin lines) protruding above the dark panel, similar to QuestPanel's icon pattern.

**Testing:** Always use Playwright MCP to test the game. At the start of every session, navigate to `http://localhost:8080/` via Playwright to verify the dev server is running. Before launching Chrome, check if it's already open (Playwright will fail with a resource access error if Chrome is running). If it fails, ask the user to close Chrome or start the dev server. After every code change, reload the page in Playwright and take a screenshot to verify visuals. Use `browser_console_messages` to check for errors. Click UI elements (ROLL button, Collection, etc.) to test interactions.

## Security

**Ad reward pattern:** All `showRewardedBreak()` call sites follow the same pattern: `if (sdk) { sdk.showRewardedBreak().then(...) } else { /* no-op or FREE reward only */ }`. When SDK is missing, NEVER grant ad-tier rewards — either do nothing (buffs, boost, shop refresh) or grant only the FREE amount (coins, quest rewards). 7 call sites: `MainScene.ts` (buffs, level-up coins, league promo coins, quest popup), `QuestScene.ts` (quest WATCH button), `NestsScene.ts` (incubation boost), `ShopScene.ts` (shop refresh).

**Save integrity:** `SaveSystem.ts` wraps save data in `{data, hash}` envelope. Hash is FNV-1a with embedded salt. On load: if hash doesn't match → reset to defaults. Legacy saves (without hash) are accepted once and re-saved with hash. Salt in `HASH_SALT` constant — obfuscated in minified build.

**Save validation:** `validateData()` runs after every load. Clamps: level [1,1000], coins ≥ 0, rebirthCount [0, maxCount], buff charges [0,9999], collection filtered to valid pet IDs only, eggInventory keys [1-17] only.

**Delta capping:** `GameManager.update()` caps `deltaMs` to 200ms max, preventing speed hack of quest timers, buff cooldowns, and daily reset checks.

**Level guards:** `setAutorollToggle()` checks `level >= AUTOROLL_TOGGLE.unlockLevel` before enabling. UI-level checks in `RightPanel.setLocked()` are backed by GameManager-level validation.

**Reward validation:** `claimLevelUpCoins()` and `claimLeaguePromoCoins()` track pending expected amounts (`pendingLevelUpReward`, `pendingLeaguePromoReward`) and cap input to `baseReward × adCoinMultiplier`. Prevents arbitrary coin injection via console.

**Known limitations (client-only game, no server):** Determined cheaters with devtools can still access GameManager via Phaser registry, emit EventBus events, or replace the SDK mock. This is a fundamental limitation of all client-only web games on Poki — acceptable because there's no competitive PvP and the leaderboard uses fake bots.

## Key Constraints

- **Bundle size:** < 5 MB total (8 MB hard limit for Poki). Phaser itself is ~1 MB.
- **No external requests:** All portals block external CDNs, fonts, analytics.
- **localStorage must be wrapped in try/catch** (incognito/cookie-blocker safety).
- **Aspect ratio:** 16:9 landscape primary. Must scale on mobile/tablet.
- **Ad lifecycle:** Never call `gameplayStart()` twice without `gameplayStop()` in between.
- **No ads first 2 minutes** of session (Poki policy).
- **ESC key** must pause/resume (Poki requirement).

## Build Configuration

- **Dev config:** `vite/config.dev.mjs` — port 8080, manual chunks (phaser separated)
- **Prod config:** `vite/config.prod.mjs` — terser 2-pass minification, no comments, `base: './'` for relative paths
- **TypeScript:** ES2020 target, strict mode, bundler module resolution, `strictPropertyInitialization: false`

## Documentation

All design documents are in `documentation/`:
- `TECHNICAL_DESIGN_SPECIFICATION.md` — Full architecture, RNG system (sfc32), platform SDK abstraction, ad strategy, 8-week roadmap
- `ABOUT_WEB_GAME_REQUIREMENTS.md` — Market analysis, portal requirements (Poki/CrazyGames/Yandex), monetization economics
- `_PETS GO!_ (1).pdf` — Original game reference
- `Таблицы _PETS GO_.xlsx` — Pet data tables
- `balance/balance.xlsx` — Single Excel workbook with 15 sheets (run `node documentation/balance/generate_balance.js`): pet stats, grade distribution, XP curve, egg tiers, roll probabilities, buff economics, golden path simulation

## Research Protocol

When working with Phaser 3, JavaScript, TypeScript, or any library — use Context7 MCP tool (`resolve-library-id` → `query-docs`) to fetch up-to-date official documentation.

When official docs are not enough, **search the wider internet**: Reddit, YouTube, Stack Overflow, GitHub issues, dev blogs. Real-world solutions and workarounds often live outside official documentation. This is mandatory, not optional — always check community sources when stuck or implementing non-trivial features.

## Game Balance Reference

**Grade system (11 MVP tiers):** Grade is derived from pet's `chance` value via `getGradeForChance()` — not stored as a field. Grades: Common [2,100), Uncommon [100,1K), Extra [1K,5K), Rare [5K,50K), Superior [50K,500K), Elite [500K,5M), Epic [5M,50M), Heroic [50M,250M), Mythic [250M,500M), Ancient [500M,750M), Legendary [750M,1B). 4 post-MVP grades defined but unused: Astral, Cosmic, Divine, Absolute.

**187 pets** distributed: Common(30), Uncommon(50), Extra(38), Rare(21), Superior(14), Elite(12), Epic(7), Heroic(6), Mythic(3), Ancient(3), Legendary(3). Each pet has its own unique sprite.

**Roll algorithm:** Sequential check from rarest to most common, `checkChance = min(1, luckMultiplier / pet.chance)`. First pet to pass = result, fallback = most common in pool. Buff multipliers stack multiplicatively: Rebirth (permanent) x Lucky x2 x Super x3 x Epic x5 x Dream x100. Max without rebirth or dream: x30. Max with 8 rebirths (x9) + dream: x27,000. Charges per ad watch: Lucky 20, Super 15, Epic 12 (configured in `BUFF_CONFIG.rollsPerAd`). Dream buff grants 1 charge via thought bubble (no ad). Offer cycle: 15s visible → 10s cooldown (~25s per offer, ~144/hour).

**Eggs:** Dynamic filter via `getEggFilterForLevel(level)` — each visual tier (1–17) removes one common pet from the pool. Tiers spread across 1000 levels: `[1, 15, 35, 60, 90, 125, 170, 225, 290, 365, 450, 545, 640, 735, 830, 910, 975]`. XP curve: sigmoid `XP_FLOOR + XP_SCALE * l² / (l² + XP_KNEE²)` (20–1050 range, knee at level 20). New pet = +25% XP bar, duplicate = +0.5-10% based on grade.

**Coin economy:** Each roll awards coins based on grade. New pets: Common 5, Uncommon 10, Extra 25, Rare 50, Superior 100, Elite 250, Epic 500, Heroic 1K, Mythic 2.5K, Ancient 5K, Legendary 10K. Duplicates: ~10-20% of new (Common 1 → Legendary 1K). Coins persist in save, displayed via `CoinDisplay` HUD (top-right). Roll overlay shows EXP + coin rewards on one line with icons.

**Level-up overlay:** Three variants triggered on level-up. Config in `LEVELUP_CONFIG`.
- **Feature unlock variant** (`featureUnlock !== undefined`): double gold ring with level number, "New feature unlocked!" subtitle, 2x-sized feature icon centered between subtitle and name, feature name in gold, description in same style as egg effect line, "Tap to close (N)" countdown (5s). Triggers for Auto Roll at level 3 (`AUTOROLL_TOGGLE.unlockLevel`) and Incubation at level 5 (`NEST_CONFIG.unlockLevel`). Features configured via `FEATURE_INFO` lookup map (iconKey, nameKey, descKey).
- **Egg variant** (`eggChanged === true`): double gold ring with level number, "New Egg Unlocked!" subtitle, old→new egg transition, egg name + odds characteristic, "Tap to close (N)" countdown (5s), tap anywhere or auto-close.
- **Coins variant** (`eggChanged === false`): double ring, "Rewards:" subtitle, two choice cards — FREE (green, `levelUpCoinReward(level)` coins = rolls needed for that level, auto-accepts after 10s countdown shown in button) and WATCH AD (purple, `reward * 3` coins, +300% badge, rewarded video via PlatformSDK). Coins are **deferred** — not added in `roll()`, but via `GameManager.claimLevelUpCoins(amount)` after player choice. Ad failure falls back to free amount. Overlay depth 500 (above autoroll UI at 105), blocks all clicks behind it. All variants pause autoroll until dismissed.

**League Promotion overlay:** Triggered when a roll causes the player's best pet to cross into a new league tier. Config in `LEAGUE_PROMOTION_REWARDS` (config.ts). League thresholds (best pet chance): Bronze [2, 5K), Silver [5K, 50K), Gold [50K, 5M), Diamond [5M, 250M), Master [250M, 1B). Promotion rewards: Silver 500, Gold 5K, Diamond 50K, Master 500K coins. Detection: `GameManager.roll()` compares `getLeagueForChance(bestChance)` before and after `processRoll()`, emits `league-promotion` event. UI in `LeaguePromotionOverlay.ts`: rating icon (podium), title "LEAGUE PROMOTION!" in league color, subtitle "New League: {name}", two choice cards (FREE with 10s countdown / WATCH AD x3). Coins deferred via `claimLeaguePromoCoins(amount)`. Overlay chaining: if level-up, league promotion, and rebirth all trigger on same roll, they show in order: level-up → league promo → rebirth. All pause autoroll until dismissed.

**Rebirth / Samsara:** Prestige system triggered automatically at level 1000. Config in `REBIRTH_CONFIG` (config.ts). Max 8 rebirths (x9 cap). Save version 19.
- **Trigger:** When `checkLevelUp()` reaches level 1000, `GameManager.performRebirth()` is called immediately (before emitting event). Cannot be avoided — if player reloads during overlay, constructor detects level >= 1000 and force-rebirths on load.
- **What resets:** Level → 1, XP → 0 (egg tier & background auto-derive from level). Autoroll disabled.
- **What persists:** Collection, coins, egg inventory, nest slots, quests, shop, buffs, dailyBonus, settings, totalRolls.
- **Multiplier:** Permanent luck multiplier = `1 + rebirthCount`. Stacks multiplicatively with all buffs: `rebirth × lucky × super × epic`. 1st rebirth: x2 base (x60 with all buffs). 8th rebirth: x9 base (x270 with all buffs).
- **BuffSystem:** `rebirthMultiplier` field, set via `setRebirthMultiplier()`, applied in `consumeForRoll()` and `peekMultiplier()`. Also applied to nest hatch rolls.
- **UI:** `RebirthOverlay.ts` — informational overlay with rebirth icon, title, multiplier display, what resets/keeps description, green ACCEPT button. Does not auto-close — waits for player to click ACCEPT. Plays `sfx_levelup`.
- **Badge:** "Samsara ∞" purple badge (`REBIRTH_CONFIG.color = 0xd063f0`) in BuffBadges. Long-press tooltip shows multiplier value (e.g., "Permanent luck multiplier from Rebirth (×2)").
- **Progression:** Milestone at level 1000 shows rebirth icon (`ui_rebirth_md`). Horizon capped at 1000 when `rebirthCount < maxCount`. No levels beyond 1000 are displayed.
- **Events:** `rebirth-triggered` (RebirthData), `rebirth-complete`. MainScene chains rebirth overlay after level-up and league promo overlays.

**Dream Buff / Thought Bubble:** Retention mechanic — a thought bubble appears from the 1st-place pet on the pedestal, offering a free x100 luck buff. Config in `THOUGHT_BUBBLE_CONFIG` (config.ts). UI in `PetThought.ts`.
- **Timer:** 15 minutes (`timerMs: 900_000`). After 3s initial delay (`initialDelayMs`), bubble appears with x100 icon and countdown "in Xm Ys". When timer expires, CLAIM button replaces the countdown.
- **Claim flow:** Player taps CLAIM → 1 charge of Dream buff granted → `commercialBreak()` interstitial ad → toast notification → bubble fades out.
- **Cooldown:** 15s (`cooldownMs`) after claim, bubble reappears on the opposite side of the pet. Alternates right↔left each cycle.
- **Multiplier:** x100, stacks multiplicatively with all other buffs (rebirth × lucky × super × epic × dream). 1 charge per claim, consumed on next roll.
- **Persistence:** Timer state (phase/timer/side) persists across scene transitions via `game.registry` with `Date.now()` elapsed time accounting. Session-only — resets on page reload.
- **Guard:** Bubble only appears if player has at least 1 pet in collection (`setHasPets()`).
- **Positioning:** Right side (658, 110), left side (380, 110) — diagonally above the 1st-place pedestal. Content offset: cx±4 per side.
- **Badge:** "Dream" in BuffBadges with `luck_x100_md` icon, orange color (`0xF5A623`).
- **Events:** `buffs-changed` emitted on claim. No dedicated event — uses existing buff system.

**Progression Window:** Opened by clicking TopBar (top-left panel). Shows horizontal scrollable track of level milestones. Four milestone types: egg milestone (at `VISUAL_TIERS` thresholds — double ring, egg image, name, odds text, incubation stats), feature milestone (at `AUTOROLL_TOGGLE.unlockLevel=3`, `NEST_CONFIG.unlockLevel=5`, and `REBIRTH_CONFIG.triggerLevel=1000` — double ring, feature icon, name, description via `featureMap` lookup), coin milestone (`levelUpCoinReward(level)` coins — single ring, coin icon, amount). Reached levels are yellow/colored, unreached are gray/grayscale. Initial scroll anchors on the last reached level at ~20% from left, showing ~2.5 unearned milestones to the right. Horizon = `min(max(currentLevel + 5, nextEggLevel + 3), 1000)` — capped at 1000 when rebirths available. Milestone data generated by `data/milestones.ts` with `getMilestones(currentLevel, rebirthCount)`. Scene transition follows CollectionScene pattern (stop autoroll, save state, scene.start).

**Shop:** Daily-refreshing store where players buy specific uncollected pets for coins. Managed by `ShopSystem` (pure TS), UI in `ShopScene` + `ShopButton`. Save version 13.
- Displays up to 5 random uncollected pets from the full 187-pet pool (regardless of player level).
- Pricing: `price = pet.chance * 2` (e.g., Common cat chance=2 → 4 coins; Legendary chance=750M → 1.5B coins).
- Pet selection uses `Math.random()` (non-competitive, no sfc32 needed).
- Daily reset at UTC midnight (same pattern as quests). Checked on load and periodic 60s timer.
- Manual refresh via rewarded ad: regenerates all offers from current uncollected pool.
- Purchase flow: click buy → coins deducted via `GameManager.purchasePet()` → pet added to collection → card removed → remaining cards re-center. "Not enough coins" toast on failed attempt.
- Scene transition follows CollectionScene pattern (stop autoroll, save state, scene.start).
- ShopButton positioned bottom-right (118px wide).
- Events: `shop-purchase` emitted on successful buy.

**Nests / Incubation:** Unlocks at level 5 (`NEST_CONFIG.unlockLevel`). Players place eggs in nest slots, wait for incubation, and hatch pets with a luck buff. Managed by `NestSystem` (pure TS), UI in `NestsScene` + `NestsButton` + `EggSelectPopup` + `NestSlotCard` + `NestHatchOverlay`. Save version 18. Nest hatch rolls are multiplied by rebirth multiplier (`buffMultiplier × rebirthMultiplier`).
- 3 nest slots (`NEST_CONFIG.maxSlots`), slot 1 free, slots 2-3 cost coins (`slotPrices: [0, 5K, 50K]`).
- Eggs are purchasable items with inventory tracking (`eggInventory: Record<string, number>` in save). 17 tiers with price, buffMultiplier, incubationMs defined in `data/eggTiers.ts`. Prices are cheap (10→1000 coins, tier 1→17) — the real gate is incubation time and player level (which determines hatch pool). Starter: 3 free tier-1 eggs.
- Placing egg: consumes from inventory, sets slot duration + buffMultiplier from tier config.
- Hatching: `rollPet(eligible, buffMultiplier)` uses stored multiplier for better pets.
- Shop has two tabs (Pets / Eggs) when incubation is unlocked. EggSelectPopup has "+" cell to navigate to shop eggs tab.
- **Locked state** (level < 5): NestsButton shows lock icon + "Lvl 5" text, click disabled. Shop shows only Pets tab, no Eggs tab.
- **Feature unlock**: Detected in `GameManager.roll()` when level crosses `unlockLevel`. Triggers feature unlock variant of LevelUpOverlay.
- Events: `nest-placed`, `nest-hatched`, `nest-collected` emitted on respective actions.

**Daily Bonus:** 7-day rotating rewards claimed once per day. Managed by `DailyBonusSystem` (pure TS), UI in `DailyBonusScene` + `DailyBonusCards.ts`. Config in `DAILY_BONUS_CONFIG` (config.ts).
- Odd days (1/3/5) give buffs, even days + day 7 (2/4/6/7) give eggs. Single reward per day.
- Weekly rewards: Day 1: 30x Lucky, Day 2: 3x Tier 2 (Green Egg), Day 3: 25x Super, Day 4: 1x Tier 8 (Dragon Egg), Day 5: 30x Epic, Day 6: 1x Tier 12 (Pirate Egg), Day 7: 1x Tier 14 (Fire Egg).
- Reward types: `'buff'` (buffType + count), `'egg'` (eggTier + count), `'coins'` (count). `DailyBonusReward` interface in `types/index.ts`.
- Card grid: 3+3 regular cards (108×100) + 1 tall Day 7 card (108×210). Unclaimed days show gift icon, today's card has green border, claimed cards show reward icon at 0.5 alpha + checkmark. Text label below icon with reward-colored name+count.
- Egg icons use `egg_{tier}_sm` textures (170px pre-downscaled), displayed at 1.3× buff icon size for visual balance.
- Monthly milestones: [8, 15, 22, 30] days → [500, 2K, 5K, 10K] coins. Progress bar + claimable gift icons.
- `GameManager.applyDailyBonusReward()` handles all three types: coins → `addCoins()`, buff → `addLucky/Super/Epic()`, egg → `addEggs(tier, count)`.
- Toast on claim shows reward name via locale keys (`egg_tier_N`, `badge_*`, `coins`).
- UTC midnight reset via `DailyBonusSystem.checkNewDay()`, checked on load and periodic 60s timer.

**Auto Roll:** Unlocks at level 3 (`AUTOROLL_TOGGLE.unlockLevel`). Before unlock, the toggle button area shows a lock overlay (dark rounded rect + lock icon + "Lvl 3" text, same visual pattern as NestsButton locked state). After unlock, toggle switches between `ui_automod_on`/`ui_automod_off` textures. Lock state managed by `RightPanel.setLocked()`, called from MainScene on init and `refreshUI()`. Feature unlock detected in `GameManager.roll()` and triggers feature unlock variant of LevelUpOverlay. Progression track shows autoroll milestone at level 3 with toggle icon.

**Daily Quests:** Three repeating quests (two visible at a time) that reset at UTC midnight. Managed by `QuestSystem` (pure TS), UI in `QuestPanel` + `QuestClaimPopup`. Step-based config in `QUEST_CONFIG` (config.ts).
- Quest types: Roll, Grade, Online. Each has a sequence of steps with escalating targets and per-step rewards.
- Roll quest: targets [3, 5, 10, 20, 50], loops at 50. Rewards (free/ad): Lucky 3/5 → 5/10 → 10/20 → 25/50 → 25/50. Modest rewards — rolls are passive.
- Grade quest: Uncommon x1,x2,x3 → Extra x1,x2,x3, loops at Extra x3. Accepts target grade or higher, count increments per qualifying roll. Rewards (free/ad): Super 3/8 → 5/12 → 5/12 → 8/20 → 10/25 → 12/30.
- Online quest (main priority): targets [1, 3, 5, 10, 30, 60] minutes, loops at 60. Most generous rewards — incentivizes session length. Rewards (free/ad): Epic 3/6 → 5/10 → 8/15 → 15/30 → 30/60 → 50/100.
- Milestones: at [3, 6, 9, 12, 15] quests completed, coin rewards [100, 500, 2K, 5K, 15K].
- Claim flow: progress bar → CLAIM button → popup with two card choices (free lime / ad purple) → buff granted. Tap outside popup to dismiss without claiming (CLAIM button stays active).
- Events: `quests-changed` emitted on progress/claim/reset. Daily reset checked on load, each roll, and periodic 60s timer.
