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

## Multiplier Stacking

All active count buffs are consumed together on each roll. If Lucky (x2), Super (x3), and Epic (x5) are all active, the combined multiplier is **x30** (2 * 3 * 5). One charge of each is consumed per roll.

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
| Lucky    | x2        | 1 charge/ad    | #27ae60 |
| Super    | x3        | 15s offer/15s cooldown | #3498db |
| Epic     | x5        | 30s cooldown   | #ffc107 |
| Auto Roll| -         | 30s per ad     | #ff9d43 |

## Key Files

- `src/systems/BuffSystem.ts` -- Pure logic, no Phaser dependency
- `src/ui/BonusPanel.ts` -- Card UI, animations, layout
- `src/ui/BuffBadges.ts` -- Badge display above Roll button
- `src/core/config.ts` -- `BUFF_CONFIG` constants
