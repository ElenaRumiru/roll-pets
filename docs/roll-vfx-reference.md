# Roll VFX Reference — Visual Effects for Pet Hatching

Extracted from the thumbnail animation (`thumbnail-video/index.html`).
All code is vanilla Canvas 2D API — adapt to Phaser as needed.

---

## 1. Particle System (core)

Reusable particle engine for all explosion/sparkle effects.

```js
let particles = [];

function spawnParticles(x, y, count, color, speed, size) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = speed * (0.5 + Math.random());
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      alpha: 1,
      size: size * (0.5 + Math.random() * 0.5),
      color,
      life: 0,
      maxLife: 40 + Math.random() * 40, // ~0.7-1.3 sec at 60fps
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15; // gravity — particles arc downward
    p.life++;
    p.alpha = 1 - p.life / p.maxLife;
    if (p.life >= p.maxLife) particles.splice(i, 1);
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.shadowBlur = p.size * 4;  // glow = 4x particle size
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
```

**Key parameters:**
- `count` — number of particles (6 for subtle, 80+ for epic)
- `color` — CSS color string, matches grade color
- `speed` — initial velocity (4 = gentle, 18 = explosive)
- `size` — radius in px (5 = small sparkle, 16 = big orb)
- `shadowBlur = size * 4` — this is what makes them GLOW, not just dots

---

## 2. Common Roll Effects

**Used for:** Common, Uncommon, Extra grades. Soft, pleasant, not overwhelming.

### 2a. Egg Wobble
```js
// dt goes 0→1 over wobble duration
const wobbleAngle = Math.sin(dt * Math.PI * 6) * 0.09 * (1 - dt * 0.5);
// Apply as rotation to egg sprite
```
- 3 full oscillations (`* 6`)
- Amplitude: ±5° (`0.09 rad`), decaying slightly
- Duration: ~0.5s

### 2b. Crack Lines (drawn on egg)
```js
ctx.save();
ctx.globalAlpha = crackProgress; // 0→1
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 5;
ctx.translate(eggX, eggY);
// Zigzag crack pattern
ctx.beginPath();
ctx.moveTo(-25, -70); ctx.lineTo(12, -12); ctx.lineTo(-35, 35); ctx.lineTo(0, 80);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(35, -60); ctx.lineTo(45, 0); ctx.lineTo(25, 50);
ctx.stroke();
ctx.restore();
```
- White lines over egg surface
- Fade in over last 40% of wobble phase

### 2c. Egg Break — Shrink + Particle Burst
```js
// Egg shrinks to nothing
const eggScale = 1 - easeInCubic(dt); // 1→0
const eggAlpha = 1 - dt;

// Simultaneously spawn particles (ONCE at break moment)
spawnParticles(cx, cy, 30, '#88cc55', 14, 14);  // green (grade color)
spawnParticles(cx, cy, 20, '#ffffff', 10, 8);    // white sparkles
spawnParticles(cx, cy, 15, '#ffd700', 8, 10);    // gold accents
```
- Total: 65 particles
- Colors: grade color + white + gold
- Egg scales to 0 with `easeInCubic` (accelerating shrink)

### 2d. Pet Reveal — Bounce In + Glow
```js
const revealScale = easeOutBack(t); // 0→1 with overshoot (bouncy!)

// Draw pet with colored glow behind it
ctx.save();
ctx.globalAlpha = alpha;
ctx.shadowBlur = 120 * revealScale;  // glow intensity
ctx.shadowColor = '#88cc55';          // grade color
ctx.drawImage(petImg, ...);
ctx.restore();
```
- `easeOutBack` gives the satisfying "pop" overshoot
- `shadowBlur = 120` at full scale — visible but not overwhelming
- Shadow color = grade color (green for common, etc.)

**easeOutBack function:**
```js
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
```

---

## 3. Legendary Roll Effects

**Used for:** Mythic, Ancient, Legendary grades. Maximum drama and spectacle.

### 3a. Screen Shake (during egg wobble)
```js
// dt goes 0→1 over egg wobble phase
const shakeIntensity = dt * dt * 18; // quadratic buildup: 0→18px
const shakeX = Math.sin(frame * 1.7) * shakeIntensity;
const shakeY = Math.cos(frame * 2.3) * shakeIntensity * 0.7;

ctx.save();
ctx.translate(shakeX, shakeY);
// ... draw everything inside shake context ...
ctx.restore();
```
- Intensity SQUARES over time (starts subtle, gets violent)
- X and Y use different frequencies (1.7 vs 2.3) so it feels organic, not circular
- Y is 70% of X (more horizontal than vertical)
- Max displacement: 18px

### 3b. Heat Vignette (during egg wobble)
```js
ctx.save();
ctx.globalAlpha = dt * 0.4; // intensifies with time
const heatVig = ctx.createRadialGradient(cx, cy, eggSize * 0.3, cx, cy, screenW * 0.7);
heatVig.addColorStop(0, 'rgba(255,140,0,0)');     // transparent center
heatVig.addColorStop(0.6, 'rgba(255,80,0,0.2)');  // orange mid
heatVig.addColorStop(1, 'rgba(255,0,0,0.5)');     // red edges
ctx.fillStyle = heatVig;
ctx.fillRect(0, 0, W, H);
ctx.restore();
```
- Screen edges glow red/orange
- Builds from 0% to 40% opacity
- Creates "heating up" tension

### 3c. Egg Glow (intensifying)
```js
const wobbleAngle = Math.sin(dt * Math.PI * 10) * 0.17 * (0.5 + dt * 0.5);
const growScale = 1 + dt * 0.25;  // egg grows 25% during wobble
const eggGlow = dt * 80;          // glow 0→80px

// Draw with glow
ctx.shadowBlur = eggGlow;
ctx.shadowColor = '#ff8c00'; // orange
ctx.drawImage(egg, ...);
```
- 5 full wobble oscillations (`* 10`) — much more violent than common
- Amplitude: ±10° (`0.17 rad`)
- Egg physically GROWS 25%
- Orange glow intensifies from 0 to 80px

### 3d. Orbiting Energy Particles (during egg wobble)
```js
let orbitParticles = [];

function spawnOrbitParticles(cx, cy, count) {
  orbitParticles = [];
  for (let i = 0; i < count; i++) {
    orbitParticles.push({
      angle: (Math.PI * 2 / count) * i,  // evenly spaced
      radius: 180 + Math.random() * 80,   // orbit radius
      speed: 0.04 + Math.random() * 0.03, // rotation speed
      size: 5 + Math.random() * 7,
      cx, cy,
    });
  }
}

function drawOrbitParticles(ctx, alpha) {
  for (const p of orbitParticles) {
    p.angle += p.speed;
    const x = p.cx + Math.cos(p.angle) * p.radius;
    const y = p.cy + Math.sin(p.angle) * p.radius;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
```
- 12 golden dots orbit the egg
- Each at slightly different radius/speed for organic feel
- Alpha fades in with wobble progress

### 3e. Continuous Heat Sparks (during wobble)
```js
// Every 3rd frame after 30% wobble progress
if (dt > 0.3 && frame % 3 === 0) {
  spawnParticles(
    cx + (Math.random() - 0.5) * eggSize,
    cy + (Math.random() - 0.5) * eggSize,
    2, '#ffd700', 3, 5
  );
}
```
- Random gold sparks fly off the egg surface
- Sparse (2 per spawn, every 3 frames) but continuous
- Creates "energy leaking" feel

### 3f. Screen Flash (at egg break)
```js
// Full white flash, fades out
flashAlpha = 1 - (t - flashStart) / (flashEnd - flashStart);

ctx.save();
ctx.globalAlpha = flashAlpha;
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, W, H);
ctx.restore();
```
- Full-screen white rect
- Duration: ~0.1s
- Drawn LAST (on top of everything)

### 3g. Massive Particle Explosion (at egg break)
```js
spawnParticles(cx, cy, 80, '#ffd700', 18, 16);  // gold — main burst
spawnParticles(cx, cy, 40, '#ff3333', 14, 12);  // red — fire accent
spawnParticles(cx, cy, 40, '#ffffff', 20, 10);  // white — brightness
spawnParticles(cx, cy, 25, '#ff8c00', 12, 14);  // orange — warmth
```
- Total: **185 particles** (vs 65 for common)
- 4 colors: gold + red + white + orange
- Higher speeds (12-20) = bigger explosion radius
- Bigger sizes (10-16) = more visible

### 3h. Radial Glow Behind Pet
```js
ctx.save();
ctx.globalAlpha = 0.3;
const grad = ctx.createRadialGradient(cx, cy, petSize * 0.2, cx, cy, petSize * 0.7);
grad.addColorStop(0, '#ffd700');              // gold center
grad.addColorStop(0.5, '#ff8c00');            // orange mid
grad.addColorStop(1, 'rgba(255,51,51,0)');    // red edge, transparent
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);
ctx.restore();
```
- Covers entire screen with subtle gradient
- Gold→orange→red transition
- 30% opacity — atmospheric, not blinding

### 3i. Rotating Light Rays
```js
ctx.save();
ctx.globalAlpha = 0.25;
ctx.translate(cx, cy);
const rayCount = 12;
for (let i = 0; i < rayCount; i++) {
  const angle = (Math.PI * 2 / rayCount) * i + frame * 0.01; // slow rotation
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(-8, 0);                    // narrow base
  ctx.lineTo(0, -petSize * 0.6);        // long ray
  ctx.lineTo(8, 0);                     // narrow base
  ctx.fill();
  ctx.restore();
}
ctx.restore();
```
- 12 golden triangular rays radiating from pet center
- Slowly rotate (`frame * 0.01`)
- Length = 60% of pet size
- 25% opacity — subtle god-rays effect

### 3j. Fire Aura (behind pet, animated)
```js
const fireTime = frame * 0.08;

// 18 fire orbs orbiting pet
for (let i = 0; i < 18; i++) {
  const fa = (Math.PI * 2 / 18) * i + fireTime * (0.5 + i * 0.03);
  const dist = petSize * (0.28 + Math.sin(fireTime + i * 1.3) * 0.08);
  const fx = cx + Math.cos(fa) * dist;
  const fy = cy + Math.sin(fa) * dist - Math.abs(Math.sin(fireTime + i)) * 60;
  const fSize = 30 + Math.sin(fireTime * 2 + i) * 15;

  ctx.save();
  ctx.globalAlpha = 0.35 + Math.sin(fireTime + i * 0.7) * 0.15;
  const fGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fSize);
  fGrad.addColorStop(0, '#ffffff');      // white hot center
  fGrad.addColorStop(0.2, '#ffd700');    // gold
  fGrad.addColorStop(0.5, '#ff8c00');    // orange
  fGrad.addColorStop(0.8, '#ff3300');    // red
  fGrad.addColorStop(1, 'rgba(255,0,0,0)'); // transparent
  ctx.fillStyle = fGrad;
  ctx.beginPath();
  ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
```
- 18 radial gradient orbs around pet
- Each moves independently (different phase offsets)
- Float upward slightly (`- Math.abs(Math.sin(...)) * 60`)
- Pulsing size and alpha
- Gradient: white→gold→orange→red→transparent

### 3k. Rising Flame Tongues
```js
for (let i = 0; i < 8; i++) {
  const tongueX = cx + (i - 3.5) * 50 + Math.sin(fireTime * 3 + i * 2) * 20;
  const tongueBaseY = cy + petSize * 0.3;
  const tongueH = 80 + Math.sin(fireTime * 4 + i) * 40;
  const tongueW = 18 + Math.sin(fireTime * 2.5 + i * 1.5) * 8;

  ctx.save();
  ctx.globalAlpha = 0.3 + Math.sin(fireTime * 3 + i) * 0.1;
  const tGrad = ctx.createLinearGradient(tongueX, tongueBaseY, tongueX, tongueBaseY - tongueH);
  tGrad.addColorStop(0, '#ff8c00');              // orange base
  tGrad.addColorStop(0.4, '#ffd700');            // gold mid
  tGrad.addColorStop(1, 'rgba(255,255,255,0)');  // white tip, transparent
  ctx.fillStyle = tGrad;
  ctx.beginPath();
  ctx.ellipse(tongueX, tongueBaseY - tongueH/2, tongueW, tongueH/2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
```
- 8 flame ellipses rising from below pet
- Horizontal sway via `Math.sin`
- Pulsing height (40-120px) and width (10-26px)
- Gradient: orange→gold→white (bottom→top)

### 3l. Bright Core Glow (pulsing)
```js
ctx.save();
ctx.globalAlpha = 0.4 + Math.sin(fireTime * 5) * 0.1; // pulsing 30-50%
const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, petSize * 0.45);
coreGrad.addColorStop(0, 'rgba(255,255,255,0.6)');    // bright white center
coreGrad.addColorStop(0.3, 'rgba(255,215,0,0.3)');    // gold
coreGrad.addColorStop(0.7, 'rgba(255,140,0,0.1)');    // orange
coreGrad.addColorStop(1, 'rgba(255,51,0,0)');          // red, transparent
ctx.fillStyle = coreGrad;
ctx.beginPath();
ctx.arc(cx, cy, petSize * 0.45, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
```
- White-hot center behind pet
- Pulsing alpha (0.3–0.5) at 5x speed
- Gives "inner fire" illumination

---

## 4. Grade Color Reference

Use these colors for glow/particles to match pet grade:

| Grade | Color | Hex |
|-------|-------|-----|
| Common | Gray | `#9e9e9e` |
| Uncommon | Green | `#88cc55` |
| Extra | Dark Green | `#2d8a2d` |
| Rare | Cyan | `#42c9c9` |
| Superior | Light Blue | `#5dade2` |
| Elite | Purple | `#a08cda` |
| Epic | Dark Purple | `#b060d0` |
| Heroic | Pink | `#e880a0` |
| Mythic | Gold | `#ffd700` |
| Ancient | Orange | `#ff8c00` |
| Legendary | Red | `#ff3333` |

---

## 5. Effect Scaling by Grade Tier

| | Common-Rare | Elite-Epic | Heroic-Mythic | Ancient-Legendary |
|---|---|---|---|---|
| **Wobble** | 3 cycles, ±5° | 5 cycles, ±8° | 7 cycles, ±12° | 10 cycles, ±10°+ growing |
| **Screen shake** | None | Subtle (5px) | Medium (10px) | Intense (18px, quadratic) |
| **Particle count** | 65 | 100 | 140 | 185 |
| **Particle speed** | 8-14 | 10-16 | 14-18 | 14-20 |
| **Pet glow (shadowBlur)** | 120 | 120 | 150 | 150 |
| **Screen flash** | None | Subtle | Full white | Full white |
| **Radial glow** | Grade color only | Grade + gold | Gold + grade | Gold + orange + red |
| **Light rays** | None | None | 8 rays | 12 rays, rotating |
| **Fire aura** | None | None | None | 18 orbs + 8 flames |
| **Core glow** | None | None | Subtle | Pulsing, bright |
| **Heat vignette** | None | None | Subtle | Full, intensifying |
| **Orbit particles** | None | None | 8 dots | 12 dots |
| **Heat sparks** | None | None | None | Continuous |

---

## 6. Easing Functions

```js
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInCubic(t) { return t * t * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
```

---

## 7. Draw Order (Z-layering)

For each frame, draw in this order (back to front):

1. Background
2. Heat vignette (legendary only)
3. Radial glow behind pet
4. Light rays (legendary only)
5. Fire aura orbs (legendary only)
6. Flame tongues (legendary only)
7. Core glow (legendary only)
8. **Pet sprite** (with `shadowBlur` for glow)
9. Chance text
10. Explosion particles (on top of everything)
11. Screen flash (absolute last, full-screen white rect)
