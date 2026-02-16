# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PETS GO Lite — 2D RNG casual/gacha-lite web game built with Phaser 3 + TypeScript + Vite. Target platforms: Poki, CrazyGames, GameDistribution. Monetization: rewarded video ads only.

Core loop: Click egg → hatch → get pet → XP → level up → better luck → repeat. No currency, no pity system, infinite free rolls.

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

**Scene flow:** Boot → Main ↔ Collection

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
├── types/index.ts                  # All interfaces (Pet, Rarity, SaveData, etc.)
│
├── data/
│   ├── pets.ts                     # 30 pets (id, name, emoji, imageKey, rarity)
│   ├── eggs.ts                     # 5 egg tiers
│   ├── backgrounds.ts              # 5 background themes
│   └── locales/
│       ├── en.ts                   # English strings (base)
│       ├── ru.ts                   # Russian strings
│       └── index.ts                # t('key') lookup function
│
├── systems/                        # Pure TS, zero Phaser dependency
│   ├── RNGSystem.ts                # sfc32 PRNG + weightedRandom
│   ├── ProgressionSystem.ts        # XP, levels, luck formula
│   ├── SaveSystem.ts               # localStorage with try/catch
│   ├── AudioSystem.ts              # Play/stop/mute wrapper
│   └── BuffSystem.ts               # Buff timers (x2xp, autoroll, luck)
│
├── scenes/
│   ├── BootScene.ts                # Asset loading
│   ├── MainScene.ts                # Gameplay dashboard (creates UI panels)
│   └── CollectionScene.ts          # Pet grid with filters
│
├── ui/
│   ├── TopBar.ts                   # Level badge + XP bar (top-left, floating)
│   ├── SettingsButton.ts          # Gear icon (top-right)
│   ├── CollectionButton.ts        # Collection count (left side)
│   ├── CenterStage.ts             # 3 pedestal slots + rhombus shadows + dark overlay roll animation
│   ├── RightPanel.ts              # Roll button (bottom-center) + buff buttons (right) with ADS badges
│   ├── PetCard.ts                  # Single pet card with image sprite (for collection grid)
│   └── components/
│       ├── Button.ts               # Reusable button with tween
│       ├── ProgressBar.ts          # Reusable progress bar
│       └── FloatingText.ts         # "+25 XP" floating text
│
└── platform/
    ├── PlatformSDK.ts              # Interface
    ├── PokiAdapter.ts              # Poki SDK implementation
    └── NullAdapter.ts              # No-op for local dev
```

**Code rules:**
- No file exceeds 200 lines — split if it grows
- No `any` — strict TypeScript everywhere
- No inheritance between game objects — composition only
- No hardcoded UI strings — all text goes through `t('key')` from `data/locales/`
- ~25 files, ~1800 lines total, average file ~60-80 lines

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

Rarity weights (sum=100): Common 60, Uncommon 25, Rare 10, Epic 4, Legendary 1. XP curve: base 100, multiplier 1.15x per level. New pet = +25% XP bar, duplicate = +1-10% based on rarity. Luck improves with level (shifts weights from Common toward Rare+).
