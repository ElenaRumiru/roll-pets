# PETS WEB — Technical Design Specification
## RNG Casual Game for HTML5 Web Portals

**Version:** 1.0
**Date:** 2026-02-12
**Author:** Solo Indie Developer
**Target Platforms:** Poki, CrazyGames, GameDistribution (Friv), Y8
**Genre:** RNG / Random Number Generator Casual Game
**Monetization:** Rewarded Video Ads (Ad-Supported)
**Development Timeline:** 8 Weeks

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Architecture](#2-project-architecture)
3. [Best Practices & Performance Optimization](#3-best-practices--performance-optimization)
4. [Poki SDK Integration & Cross-Platform Publishing](#4-poki-sdk-integration--cross-platform-publishing)
5. [Monetization & Ad Strategy](#5-monetization--ad-strategy)
6. [RNG System Architecture](#6-rng-system-architecture)
7. [8-Week Development Roadmap](#7-8-week-development-roadmap)
8. [Testing & Submission Checklist](#8-testing--submission-checklist)
9. [Appendix A: Tool & Library Recommendations](#appendix-a-tool--library-recommendations)
10. [Appendix B: Reference Documentation Links](#appendix-b-reference-documentation-links)

---

## 1. Executive Summary

### Project Overview

PETS WEB is a medium-complexity casual RNG game designed for HTML5 web portals. The game features 2-3 distinct game modes built around random number generation mechanics (gacha pulls, dice rolls, weighted loot tables) with a progression system that drives long-term player engagement. The primary revenue model is rewarded video ads.

### Technical Stack Decision

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Phaser 3 | Full-featured game framework with scene management, input, audio, physics, tweening, and massive community. 38.8k GitHub stars. |
| **Language** | TypeScript | Catches bugs at compile time; 40% faster feature development; first-class Phaser support. |
| **Build Tool** | Vite | 10-100x faster than Webpack; instant HMR; official Phaser template available. |
| **Renderer** | WebGL (Canvas 2D fallback) | GPU-accelerated rendering; Phaser handles fallback automatically. |
| **Asset Pipeline** | TexturePacker + WebP + OGG/MP3 | Minimal HTTP requests, compressed assets, cross-browser audio compatibility. |
| **Deployment** | Static files (portal-hosted) | Each portal hosts the game; no custom server infrastructure needed. |
| **Cross-Platform SDK** | Custom abstraction layer | Thin wrapper over Poki/CrazyGames/GameDistribution SDKs. |

### Key Constraints

- **Initial download:** Under 5 MB (target), 8 MB hard limit (Poki requirement)
- **Aspect ratio:** 16:9 widescreen
- **Device support:** Desktop + mobile + tablet
- **External requests:** None (all portals block external CDN/API calls)
- **Ad blocker tolerance:** Game must be fully playable with ad blockers enabled
- **No external dependencies:** No Google Fonts, analytics, or external CDNs

### Quick Start

```bash
npx degit phaserjs/template-vite-ts pets-web
cd pets-web
npm install
npm run dev
```

---

## 2. Project Architecture

### 2.1 Directory Structure

```
pets-web/
├── public/
│   ├── index.html                  # Entry point (portal-specific template)
│   ├── favicon.ico                 # Game icon
│   └── assets/
│       ├── sprites/
│       │   ├── pets.png            # Main spritesheet (TexturePacker)
│       │   ├── pets.json           # Atlas JSON
│       │   ├── ui.png              # UI elements spritesheet
│       │   ├── ui.json             # UI atlas JSON
│       │   └── particles.png      # Particle effects spritesheet
│       ├── audio/
│       │   ├── sfx/
│       │   │   ├── roll.ogg        # Dice/spin sound
│       │   │   ├── roll.mp3        # MP3 fallback
│       │   │   ├── win-common.ogg
│       │   │   ├── win-rare.ogg
│       │   │   ├── win-epic.ogg
│       │   │   ├── click.ogg
│       │   │   └── *.mp3           # MP3 fallbacks for each
│       │   └── music/
│       │       ├── bgm-menu.ogg
│       │       ├── bgm-gameplay.ogg
│       │       └── *.mp3           # MP3 fallbacks
│       └── fonts/
│           └── game-font.png       # Bitmap font (no external fonts)
├── src/
│   ├── main.ts                     # Entry point: Phaser config + boot
│   ├── config.ts                   # Game constants, balance tables
│   ├── types.ts                    # Shared TypeScript interfaces
│   │
│   ├── scenes/
│   │   ├── BootScene.ts            # Asset preloading + loading bar
│   │   ├── MenuScene.ts            # Main menu + mode selection
│   │   ├── GameScene1.ts           # Game Mode 1 (primary RNG mode)
│   │   ├── GameScene2.ts           # Game Mode 2 (secondary mode)
│   │   ├── GameScene3.ts           # Game Mode 3 (bonus/daily mode)
│   │   ├── ResultScene.ts          # Round results + reward display
│   │   ├── CollectionScene.ts      # Player collection / inventory
│   │   └── SettingsScene.ts        # Sound, language, credits
│   │
│   ├── systems/
│   │   ├── RNGSystem.ts            # Seeded PRNG (sfc32), loot tables
│   │   ├── PitySystem.ts           # Soft pity, hard pity, guarantees
│   │   ├── ProgressionSystem.ts    # XP, levels, unlocks, milestones
│   │   ├── SaveSystem.ts           # localStorage persistence + try/catch
│   │   ├── AudioSystem.ts          # Music/SFX manager with mute support
│   │   └── AdSystem.ts             # Cross-platform ad abstraction
│   │
│   ├── objects/
│   │   ├── Pet.ts                  # Pet entity (sprite, stats, rarity)
│   │   ├── LootCard.ts             # Visual card for pull results
│   │   ├── RewardWheel.ts          # Spinning wheel component
│   │   ├── DiceRoller.ts           # Dice rolling component
│   │   └── ParticlePool.ts         # Object-pooled particle manager
│   │
│   ├── ui/
│   │   ├── Button.ts               # Reusable button component
│   │   ├── ProgressBar.ts          # XP / loading / pity progress bar
│   │   ├── Modal.ts                # Modal dialog (confirm, reward)
│   │   ├── Toast.ts                # Floating notification
│   │   └── PityCounter.ts          # Visual pity counter display
│   │
│   ├── data/
│   │   ├── pets.json               # Pet definitions (name, rarity, stats)
│   │   ├── loot-tables.json        # Weighted probability tables
│   │   ├── progression.json        # XP curves, level rewards, unlocks
│   │   └── locales/
│   │       ├── en.json             # English strings
│   │       └── ru.json             # Russian strings (if needed)
│   │
│   └── platform/
│       ├── PlatformSDK.ts          # Interface for platform abstraction
│       ├── PokiAdapter.ts          # Poki SDK implementation
│       ├── CrazyGamesAdapter.ts    # CrazyGames SDK implementation
│       ├── GameDistAdapter.ts      # GameDistribution SDK implementation
│       └── NullAdapter.ts          # No-op adapter for local dev
│
├── dist/                           # Build output (gitignored)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .eslintrc.json
```

### 2.2 Game Loop Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     PHASER GAME LOOP                         │
│                                                              │
│  ┌─────────┐    ┌──────────┐    ┌────────────────────────┐  │
│  │  UPDATE  │───>│  RENDER  │───>│  INPUT (pointer/key)   │  │
│  │ (60 FPS) │    │ (WebGL)  │    │  (Phaser Input Plugin) │  │
│  └────┬─────┘    └──────────┘    └────────────────────────┘  │
│       │                                                      │
│  ┌────▼─────────────────────────────────────────────────┐    │
│  │              SCENE MANAGER                            │    │
│  │                                                       │    │
│  │  Boot ──> Menu ──> GameScene ──> Result ──> Menu      │    │
│  │                       │            │                   │    │
│  │                       ▼            ▼                   │    │
│  │                  Collection    Settings                │    │
│  └───────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Component-Based Design

```
GAME OBJECTS                 UI LAYER                  SYSTEMS
─────────────               ────────                  ───────
Pet (sprite + stats)        Button                    RNGSystem
LootCard (flip anim)        ProgressBar               PitySystem
RewardWheel (spin)          Modal (confirm/reward)    ProgressionSystem
DiceRoller (roll anim)      Toast (notifications)     SaveSystem
ParticlePool (effects)      PityCounter               AudioSystem
                                                      AdSystem
```

### 2.4 Data Flow Diagram

```
USER INPUT (tap/click)
       │
       ▼
┌──────────────┐
│  GameScene   │──── checks ────> ProgressionSystem (can player afford this action?)
│  (active)    │                         │
└──────┬───────┘                         ▼
       │                          SaveSystem.load()
       ▼
┌──────────────┐
│  RNGSystem   │──── seed ────> sfc32 PRNG
│  .roll()     │                   │
└──────┬───────┘                   ▼
       │                    Weighted Loot Table
       ▼                         │
┌──────────────┐                 ▼
│ PitySystem   │──── modifies probability ────> Final Outcome
│ .check()     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ ResultScene  │──── displays ────> LootCard animation
│              │──── updates ────> ProgressionSystem (XP, collection)
│              │──── saves ─────> SaveSystem (localStorage)
│              │──── signals ───> AdSystem (commercialBreak / rewardedBreak)
└──────────────┘
       │
       ▼
┌──────────────┐
│  AdSystem    │──── calls ────> PlatformSDK (Poki / CrazyGames / etc.)
│              │◄─── callback ── Ad complete → resume game
└──────────────┘
```

### 2.5 Configuration Management

All game balance values live in `src/config.ts` and `src/data/`:

```typescript
// src/config.ts

export const GAME_CONFIG = {
  // --- Screen ---
  WIDTH: 836,
  HEIGHT: 470,
  SCALE_MODE: Phaser.Scale.FIT,
  AUTO_CENTER: Phaser.Scale.CENTER_BOTH,

  // --- RNG Parameters ---
  RARITY_WEIGHTS: {
    common:    60,
    uncommon:  25,
    rare:      10,
    epic:      4,
    legendary: 1,
  },

  // --- Pity System ---
  SOFT_PITY_START: 50,     // pulls before rate starts increasing
  HARD_PITY: 75,           // guaranteed legendary at this pull count
  PITY_RATE_INCREMENT: 0.03, // rate increase per pull past soft pity

  // --- Progression ---
  XP_PER_PULL: 10,
  XP_CURVE_BASE: 100,       // XP needed for level 1
  XP_CURVE_MULTIPLIER: 1.15, // each level requires 15% more XP

  // --- Economy ---
  FREE_PULLS_PER_SESSION: 5,
  REWARDED_AD_PULL_BONUS: 3,
  DAILY_LOGIN_BONUS_COINS: 50,

  // --- Audio ---
  MUSIC_VOLUME: 0.3,
  SFX_VOLUME: 0.7,

  // --- Ads ---
  MIN_GAMEPLAY_BEFORE_FIRST_AD: 120_000, // 2 minutes in ms
} as const;
```

### 2.6 Error Handling & Logging

```typescript
// Production error handler (no external services)
window.addEventListener('error', (event) => {
  const errorLog = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: Date.now(),
  };
  // Store locally for debugging (viewable in browser console)
  try {
    const logs = JSON.parse(localStorage.getItem('error_log') || '[]');
    logs.push(errorLog);
    if (logs.length > 50) logs.shift(); // keep last 50 errors
    localStorage.setItem('error_log', JSON.stringify(logs));
  } catch { /* localStorage unavailable */ }
});

// Game-specific logger
class GameLogger {
  static info(system: string, message: string): void {
    if (import.meta.env.DEV) {
      console.log(`[${system}] ${message}`);
    }
  }
  static warn(system: string, message: string): void {
    console.warn(`[${system}] ${message}`);
  }
}
```

---

## 3. Best Practices & Performance Optimization

### 3.1 Memory Management: Object Pooling

JavaScript's garbage collector causes frame drops when collecting dead objects. Pool frequently created/destroyed objects:

```typescript
// src/objects/ParticlePool.ts
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 20) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    return this.pool.length > 0 ? this.pool.pop()! : this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}
```

**What to pool in this game:**
- Particle effects (win celebrations, sparkles, coin animations)
- Floating text / damage numbers
- Sound effect instances
- Temporary UI elements (toast notifications)

### 3.2 Rendering Optimization

- **Use WebGL as primary renderer** (Phaser default). Canvas 2D is the automatic fallback.
- **Sprite batching:** Combine all sprites into texture atlases. A single 4096x4096 atlas loads 17x faster than thousands of individual images.
- **Minimize draw calls:** Group sprites on the same atlas. Phaser batches automatically when sprites share a texture.
- **Avoid text updates every frame.** Cache rendered text and update only on value change.
- **Use `setVisible(false)` instead of `destroy()`** for objects that will reappear (modal dialogs, tooltips).

### 3.3 Mobile Optimization

**Viewport configuration (index.html):**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0,
  maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

**CSS for fullscreen canvas:**
```css
* { margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; overflow: hidden; }
canvas { display: block; touch-action: none; }
```

**Touch input:**
- Phaser's pointer events handle both mouse and touch automatically
- All interactive elements must be at least 44x44px (Apple HIG minimum)
- Add visual feedback (scale tween) on button press
- Use `touch-action: none` on the canvas to prevent browser gestures

**Performance on mobile:**
- Consider downscaling the canvas on low-end devices and letting CSS upscale
- Detect device capability with `navigator.hardwareConcurrency` or `devicePixelRatio`
- Reduce particle counts on mobile (50% of desktop values)

**Orientation handling:**
- Design for landscape 16:9 as primary
- Show a "please rotate your device" overlay if portrait is detected and the game requires landscape

### 3.4 Load Time Optimization

**Progressive loading pattern:**
1. **Phase 1 (BootScene):** Load only the loading bar sprite and logo (~50 KB)
2. **Phase 2 (BootScene continues):** Load menu assets, core UI spritesheet (~500 KB)
3. **Phase 3 (on demand):** Load game-mode-specific assets when the player selects a mode

**Asset compression targets:**

| Asset Type | Format | Compression Target |
|---|---|---|
| Spritesheets | WebP (PNG fallback) | < 500 KB per atlas |
| Sound effects | OGG (MP3 fallback) | 96 kbps, mono |
| Background music | OGG (MP3 fallback) | 128 kbps, mono |
| Fonts | Bitmap PNG | < 50 KB |
| JSON data | Minified | < 10 KB |
| Total initial load | All combined | **< 5 MB** |

**Server compression:** Poki automatically applies gzip/Brotli to served files.

### 3.5 Browser Compatibility

| Feature | Support | Fallback |
|---|---|---|
| WebGL 1.0 | 97%+ browsers | Canvas 2D (Phaser auto-detects) |
| Web Audio API | 95%+ browsers | HTML5 Audio element |
| localStorage | 97%+ browsers | In-memory store (try/catch wrapper) |
| Fullscreen API | 95%+ browsers | Safari: `webkitRequestFullscreen` |
| Pointer Events | 97%+ browsers | Touch + Mouse fallback (Phaser handles) |

**Audio autoplay policy:** All major browsers block audio until user interaction. Phaser resumes `AudioContext` on first touch automatically. No action needed.

### 3.6 Accessibility

- **Keyboard navigation:** All menus and buttons navigable with Tab + Enter
- **ESC key:** Pauses/resumes gameplay (Poki requirement)
- **Spacebar:** Alternate pause/resume
- **Color contrast:** Rarity colors must be distinguishable. Use both color AND icon/shape to indicate rarity
- **Text size:** Minimum 14px equivalent on mobile; 16px preferred
- **Reduced motion:** Detect `prefers-reduced-motion` media query and disable particle effects

---

## 4. Poki SDK Integration & Cross-Platform Publishing

### 4.1 Poki SDK Initialization

**index.html (Poki build):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0,
    maximum-scale=1.0, user-scalable=no">
  <script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    canvas { display: block; touch-action: none; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**SDK initialization in game code:**
```typescript
// src/platform/PokiAdapter.ts
import { PlatformSDK } from './PlatformSDK';

export class PokiAdapter implements PlatformSDK {
  async init(): Promise<void> {
    try {
      await PokiSDK.init();
      console.log('Poki SDK initialized');
    } catch {
      console.log('Poki SDK init failed; continuing without SDK');
    }
  }

  gameLoadingFinished(): void {
    PokiSDK.gameLoadingFinished();
  }

  gameplayStart(): void {
    PokiSDK.gameplayStart();
  }

  gameplayStop(): void {
    PokiSDK.gameplayStop();
  }

  async showCommercialBreak(): Promise<void> {
    return new Promise((resolve) => {
      PokiSDK.commercialBreak(() => {
        // Mute audio here
      }).then(() => {
        // Resume audio here
        resolve();
      });
    });
  }

  async showRewardedBreak(): Promise<boolean> {
    return new Promise((resolve) => {
      PokiSDK.rewardedBreak(() => {
        // Mute audio here
      }).then((success: boolean) => {
        // Resume audio here
        resolve(success);
      });
    });
  }
}
```

### 4.2 Lifecycle Event Sequence

**Critical rule:** Never fire `gameplayStart()` twice without a `gameplayStop()` in between.

```
GAME STARTUP:
  PokiSDK.init()
  BootScene loads assets
  PokiSDK.gameLoadingFinished()
  MenuScene appears
  Player taps "Play" → PokiSDK.gameplayStart()

DURING GAMEPLAY:
  Player pauses      → PokiSDK.gameplayStop()
  Player unpauses    → PokiSDK.gameplayStart()

ROUND END (death/completion):
  PokiSDK.gameplayStop()
  ResultScene shows score
  Player taps "Play Again" → PokiSDK.commercialBreak() → PokiSDK.gameplayStart()
  Player taps "Watch Ad for Bonus" → PokiSDK.rewardedBreak() → PokiSDK.gameplayStart()

RETURN TO MENU:
  PokiSDK.gameplayStop()
  MenuScene appears
```

### 4.3 Cross-Platform Abstraction

```typescript
// src/platform/PlatformSDK.ts
export interface PlatformSDK {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  showCommercialBreak(): Promise<void>;
  showRewardedBreak(): Promise<boolean>;
}
```

```typescript
// src/platform/CrazyGamesAdapter.ts
export class CrazyGamesAdapter implements PlatformSDK {
  async showCommercialBreak(): Promise<void> {
    return new Promise((resolve) => {
      window.CrazyGames.SDK.ad.requestAd('midgame', {
        adFinished: () => resolve(),
        adError: () => resolve(),
        adStarted: () => { /* mute audio */ },
      });
    });
  }

  async showRewardedBreak(): Promise<boolean> {
    return new Promise((resolve) => {
      window.CrazyGames.SDK.ad.requestAd('rewarded', {
        adFinished: () => resolve(true),
        adError: () => resolve(false),
        adStarted: () => { /* mute audio */ },
      });
    });
  }
  // ... other lifecycle methods
}
```

```typescript
// src/platform/NullAdapter.ts (for local development)
export class NullAdapter implements PlatformSDK {
  async init(): Promise<void> { /* no-op */ }
  gameLoadingFinished(): void { /* no-op */ }
  gameplayStart(): void { console.log('[DEV] gameplayStart'); }
  gameplayStop(): void { console.log('[DEV] gameplayStop'); }
  async showCommercialBreak(): Promise<void> { console.log('[DEV] commercialBreak'); }
  async showRewardedBreak(): Promise<boolean> { console.log('[DEV] rewardedBreak'); return true; }
}
```

**Platform detection:**
```typescript
// src/main.ts
function detectPlatform(): PlatformSDK {
  if (typeof PokiSDK !== 'undefined') return new PokiAdapter();
  if (typeof CrazyGames !== 'undefined') return new CrazyGamesAdapter();
  if (typeof gdsdk !== 'undefined') return new GameDistAdapter();
  return new NullAdapter();
}
```

### 4.4 Player Data Persistence

```typescript
// src/systems/SaveSystem.ts
export interface SaveData {
  version: number;
  collection: string[];       // IDs of collected pets
  currency: number;
  xp: number;
  level: number;
  pityCounter: number;
  totalPulls: number;
  dailyLoginStreak: number;
  lastLoginDate: string;
  settings: {
    musicVolume: number;
    sfxVolume: number;
    language: string;
  };
}

const SAVE_KEY = 'pets_web_save';
const CURRENT_VERSION = 1;

export class SaveSystem {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SaveData;
        return this.migrate(parsed);
      }
    } catch {
      // localStorage unavailable (incognito, cookie blocker)
    }
    return this.getDefaults();
  }

  save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // Silently fail -- game remains playable
    }
  }

  private migrate(data: SaveData): SaveData {
    // Handle save file version upgrades
    if (data.version < CURRENT_VERSION) {
      // Apply migrations here
      data.version = CURRENT_VERSION;
    }
    return data;
  }

  private getDefaults(): SaveData {
    return {
      version: CURRENT_VERSION,
      collection: [],
      currency: 100,
      xp: 0,
      level: 1,
      pityCounter: 0,
      totalPulls: 0,
      dailyLoginStreak: 0,
      lastLoginDate: '',
      settings: {
        musicVolume: 0.3,
        sfxVolume: 0.7,
        language: 'en',
      },
    };
  }

  getData(): SaveData { return this.data; }
}
```

### 4.5 Porting Checklist: Step-by-Step

**For each portal, create a separate build configuration:**

| Step | Poki | CrazyGames | GameDistribution | Y8 |
|---|---|---|---|---|
| 1. SDK script | `poki-sdk.js` in `<head>` | `crazygames-sdk.js` via npm | `gd.js` via CDN | Y8 SDK script |
| 2. Lifecycle events | 5 events required | `gameplayStart/Stop` | Pre-roll + mid-roll | Basic callbacks |
| 3. Ad integration | `commercialBreak` + `rewardedBreak` | `requestAd('midgame'/'rewarded')` | `gdsdk.showAd()` | Y8 ad SDK |
| 4. Remove splash screens | Yes | Yes (Full Launch) | N/A | N/A |
| 5. Branding | Studio logo on loading only | Studio logo on loading only | N/A | N/A |
| 6. Max initial size | 5-8 MB | 20-50 MB | No hard limit | No hard limit |
| 7. External requests | All blocked | Blocked without exception | Blocked by default | N/A |
| 8. Submission | developers.poki.com | developer.crazygames.com | gamedistribution.com | y8.com/upload |
| 9. Exclusivity | Effectively yes | Optional (+50% for 2mo) | No | No |
| 10. Revenue share | 50/50 (100% direct) | Undisclosed | 33% | 50% + bonuses |

### 4.6 Build Output: Deployment Folder

```
dist/
├── index.html            # Entry point (platform-specific)
├── assets/
│   ├── sprites/
│   │   ├── pets.webp
│   │   ├── pets.json
│   │   ├── ui.webp
│   │   └── ui.json
│   ├── audio/
│   │   ├── sfx/*.ogg
│   │   └── music/*.ogg
│   └── fonts/
│       └── game-font.png
└── js/
    └── game.[hash].js    # Minified, tree-shaken bundle
```

**Build command:**
```bash
npm run build         # Produces dist/ folder
# Then zip dist/ and upload to the portal's developer dashboard
```

---

## 5. Monetization & Ad Strategy

### 5.1 Ad Network Selection

For portal-hosted games, the portal handles ad serving. Use each portal's native SDK.

For self-hosted versions:

| Network | Best For | Integration |
|---|---|---|
| **AdinPlay** (Venatus) | HTML5 game specialists | JS SDK, header bidding |
| **Applixir** | Rewarded video specifically | Single-line JS integration |
| **GameMonetizer (optAd360)** | Google AdX access | Plug-and-play, auto MCM enrollment |
| **Google Ad Manager** | 100K+ DAU, ad ops expertise | IMA SDK, maximum control |

**Recommendation:** Focus on portal SDKs first. Only consider direct ad networks if self-hosting.

### 5.2 Rewarded Video Placement: 5 Optimal Moments

```
MOMENT 1: "Extra Pull" after depleting free pulls
┌──────────────────────────────────────┐
│  You've used all 5 free pulls!       │
│                                      │
│  ┌────────────────┐ ┌──────────────┐ │
│  │  🟢 Continue   │ │ 🎬 Watch Ad  │ │
│  │  (wait 1hr)    │ │ +3 Pulls     │ │
│  └────────────────┘ └──────────────┘ │
└──────────────────────────────────────┘

MOMENT 2: "Double Rewards" after a successful pull
┌──────────────────────────────────────┐
│  You found a Rare Pet!               │
│  +50 XP  +25 Coins                   │
│                                      │
│  ┌────────────────┐ ┌──────────────┐ │
│  │  🟢 Collect    │ │ 🎬 Watch Ad  │ │
│  │               │ │ Double XP!   │ │
│  └────────────────┘ └──────────────┘ │
└──────────────────────────────────────┘

MOMENT 3: "Revive / Retry" after a failed mini-game round
┌──────────────────────────────────────┐
│  Game Over! Score: 1,250             │
│                                      │
│  ┌────────────────┐ ┌──────────────┐ │
│  │  🟢 Main Menu  │ │ 🎬 Watch Ad  │ │
│  │               │ │ Continue!    │ │
│  └────────────────┘ └──────────────┘ │
└──────────────────────────────────────┘

MOMENT 4: "Daily Bonus Multiplier" on daily login
┌──────────────────────────────────────┐
│  Welcome back! Day 3 streak!         │
│  Bonus: 50 Coins                     │
│                                      │
│  ┌────────────────┐ ┌──────────────┐ │
│  │  🟢 Claim      │ │ 🎬 Watch Ad  │ │
│  │  50 Coins      │ │ 150 Coins!   │ │
│  └────────────────┘ └──────────────┘ │
└──────────────────────────────────────┘

MOMENT 5: "Peek at Odds" before pulling (optional)
┌──────────────────────────────────────┐
│  Your next pull rates:               │
│  Legendary: 1.3% (pity: 42/75)      │
│                                      │
│  ┌────────────────┐ ┌──────────────┐ │
│  │  🟢 Pull Now   │ │ 🎬 Watch Ad  │ │
│  │               │ │ +5% Luck!    │ │
│  └────────────────┘ └──────────────┘ │
└──────────────────────────────────────┘
```

**Poki UI rules for rewarded buttons (mandatory):**
- Standard (non-ad) button must be **green**
- Standard button must be **equal to or larger** than the ad button
- Ad button must NOT be green; must include a video/film icon
- Both buttons appear simultaneously
- Auto-equip rewards when possible

### 5.3 Ad Load Strategy

| Parameter | Value |
|---|---|
| Minimum gameplay before first ad | 2 minutes |
| Interstitial cooldown | Managed by portal SDK (signal all opportunities) |
| Rewarded video opportunities per session | 3-5 |
| New player protection | No ads in first session (first 5 minutes minimum) |
| Behavior with ad blockers | Game fully playable; reward buttons hidden |

**Implementation principle:** Signal as many `commercialBreak()` opportunities as possible. Poki's and CrazyGames' systems intelligently manage frequency. Never implement your own ad timer.

### 5.4 Revenue Projections

**Assumptions:** Ads-only model, well-optimized placement, Poki as primary platform.

| DAU | eCPM (blended) | Ads/DAU | Est. Monthly Revenue |
|---|---|---|---|
| 1,000 | $12 | 1.5 | $500-$800 |
| 10,000 | $12 | 1.5 | $5,000-$8,000 |
| 50,000 | $15 | 2.0 | $30,000-$50,000 |
| 100,000 | $15 | 2.0 | $60,000-$100,000 |

**Notes:**
- Poki takes 50% of revenue from Poki-sourced traffic; 0% from direct traffic
- Top Poki developers earn $50K-$1M+ annually
- CrazyGames offers +50% revenue share for 2-month exclusivity
- GameDistribution pays 33% of net revenue

### 5.5 A/B Testing Framework

**What to test (in priority order):**
1. New user ad delay: no ads for 2 min vs 5 min vs entire first session
2. Rewarded video reward amounts: 2x vs 3x multiplier
3. Interstitial placement: after every round vs every other round
4. Rewarded ad button design: icon variations, positioning

**How to test:**
```typescript
// Simple hash-based A/B assignment (no external services needed)
function getABGroup(userId: string, testName: string): 'A' | 'B' {
  let hash = 0;
  const key = userId + testName;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 2 === 0) ? 'A' : 'B';
}
```

**Metrics to track (localStorage-based):**
- Session count and average session duration per group
- Rewarded ad completion rate per group
- Day-1, Day-7 return rate per group (compare `lastLoginDate` patterns)

---

## 6. RNG System Architecture

### 6.1 PRNG Algorithm: sfc32

**Why sfc32:** Passes PractRand (the most rigorous statistical test suite), 128-bit state, ~7.5M ops/sec, compact implementation.

```typescript
// src/systems/RNGSystem.ts

/** SplitMix32 - used to expand a single seed into multiple state values */
function splitmix32(a: number): () => number {
  return () => {
    a |= 0;
    a = a + 0x9e3779b9 | 0;
    let t = a ^ a >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  };
}

/** sfc32 - Simple Fast Counter, 128-bit state PRNG */
function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}

export class RNGSystem {
  private rng: () => number;
  private seed: number;
  private callCount: number = 0;

  constructor(seed?: number) {
    this.seed = seed ?? (Date.now() ^ (Math.random() * 0x100000000));
    const s = splitmix32(this.seed);
    this.rng = sfc32(
      s() * 2 ** 32,
      s() * 2 ** 32,
      s() * 2 ** 32,
      s() * 2 ** 32,
    );
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.callCount++;
    return this.rng();
  }

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Weighted random selection from an array of { value, weight } items */
  weightedRandom<T>(items: { value: T; weight: number }[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = this.next() * totalWeight;

    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) return item.value;
    }
    return items[items.length - 1].value;
  }

  /** Fisher-Yates shuffle with seeded RNG */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /** Snapshot state for save/load */
  getState(): { seed: number; callCount: number } {
    return { seed: this.seed, callCount: this.callCount };
  }

  /** Restore RNG state by replaying from seed */
  static fromState(state: { seed: number; callCount: number }): RNGSystem {
    const rng = new RNGSystem(state.seed);
    for (let i = 0; i < state.callCount; i++) rng.next();
    return rng;
  }
}
```

### 6.2 Weighted Probability Tables

```typescript
// src/data/loot-tables.json
{
  "standard_pull": [
    { "value": "common",    "weight": 60 },
    { "value": "uncommon",  "weight": 25 },
    { "value": "rare",      "weight": 10 },
    { "value": "epic",      "weight": 4 },
    { "value": "legendary", "weight": 1 }
  ],
  "bonus_pull": [
    { "value": "uncommon",  "weight": 40 },
    { "value": "rare",      "weight": 35 },
    { "value": "epic",      "weight": 20 },
    { "value": "legendary", "weight": 5 }
  ]
}
```

**Rarity distribution visualization:**

```
Standard Pull Distribution:
common     ████████████████████████████████████████████████████████████  60%
uncommon   █████████████████████████                                     25%
rare       ██████████                                                    10%
epic       ████                                                           4%
legendary  █                                                              1%
```

### 6.3 Pity System

```typescript
// src/systems/PitySystem.ts
import { GAME_CONFIG } from '../config';

export type PityResult = {
  rarity: string;
  wasGuaranteed: boolean;
  pullsSinceLast: number;
  currentPityCount: number;
};

export class PitySystem {
  private counter: number = 0;

  constructor(initialCounter: number = 0) {
    this.counter = initialCounter;
  }

  getCurrentRate(): number {
    const { SOFT_PITY_START, HARD_PITY, PITY_RATE_INCREMENT } = GAME_CONFIG;
    const baseRate = GAME_CONFIG.RARITY_WEIGHTS.legendary /
      Object.values(GAME_CONFIG.RARITY_WEIGHTS).reduce((a, b) => a + b, 0);

    if (this.counter < SOFT_PITY_START) return baseRate;
    if (this.counter >= HARD_PITY - 1) return 1.0; // guaranteed

    const pullsPastSoft = this.counter - SOFT_PITY_START;
    return Math.min(1.0, baseRate + pullsPastSoft * PITY_RATE_INCREMENT);
  }

  pull(rng: RNGSystem, lootTable: { value: string; weight: number }[]): PityResult {
    this.counter++;
    const currentRate = this.getCurrentRate();

    // Check for legendary via pity
    if (rng.next() < currentRate) {
      const pullsSince = this.counter;
      this.counter = 0;
      return {
        rarity: 'legendary',
        wasGuaranteed: currentRate >= 1.0,
        pullsSinceLast: pullsSince,
        currentPityCount: 0,
      };
    }

    // Normal weighted roll (excluding legendary since pity handles it)
    const nonLegendary = lootTable.filter(i => i.value !== 'legendary');
    const rarity = rng.weightedRandom(nonLegendary);

    return {
      rarity,
      wasGuaranteed: false,
      pullsSinceLast: 0,
      currentPityCount: this.counter,
    };
  }

  getCounter(): number { return this.counter; }

  /** Display info for UI */
  getDisplayInfo() {
    return {
      currentRate: (this.getCurrentRate() * 100).toFixed(2) + '%',
      pullsSinceLast: this.counter,
      pullsToGuarantee: GAME_CONFIG.HARD_PITY - this.counter,
      softPityActive: this.counter >= GAME_CONFIG.SOFT_PITY_START,
    };
  }
}
```

**Pity rate curve visualization:**

```
Legendary Drop Rate vs Pull Count:

Rate%
100 |                                                    ████
 80 |                                                ████
 60 |                                            ████
 40 |                                        ████
 20 |                                    ████
  5 |                                ████
  1 |████████████████████████████████
    └─────────────────────────────────────────────────────────
     0    10    20    30    40    50    60    70    75
                    Pull Count
     |<── base rate ──>|<── soft pity ──>|<── hard ──>|
```

### 6.4 Fairness Verification

**For a client-side casual game (no real money involved), server-side RNG is not required.** However, implement these safeguards:

1. **Log the seed at session start** (stored in localStorage for debugging)
2. **Display exact drop rates** in the collection/info screen
3. **Show pity progress** prominently in the UI
4. **Provide pull history** (last 50 pulls stored and viewable)

```typescript
// Pull history for transparency
interface PullRecord {
  timestamp: number;
  rarity: string;
  petId: string;
  pullNumber: number;
  pityAtTime: number;
}

// Store last 50 pulls
const pullHistory: PullRecord[] = [];
function recordPull(record: PullRecord): void {
  pullHistory.push(record);
  if (pullHistory.length > 50) pullHistory.shift();
  saveSystem.save(); // persist with save data
}
```

### 6.5 Balance Tuning Parameters

All tunable parameters in one place for rapid iteration:

```typescript
// src/config.ts — balance section
export const BALANCE = {
  // --- Pull Economy ---
  FREE_PULLS_PER_SESSION: 5,
  FREE_PULL_REFRESH_MS: 3_600_000,  // 1 hour
  REWARDED_AD_BONUS_PULLS: 3,

  // --- Rarity Weights (sum = 100) ---
  WEIGHTS: {
    common: 60,
    uncommon: 25,
    rare: 10,
    epic: 4,
    legendary: 1,
  },

  // --- Pity ---
  SOFT_PITY_START: 50,
  HARD_PITY: 75,
  PITY_INCREMENT: 0.03,

  // --- Progression ---
  XP_PER_PULL: 10,
  XP_PER_NEW_PET: 50,
  XP_PER_DUPLICATE: 5,
  LEVEL_XP_BASE: 100,
  LEVEL_XP_GROWTH: 1.15,   // +15% per level

  // --- Collection ---
  TOTAL_PETS: 100,
  PETS_PER_RARITY: {
    common: 40,
    uncommon: 30,
    rare: 15,
    epic: 10,
    legendary: 5,
  },

  // --- Daily Login ---
  DAILY_COINS: [50, 75, 100, 150, 200, 300, 500], // 7-day cycle
} as const;
```

---

## 7. 8-Week Development Roadmap

### Week 1-2: Foundation

**Goals:** Project setup, architecture, Poki SDK skeleton, core RNG system.

| Task | Details |
|---|---|
| Project scaffold | `npx degit phaserjs/template-vite-ts pets-web` |
| Directory structure | Create all folders per Section 2.1 |
| TypeScript config | Strict mode, path aliases, ES2020 target |
| Platform abstraction | `PlatformSDK` interface + `PokiAdapter` + `NullAdapter` |
| RNGSystem | sfc32 implementation + weighted random + shuffle |
| PitySystem | Soft pity + hard pity + display info |
| SaveSystem | localStorage with try/catch + versioned schema |
| BootScene | Progressive loading bar + asset preloading |
| MenuScene | Mode selection buttons, settings button |
| Basic Phaser config | 836x470, Scale.FIT, WebGL + Canvas fallback |
| Pet data schema | Define `pets.json` with 20 placeholder pets (4 per rarity) |
| Asset pipeline | Set up TexturePacker project, placeholder sprites |

**Deliverable:** Runnable game that loads, shows a menu, and navigates between placeholder scenes.

### Week 3-4: Core Game Mode 1

**Goals:** Primary RNG mechanic fully playable, progression working.

| Task | Details |
|---|---|
| Game Mode 1 scene | Core pull/gacha mechanic with animation |
| Pull animation | Card flip / egg hatch / chest open animation |
| Rarity visual effects | Color-coded borders, particle bursts per rarity |
| ResultScene | Show pulled pet, rarity, XP gained |
| ProgressionSystem | XP accumulation, level-up, unlock rewards |
| CollectionScene | Grid view of all collected pets, rarity filter |
| PityCounter UI | Visual progress toward guaranteed legendary |
| Rate display | Info button showing exact drop percentages |
| Pull history | Scrollable list of last 50 pulls |
| Sound effects | Roll/spin, reveal (per rarity), click, level-up |
| Background music | Menu + gameplay tracks |

**Deliverable:** Complete Game Mode 1 with progression and collection.

### Week 5-6: Game Mode 2, Ads, Polish

**Goals:** Second game mode, ad integration, visual polish.

| Task | Details |
|---|---|
| Game Mode 2 scene | Dice rolling / wheel spinning / mini-game variant |
| Game Mode 3 (if time) | Daily bonus / special event mode |
| AdSystem integration | `commercialBreak` between rounds, `rewardedBreak` for bonuses |
| Rewarded ad UI | All 5 placement moments from Section 5.2 |
| Daily login system | Streak tracking, bonus rewards, reward multiplier ad |
| Duplicate handling | Duplicates convert to currency or upgrade materials |
| Visual polish | Tweens, easing, screen transitions, juice effects |
| Particle effects | Win celebrations, level-up confetti, rarity sparkles |
| Mobile testing | Touch targets, viewport, orientation |
| Performance pass | Chrome DevTools profiling, asset size audit |

**Deliverable:** Two playable game modes with ads integrated.

### Week 7: Polish, Balance, Mobile

**Goals:** Balance tuning, cross-device testing, bug fixes.

| Task | Details |
|---|---|
| Balance pass | Playtest and tune all values in `config.ts` |
| Pity system tuning | Verify pity curve feels fair via extended playtesting |
| Economy audit | Ensure free-to-play loop is sustainable (not too generous/stingy) |
| Mobile testing | iOS Safari, Chrome Android, Samsung Internet |
| Tablet testing | iPad, Android tablets |
| Desktop testing | Chrome, Firefox, Safari, Edge |
| Bug fixing | Address all issues found during testing |
| Localization (if needed) | Extract strings, add locale files |
| Settings scene | Volume sliders, language selector, credits |
| Asset final pass | Replace all placeholder art with final sprites |

**Deliverable:** Polished, balanced game ready for submission.

### Week 8: Submission Preparation

**Goals:** Poki compliance, build optimization, submission.

| Task | Details |
|---|---|
| Poki Inspector testing | Upload to inspector.poki.dev, fix all warnings |
| SDK event audit | Verify no consecutive duplicates, correct event ordering |
| File size audit | Ensure initial download < 5 MB |
| Remove dev artifacts | Strip console.logs, debug code, test seeds |
| External request audit | Verify zero external requests |
| Build optimization | Minification, tree-shaking, asset compression |
| Generate thumbnails | Static + animated thumbnails for Poki |
| Poki submission | Submit via developers.poki.com |
| CrazyGames build | Create CrazyGames adapter build, submit |
| GameDistribution build | Create GD adapter build, submit |
| Documentation | Internal notes for future maintenance |

**Deliverable:** Game submitted to Poki (and optionally CrazyGames/GameDistribution).

---

## 8. Testing & Submission Checklist

### 8.1 Performance Profiling (Chrome DevTools)

- [ ] **Lighthouse score:** Performance > 80 on mobile
- [ ] **First Contentful Paint:** < 2 seconds
- [ ] **Total bundle size:** < 5 MB (compressed)
- [ ] **JavaScript parse time:** < 500ms
- [ ] **60 FPS maintained** during animations (Performance tab → Frame rendering)
- [ ] **No memory leaks:** Heap snapshot stable after 10 rounds of gameplay
- [ ] **No GC-induced frame drops** during particle effects (use object pooling)

### 8.2 Cross-Device Testing Matrix

| Device | Browser | Test Focus |
|---|---|---|
| iPhone (recent) | Safari | Touch, viewport, audio autoplay |
| iPhone (older, e.g. SE) | Safari | Performance on low-end |
| Android phone | Chrome | Touch, viewport, back button |
| Android phone | Samsung Internet | Rendering, input |
| iPad | Safari | Tablet layout, touch targets |
| Android tablet | Chrome | Tablet layout |
| Windows desktop | Chrome | Mouse input, keyboard (ESC/Space) |
| Windows desktop | Firefox | Rendering, audio |
| Mac desktop | Safari | WebGL, audio |
| Mac desktop | Chrome | Baseline reference |

### 8.3 Poki Submission Checklist

**SDK Integration:**
- [ ] `PokiSDK.init()` called at startup (with `.catch()` fallback)
- [ ] `gameLoadingFinished()` fires after assets load
- [ ] `gameplayStart()` fires on first player input (not on load)
- [ ] `gameplayStop()` fires on pause, death, menu return
- [ ] No consecutive duplicate events (start-start or stop-stop)
- [ ] `commercialBreak()` called at natural break points
- [ ] `rewardedBreak()` called with proper reward delivery on success

**Technical:**
- [ ] Initial download < 8 MB (target < 5 MB)
- [ ] 16:9 aspect ratio, fills entire screen
- [ ] Works on desktop, mobile, and tablet
- [ ] No external requests (fonts, CDNs, analytics)
- [ ] localStorage wrapped in try/catch
- [ ] Playable with ad blockers enabled
- [ ] ESC key pauses/resumes
- [ ] Audio mutes during ad playback
- [ ] No browser default behaviors interfere with gameplay

**Content:**
- [ ] No splash screens or outgoing links
- [ ] Studio logo only on loading screen
- [ ] No in-game currency purchasing UI
- [ ] All cutscenes/intros skippable
- [ ] Intuitive visual tutorials (minimal text)
- [ ] Context-appropriate controls (touch on mobile, keyboard on desktop)
- [ ] Progress saving implemented

**Assets:**
- [ ] Static thumbnail provided
- [ ] Animated thumbnail provided

**Rewarded Ad UI:**
- [ ] Standard continue button is green
- [ ] Standard button is >= ad button size
- [ ] Ad button has video/film icon
- [ ] Both buttons appear simultaneously
- [ ] Visual confirmation when rewards granted
- [ ] No custom ad-blocker messages

### 8.4 Monetization Testing

- [ ] `commercialBreak()` fires correctly (test in Poki Inspector)
- [ ] `rewardedBreak()` fires correctly, reward delivered on success only
- [ ] Audio mutes during all ad types
- [ ] Game pauses during all ad types
- [ ] Game resumes correctly after all ad types
- [ ] Ad failures handled gracefully (game continues)
- [ ] At least 1 ad impression per simulated session
- [ ] No ads during first 2 minutes of gameplay
- [ ] Rewarded buttons hidden when ads unavailable

### 8.5 RNG Verification

- [ ] Fixed-seed test produces identical sequences across runs
- [ ] Weighted distribution matches expected percentages (run 10,000 pulls, verify %)
- [ ] Pity counter increments correctly
- [ ] Soft pity rate increase is correct per pull
- [ ] Hard pity guarantee fires at exact threshold
- [ ] Pity counter resets to 0 after legendary pull
- [ ] Pull history records accurately
- [ ] Displayed rates match actual rates

### 8.6 Save System Verification

- [ ] Progress persists across browser sessions
- [ ] Game works in incognito mode (no localStorage)
- [ ] Save data migrates correctly between versions
- [ ] Corrupted save data handled gracefully (reset to defaults)
- [ ] All player data included in save (collection, currency, XP, pity, settings)

---

## Appendix A: Tool & Library Recommendations

### Core Dependencies

```json
{
  "dependencies": {
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
```

**That's it.** Phaser includes everything needed for a casual game. No additional runtime dependencies.

### Development Tools

| Tool | Purpose | Install |
|---|---|---|
| **TexturePacker** | Spritesheet atlas creation | texturepacker.com (free tier available) |
| **Audacity** | Audio editing (trim, compress, convert) | audacityteam.org (free) |
| **Aseprite** | Pixel art sprite creation | aseprite.org ($19.99) |
| **Tiled** | Tile map editor (if needed) | mapeditor.org (free) |
| **TinyPNG** | PNG/WebP compression | tinypng.com (free tier) |
| **Poki Inspector** | SDK event validation | inspector.poki.dev (free) |

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',                    // Relative paths for portal hosting
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,        // Never inline assets (keep them as files)
    rollupOptions: {
      output: {
        manualChunks: undefined,  // Single bundle for portal compatibility
      },
    },
  },
  server: {
    port: 8080,
    open: true,
  },
});
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### ESLint Configuration

```json
// .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

---

## Appendix B: Reference Documentation Links

### Core Technologies

- **Phaser 3 Documentation:** https://docs.phaser.io/
- **Phaser 3 API Reference:** https://docs.phaser.io/api-documentation/
- **Phaser + Vite + TypeScript Template:** https://github.com/phaserjs/template-vite-ts
- **Vite Documentation:** https://vite.dev/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/

### Poki Platform

- **Poki SDK (HTML5):** https://sdk.poki.com/html5.html
- **Poki SDK Lifecycle Events:** https://sdk.poki.com/sdk-documentation.html
- **Poki Requirements (New):** https://sdk.poki.com/new-requirements.html
- **Poki Requirements (Original):** https://sdk.poki.com/requirements.html
- **Poki Release Process:** https://sdk.poki.com/releaseprocess.html
- **Poki Inspector:** https://sdk.poki.com/poki-inspector.html
- **Poki AUDS API:** https://sdk.poki.com/auds.html
- **Poki for Developers:** https://developers.poki.com/
- **Poki PixiJS Template:** https://github.com/erikdubbelboer/poki-pixijs-template

### Other Portals

- **CrazyGames SDK:** https://docs.crazygames.com/sdk/video-ads/
- **CrazyGames Requirements:** https://docs.crazygames.com/requirements/intro/
- **CrazyGames Technical Requirements:** https://docs.crazygames.com/requirements/technical/
- **GameDistribution Developers:** https://gamedistribution.com/developers/
- **Y8 Upload:** https://www.y8.com/upload

### RNG & Game Design

- **JavaScript PRNGs (bryc/code):** https://github.com/bryc/code/blob/master/jshash/PRNGs.md
- **Game Programming Patterns - Object Pool:** https://gameprogrammingpatterns.com/object-pool.html
- **Loot Drop Best Practices (Gamedeveloper):** https://www.gamedeveloper.com/design/loot-drop-best-practices

### Performance & Optimization

- **Web.dev - Static Memory with Object Pools:** https://web.dev/articles/speed-static-mem-pools
- **TexturePacker (spritesheet tool):** https://www.codeandweb.com/texturepacker
- **WebGL Browser Support:** https://caniuse.com/webgl

### Monetization

- **Applixir - Monetizing HTML5 Games:** https://www.applixir.com/blog/a-guide-to-monetizing-html5-games-with-rewarded-video-ads/
- **GamePush (Cross-Platform SDK):** https://gamepush.com/overview/
- **Web Game Dev - Portals:** https://www.webgamedev.com/publishing/portals

---

*End of Technical Design Specification*
