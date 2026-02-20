# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PETS GO Lite — 2D RNG casual/gacha-lite web game built with Phaser 3 + TypeScript + Vite. Target platforms: Poki, CrazyGames, GameDistribution. Monetization: rewarded video ads (buffs) + interstitial ads (autoroll toggle).

Core loop: Click egg → hatch → get pet → XP + coins → level up → better luck → repeat. No pity system, infinite free rolls. Coins accumulate (no spending yet).

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

**GameManager** is the central coordinator. It creates all systems and exposes high-level methods (e.g. `roll()`). Scenes access it via Phaser's registry — no global variables.

**Composition over inheritance.** UI panels are built from small reusable components (Button, ProgressBar, FloatingText). No class inheritance chains.

**Entry flow:** `index.html` → `src/main.ts` → `src/game/main.ts` (Phaser config, 836x470 16:9, Scale.FIT)

**Scene flow:** Boot → Main ↔ Collection / Progression

```
src/
├── main.ts                         # DOM ready → StartGame()
├── game/main.ts                    # Phaser config & scene registration
│
├── core/
│   ├── EventBus.ts                 # Central event emitter (~10 lines)
│   ├── GameManager.ts              # Creates systems, coordinates roll() logic
│   └── config.ts                   # All balance constants
│
├── types/index.ts                  # All interfaces (Pet, Grade, SaveData, etc.)
│
├── data/
│   ├── pets.ts                     # 100 pets (id, name, emoji, imageKey, chance)
│   ├── eggs.ts                     # Dynamic egg filter by level/visual tier
│   ├── milestones.ts               # Milestone data generator for progression track
│   ├── backgrounds.ts              # 17 background themes
│   └── locales/
│       ├── en.ts                   # English strings (base)
│       ├── ru.ts                   # Russian strings
│       └── index.ts                # t('key') lookup function
│
├── systems/                        # Pure TS, zero Phaser dependency
│   ├── RNGSystem.ts                # sfc32 PRNG + weightedRandom
│   ├── ProgressionSystem.ts        # XP, coins, levels, luck formula
│   ├── SaveSystem.ts               # localStorage with try/catch (v12)
│   ├── AudioSystem.ts              # Play/stop/mute wrapper
│   ├── BuffSystem.ts               # Buff state (lucky/super/epic multipliers, autoroll toggle)
│   └── QuestSystem.ts              # Daily quest logic, progress tracking, UTC midnight reset
│
├── scenes/
│   ├── BootScene.ts                # Asset loading + image pre-downscaling
│   ├── MainScene.ts                # Gameplay dashboard (creates UI panels)
│   ├── CollectionScene.ts          # Pet grid with filters
│   └── ProgressionScene.ts         # Level-up rewards track (horizontal scroll)
│
├── ui/
│   ├── TopBar.ts                   # Level badge + XP bar (top-left, clickable → ProgressionScene)
│   ├── CoinDisplay.ts             # Coin HUD (top-right, left of settings)
│   ├── SettingsButton.ts          # Gear icon (top-right)
│   ├── CollectionButton.ts        # Collection count (left side)
│   ├── CenterStage.ts             # 3 pedestal slots + rhombus shadows + roll overlay (pet + odds + rewards)
│   ├── RightPanel.ts              # Roll button (bottom-center) + autoroll toggle (right of Roll)
│   ├── QuestPanel.ts              # Daily quest panel (right side, above BonusPanel)
│   ├── QuestClaimPopup.ts         # Quest reward confirmation popup (free vs ad)
│   ├── LevelUpOverlay.ts          # Level-up popup: egg variant (tap-to-close) / coins variant (free vs ad choice)
│   ├── PetCard.ts                  # Single pet card with image sprite (for collection grid)
│   └── components/
│       ├── Button.ts               # Reusable button with tween
│       ├── ProgressBar.ts          # Reusable progress bar
│       └── FloatingText.ts         # "+25 XP" floating text
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
- ~28 files, ~2200 lines total, average file ~60-80 lines

**Localization:** All user-facing text is stored in `data/locales/en.ts` as key-value pairs. Scenes use `t('roll_button')` instead of `'ROLL!'`. To add a language: copy `en.ts`, translate values (AI-ready), register in `index.ts`.

**Resolution:** 836x470 (Poki-recommended 16:9). Phaser Scale.FIT fills the canvas on all devices.

**Testing:** Always use Playwright MCP to test the game. At the start of every session, navigate to `http://localhost:8080/` via Playwright to verify the dev server is running. Before launching Chrome, check if it's already open (Playwright will fail with a resource access error if Chrome is running). If it fails, ask the user to close Chrome or start the dev server. After every code change, reload the page in Playwright and take a screenshot to verify visuals. Use `browser_console_messages` to check for errors. Click UI elements (ROLL button, Collection, etc.) to test interactions.

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

## Research Protocol

When working with Phaser 3, JavaScript, TypeScript, or any library — use Context7 MCP tool (`resolve-library-id` → `query-docs`) to fetch up-to-date official documentation.

When official docs are not enough, **search the wider internet**: Reddit, YouTube, Stack Overflow, GitHub issues, dev blogs. Real-world solutions and workarounds often live outside official documentation. This is mandatory, not optional — always check community sources when stuck or implementing non-trivial features.

## Game Balance Reference

**Grade system (11 MVP tiers):** Grade is derived from pet's `chance` value via `getGradeForChance()` — not stored as a field. Grades: Common [2,100), Uncommon [100,1K), Improved [1K,5K), Rare [5K,50K), Valuable [50K,500K), Elite [500K,5M), Epic [5M,50M), Heroic [50M,250M), Mythic [250M,500M), Ancient [500M,750M), Legendary [750M,1B). 4 post-MVP grades defined but unused: Astral, Cosmic, Divine, Absolute.

**100 pets** distributed: Common(28), Uncommon(24), Improved(14), Rare(12), Valuable(8), Elite(5), Epic(4), Heroic(2), Mythic(1), Ancient(1), Legendary(1). New pets reuse existing 30 sprites via shared `imageKey`.

**Roll algorithm:** Sequential check from rarest to most common, `checkChance = min(1, luckMultiplier / pet.chance)`. First pet to pass = result, fallback = most common in pool. Buff multipliers stack multiplicatively: Lucky x2, Super x3, Epic x5 (max x30).

**Eggs:** Dynamic filter via `getEggFilterForLevel(level)` — each visual tier (1–17) removes one common pet from the pool. XP curve: base 100, multiplier 1.15x per level. New pet = +25% XP bar, duplicate = +0.5-10% based on grade.

**Coin economy:** Each roll awards coins based on grade. New pets: Common 5, Uncommon 10, Improved 25, Rare 50, Valuable 100, Elite 250, Epic 500, Heroic 1K, Mythic 2.5K, Ancient 5K, Legendary 10K. Duplicates: ~10-20% of new (Common 1 → Legendary 1K). Coins persist in save, displayed via `CoinDisplay` HUD (top-right). Roll overlay shows EXP + coin rewards on one line with icons.

**Level-up overlay:** Two variants triggered on level-up. Config in `LEVELUP_CONFIG`.
- **Egg variant** (`eggChanged === true`): double gold ring with level number, "New Egg Unlocked!" subtitle, old→new egg transition, egg name + odds characteristic, "Tap to close (N)" countdown (5s), tap anywhere or auto-close.
- **Coins variant** (`eggChanged === false`): double ring, "Rewards:" subtitle, two choice cards — FREE (green, `level * 10` coins, auto-accepts after 10s countdown shown in button) and WATCH AD (purple, `level * 10 * 3` coins, +300% badge, rewarded video via PlatformSDK). Coins are **deferred** — not added in `roll()`, but via `GameManager.claimLevelUpCoins(amount)` after player choice. Ad failure falls back to free amount. Overlay depth 500 (above autoroll UI at 105), blocks all clicks behind it. Both variants pause autoroll until dismissed.

**Progression Window:** Opened by clicking TopBar (top-left panel). Shows horizontal scrollable track of level milestones. Each level is either an egg milestone (at `VISUAL_TIERS` thresholds — double ring, egg image, name, odds text) or a coin milestone (`level * 10` coins — single ring, coin icon, amount). Reached levels are yellow/colored, unreached are gray/grayscale. Initial scroll anchors on the last reached level at ~20% from left, showing ~2.5 unearned milestones to the right. Horizon = `max(currentLevel + 5, nextEggLevel + 3)`. Milestone data generated by `data/milestones.ts`. Scene transition follows CollectionScene pattern (stop autoroll, save state, scene.start).

**Daily Quests:** Two repeating quests that reset at UTC midnight. Managed by `QuestSystem` (pure TS), UI in `QuestPanel` + `QuestClaimPopup`. Save version 12.
- Quest 1 (Roll): targets [3, 5, 10], loops at 10. Reward: 1x Lucky (free) / 5x Lucky (ad).
- Quest 2 (Grade): sequence [Uncommon, Improved], loops at Improved. Accepts target grade or higher. Reward: 1x Super (free) / 3x Super (ad).
- Claim flow: progress bar → CLAIM button → popup with two card choices (free green / ad purple) → buff granted.
- Events: `quests-changed` emitted on progress/claim/reset. Daily reset checked on load, each roll, and periodic 60s timer.
