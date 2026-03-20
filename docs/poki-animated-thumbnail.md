# Poki Animated Thumbnail — Requirements

Source: https://sdk.poki.com/animated-thumbnails.html

---

## Technical Specs

| Parameter | Value |
|-----------|-------|
| **Dimensions** | 1080 × 1080 px (can be higher if within file size limit) |
| **Aspect ratio** | 1:1 (square) |
| **Format** | .mp4 |
| **Frame rate** | 50 fps+ |
| **Duration** | 4–6 seconds |
| **Audio** | Muted (no sound) |
| **Max file size** | 100 MB |

---

## Content Guidelines

- Focus on gameplay — showcase core mechanics and most exciting moments
- Keep text to a minimum — visuals should do the talking
- Show 2–3 scenes, each lasting 1–2 seconds
- Start from your static thumbnail art and animate it (visual continuity)
- Simplify — remove or mask non-essential UI elements
- Center visuals (square format may crop edges)
- Hide cursor during recording (use Cursorcerer on Mac or similar tool)

---

## When Required

- Animated thumbnail is needed by **Soft Release** phase (not at initial submission)
- Plays on hover over the static thumbnail on poki.com

---

## Storyboard (6.8 sec total)

### Scene 1 — "The First Roll" (0.3 sec)
Close-up on the ROLL button. A finger/cursor taps it with a satisfying press animation.
The button glows briefly on tap. Tight crop — button fills ~60% of the frame.

### Scene 2 — "Common Hatch" (1.5 sec)
An egg drops into center frame. It wobbles gently 2–3 times, cracks appear along the
shell, then it breaks apart with a soft burst of light. A **Common-grade pet** (e.g. cat
or hamster) is revealed with a subtle glow and small sparkle particles radiating outward.
The pet does a tiny bounce-in animation. Background: clean gradient, no UI clutter.

### Scene 3 — "Legendary Hatch" (2.0 sec)
Quick cut — the ROLL button is tapped again. A new egg appears but this time it shakes
**harder and faster**, growing slightly in size with each wobble. Energy particles swirl
around it. The egg **explodes** with a bright golden flash — a **Legendary-grade pet**
(dragon or phoenix) bursts out in a shower of golden sparkles and rays of light.
The pet is noticeably larger and more vibrant than Scene 2. Hold on the reveal for a beat
so the viewer registers the rarity contrast. Grade color glow: red/gold (#ff3333 / #ffd700).

### Scene 4 — "Roll Burst" (1.5 sec)
Slightly wider shot — the ROLL button is visible at center-bottom. Three rapid taps in
succession. On each tap a different pet **launches out** of the button with a smooth
fade-in → rise → fade-out arc:
- Tap 1: pet flies **upward** (center)
- Tap 2: pet flies **diagonally upper-right**
- Tap 3: pet flies **diagonally upper-left**

Each pet is a different species/color for variety. The arcs overlap slightly for a
cascading "fountain" feel. Motion blur on the pets adds speed/energy.

### Scene 5 — "Collection Reveal" (1.5 sec)
The entire frame **flips like a card** (3D Y-axis rotation, ~0.3 sec transition) to reveal
the pet collection album — a beautifully angled grid of dozens of blocky pets on a
gradient pink-to-blue background (reference: `thumbnails/3.webp`). The grid slowly
**scrolls/pans diagonally** from bottom-left to upper-right, showcasing the variety and
volume of pets. Subtle depth-of-field blur on the edges. The motion is smooth and
satisfying — the viewer sees 50+ pets in one glance.

### Timing Summary

| Scene | Duration | Content |
|-------|----------|---------|
| 1 | 0.3 sec | Close-up ROLL button tap |
| 2 | 1.5 sec | Egg wobble → crack → Common pet reveal (soft glow) |
| 3 | 2.0 sec | Egg shake hard → explode → Legendary pet reveal (bright flash) |
| 4 | 1.5 sec | 3 rapid rolls, pets fly out in 3 directions (up, diag-R, diag-L) |
| 5 | 1.5 sec | Card-flip transition → scrolling pet collection album |
| **Total** | **6.8 sec** | |

### Production Notes
- Total is 6.8 sec — within the 4–6 sec guideline (slightly over, trim Scene 2 or 4 if needed)
- No cursor — use touch/tap visual indicator instead (circle ripple effect)
- No UI elements except the ROLL button — keep it clean
- Background should stay consistent (game gradient) for Scenes 1–4, then flip to album
- The contrast between Common (Scene 2) and Legendary (Scene 3) is the emotional hook
- Scene 4's "pet fountain" creates a sense of abundance and excitement
- Scene 5's album serves as the payoff — "look how many you can collect"

---

## Checklist

- [ ] 1080×1080 px, .mp4, 50 fps+
- [ ] 4–6 seconds, no sound
- [ ] 2–3 gameplay scenes, 1–2 sec each
- [ ] No cursor visible
- [ ] No excessive UI clutter
- [ ] Under 100 MB
