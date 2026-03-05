import { GameObjects, Scene } from 'phaser';

const FLARE_W = 18;
const SKEW = 0.4;
const SWEEP_MS = 840;
const ALPHA_MAIN = 0.28;
const ALPHA_GLOW = 0.10;
const GLOW_W = 8;
const STEPS = 12;

/**
 * Adds a repeating diagonal shine sweep across a rounded-rect button.
 * Clips to the rounded-rect shape by computing left/right x-bounds per scanline.
 */
export function addShineEffect(
    scene: Scene,
    container: GameObjects.Container,
    w: number,
    h: number,
    r: number,
    intervalMs = 5000,
): void {
    const shine = scene.add.graphics().setAlpha(0);
    container.add(shine);

    const halfW = w / 2;
    const halfH = h / 2;
    const cr = Math.min(r, halfH, halfW);

    // For a given y (-halfH..halfH), compute the x-bounds of the rounded rect
    const xBounds = (y: number): [number, number] => {
        const ay = Math.abs(y);
        if (ay <= halfH - cr) return [-halfW, halfW];
        // Inside corner region
        const dy = ay - (halfH - cr);
        const inset = cr - Math.sqrt(Math.max(0, cr * cr - dy * dy));
        return [-halfW + inset, halfW - inset];
    };

    // Draw one band of the flare, clipped to rounded rect
    const drawBand = (xOff: number, bw: number, alpha: number): void => {
        const dx = h * SKEW;
        // Build clipped shape scanline by scanline
        const leftPts: { x: number; y: number }[] = [];
        const rightPts: { x: number; y: number }[] = [];

        for (let i = 0; i <= STEPS; i++) {
            const t = i / STEPS;
            const y = -halfH + t * h;
            const shift = dx * t; // skew offset at this y
            const bandL = xOff - shift;
            const bandR = xOff + bw - shift;
            const [bndL, bndR] = xBounds(y);

            const clL = Math.max(bandL, bndL);
            const clR = Math.min(bandR, bndR);
            if (clL >= clR) continue;

            leftPts.push({ x: clL, y });
            rightPts.push({ x: clR, y });
        }

        if (leftPts.length < 2) return;

        shine.fillStyle(0xffffff, alpha);
        shine.beginPath();
        shine.moveTo(leftPts[0].x, leftPts[0].y);
        for (let i = 1; i < leftPts.length; i++) {
            shine.lineTo(leftPts[i].x, leftPts[i].y);
        }
        for (let i = rightPts.length - 1; i >= 0; i--) {
            shine.lineTo(rightPts[i].x, rightPts[i].y);
        }
        shine.closePath();
        shine.fillPath();
    };

    const drawAt = (x: number): void => {
        shine.clear();
        drawBand(x - GLOW_W, GLOW_W, ALPHA_GLOW);
        drawBand(x, FLARE_W, ALPHA_MAIN);
        drawBand(x + FLARE_W, GLOW_W, ALPHA_GLOW);
    };

    const startX = -halfW - FLARE_W - h * SKEW - GLOW_W;
    const endX = halfW + FLARE_W + GLOW_W;

    const doSweep = (): void => {
        if (!container.active || !container.visible) return;
        shine.setAlpha(1);
        const p = { x: startX };
        scene.tweens.add({
            targets: p,
            x: endX,
            duration: SWEEP_MS,
            ease: 'Quad.easeInOut',
            onUpdate: () => drawAt(p.x),
            onComplete: () => { shine.setAlpha(0); shine.clear(); },
        });
    };

    scene.time.addEvent({ delay: intervalMs, callback: doSweep, loop: true });
    scene.time.delayedCall(1200, doSweep);
}
