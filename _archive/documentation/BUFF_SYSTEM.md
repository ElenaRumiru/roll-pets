# Buff System

## Overview

The buff system provides temporary luck multipliers and auto-roll functionality. All buffs are activated via the **Bonus Panel** (right side of the screen). Lucky, Super, and Auto Roll require watching a rewarded ad; Epic Roll is free on a cooldown timer.

## Buff Types

### Lucky Roll (green, `0x27ae60`)
- **Effect:** x2 luck multiplier for the next roll
- **Activation:** Watch ad -> receive 1 charge
- **Stacking:** Multiple charges stack (consumed one per roll)
- **Card behavior:** Always visible. After GET, card slides out to the right for 5s (ad time), then slides back in.
- **Badge:** "Lucky x{n}" above Roll button

### Super Roll (blue, `0x3498db`)
- **Effect:** x3 luck multiplier for the next roll
- **Activation:** Watch ad -> receive 1 charge
- **Stacking:** Multiple charges stack (consumed one per roll)
- **Card behavior:** Hidden by default. Appears as a temporary offer:
  - 15s cooldown after page load (or after previous claim/expiry)
  - Slides in from the right with Back.easeOut animation
  - Visible for 15s with a countdown timer badge at the top of the card (pulses each second)
  - If not claimed, slides back out and cooldown restarts
  - If claimed, slides out and cooldown restarts
- **Badge:** "Super x{n}" above Roll button

### Epic Roll (gold, `0xffc107`)
- **Effect:** x5 luck multiplier for the next roll
- **Activation:** Free, on a 30s cooldown timer
- **Stacking:** Up to 10 charges (consumed one per roll)
- **Card behavior:** Always visible, first in the panel. Two states:
  - **Cooldown:** Card shrinks (scale 0.93) toward bottom-right, no glow, progress bar fills over 30s with countdown text ("25s", "24s"...), non-interactive
  - **Ready:** Card grows to full size (Back.easeOut), gold glow pulses, GET button appears, interactive
- **Badge:** "Epic x{n}" above Roll button

### Auto Roll (orange, `0xff9d43`)
- **Effect:** Automatic rolling every 500ms for the banked duration
- **Activation:** Watch ad -> bank 30s of auto-roll time
- **Banking:** Time accumulates. GET adds 30s to the bank without starting auto-roll.
- **Starting:** Player presses the Roll button (which shows "AUTO ROLL" when time is banked)
- **Stopping:** Player presses the Roll button (which shows "STOP" during auto-roll)
- **Card behavior:** Always visible. After GET, card slides out to the right for 5s (ad time), then slides back in.
- **Badge:** "Auto {n}s" above Roll button (shows remaining time)

### Samsara / Rebirth (purple, `0xd063f0`)
- **Effect:** Permanent luck multiplier (`1 + rebirthCount`), applied to every roll and nest hatch
- **Activation:** Automatic at level 1000 (prestige reset). Max 8 rebirths (x9 cap).
- **Stacking:** Permanent, not consumed. Multiplies with all other buffs.
- **Badge:** "Samsara ∞" purple badge. Long-press tooltip shows current multiplier (e.g., "×2").
- **What resets:** Level → 1, XP → 0, autoroll disabled.
- **What persists:** Collection, coins, egg inventory, nests, quests, shop, buffs, daily bonus.

## Multiplier Stacking

All active count buffs are consumed together on each roll. The Samsara (rebirth) multiplier is permanent and always active. Combined formula: `rebirth × lucky × super × epic`.

| Scenario | Multiplier |
|----------|-----------|
| No buffs, no rebirth | x1 |
| All buffs, no rebirth | x30 (2 × 3 × 5) |
| 1st rebirth, no buffs | x2 |
| 1st rebirth + all buffs | x60 (2 × 2 × 3 × 5) |
| 8th rebirth (max), no buffs | x9 |
| 8th rebirth + all buffs | x270 (9 × 2 × 3 × 5) |

One charge of each count buff (Lucky, Super, Epic) is consumed per roll. Samsara is never consumed.

## Bonus Panel Layout

Cards are arranged in a vertical stack on the right side of the screen. Order priority:
1. Epic Roll (always first)
2. Lucky Roll
3. Auto Roll
4. Super Roll (appears/disappears dynamically)

When a card slides out (claimed or hidden), remaining cards shift up to fill the gap with a smooth tween animation (200ms, Sine.easeInOut).

## Glow Animations

Each card has a colored glow that pulses (alpha 0.15 -> 1.0):
- Epic: 600ms cycle, wider spread (8px/4px), higher alpha (0.25/0.40) -- only when ready
- Others: 700ms cycle, standard spread (6px/3px), standard alpha (0.15/0.30)

## Badge Display

Active buffs are shown as small colored badges above the Roll button:
- Width: 68px, height: 20px, corner radius: 5px
- Auto-layout: centered horizontally, spaced 4px apart
- Long-press (300ms) shows a tooltip above the badge

## Config Reference (`BUFF_CONFIG`)

| Buff     | Multiplier | Duration/Timer | Color   |
|----------|-----------|----------------|---------|
| Samsara  | x(1+N)    | Permanent      | #d063f0 |
| Lucky    | x2        | 1 charge/ad    | #27ae60 |
| Super    | x3        | 15s offer/15s cooldown | #3498db |
| Epic     | x5        | 30s cooldown   | #ffc107 |
| Auto Roll| -         | 30s per ad     | #ff9d43 |

## Key Files

- `src/systems/BuffSystem.ts` -- Pure logic, no Phaser dependency (includes rebirthMultiplier)
- `src/ui/BonusPanel.ts` -- Card UI, animations, layout
- `src/ui/BuffBadges.ts` -- Badge display above Roll button (Samsara + Lucky + Super + Epic)
- `src/ui/RebirthOverlay.ts` -- Rebirth informational overlay with ACCEPT button
- `src/core/config.ts` -- `BUFF_CONFIG` + `REBIRTH_CONFIG` constants
- `src/core/GameManager.ts` -- `performRebirth()`, rebirth detection in `roll()` and constructor
