import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI } from '../../core/config';

type ToastType = 'info' | 'error';

interface ActiveToast {
    text: GameObjects.Text;
    slot: number;
    type: ToastType;
    fading: boolean;
}

const DEPTH = 300;
const MAX_ACTIVE = 3;
const MAX_QUEUE = 5;
const COOLDOWN_MS = 1000;
const DISPLAY_MS = 1050;
const FADE_MS = 500;
const SLOT_H = 40;
const BASE_Y = 25;

const COLOR: Record<ToastType, string> = {
    info: '#ffffff',
    error: '#ff6666',
};

let active: ActiveToast[] = [];
let queue: Array<{ scene: Scene; message: string; type: ToastType }> = [];
let lastShowTime = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

function slotY(slot: number): number {
    return BASE_Y + slot * SLOT_H;
}

function removeToast(scene: Scene, toast: ActiveToast): void {
    const idx = active.indexOf(toast);
    if (idx !== -1) active.splice(idx, 1);
    for (let i = 0; i < active.length; i++) {
        active[i].slot = i;
        if (active[i].text.active) {
            scene.tweens.add({
                targets: active[i].text,
                y: slotY(i),
                duration: 200,
                ease: 'Power2',
            });
        }
    }
    processQueue();
}

function displayToast(scene: Scene, message: string, type: ToastType): void {
    const slot = active.length;
    const y = slotY(slot);

    const text = scene.add.text(GAME_WIDTH / 2, y, message, {
        fontFamily: UI.FONT_STROKE,
        fontSize: '20px',
        color: COLOR[type],
        stroke: '#000000',
        strokeThickness: UI.STROKE_MEDIUM,
    }).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

    const toast: ActiveToast = { text, slot, type, fading: false };
    active.push(toast);
    lastShowTime = Date.now();

    scene.tweens.add({
        targets: text,
        alpha: 1,
        scaleX: { from: 0.8, to: 1 },
        scaleY: { from: 0.8, to: 1 },
        duration: 150,
        ease: 'Back.easeOut',
    });

    scene.tweens.add({
        targets: text,
        alpha: 0,
        y: y - 20,
        delay: DISPLAY_MS,
        duration: FADE_MS,
        ease: 'Power2',
        onStart: () => { toast.fading = true; },
        onComplete: () => {
            text.destroy();
            removeToast(scene, toast);
        },
    });
}

function processQueue(): void {
    if (queue.length === 0 || active.length >= MAX_ACTIVE) return;
    const elapsed = Date.now() - lastShowTime;
    if (elapsed >= COOLDOWN_MS) {
        const next = queue.shift()!;
        if (next.scene.scene.isActive()) {
            displayToast(next.scene, next.message, next.type);
        } else {
            processQueue();
        }
    } else if (!timer) {
        timer = setTimeout(() => {
            timer = null;
            processQueue();
        }, COOLDOWN_MS - elapsed);
    }
}

/** Has a visible (non-fading) error toast on screen? */
function hasActiveError(): boolean {
    return active.some(t => t.type === 'error' && !t.fading && t.text.active);
}

export function showToast(scene: Scene, message: string, type: ToastType = 'info'): void {
    active = active.filter(t => t.text.active);

    // Error toasts: only 1 at a time, no queuing. Re-triggers only during fade-out.
    if (type === 'error') {
        if (hasActiveError()) return;
        displayToast(scene, message, type);
        return;
    }

    // Info toasts: queue normally
    const elapsed = Date.now() - lastShowTime;
    if (active.length >= MAX_ACTIVE || elapsed < COOLDOWN_MS) {
        if (queue.length < MAX_QUEUE) queue.push({ scene, message, type });
        if (!timer) {
            const delay = Math.max(0, COOLDOWN_MS - elapsed);
            timer = setTimeout(() => { timer = null; processQueue(); }, delay);
        }
        return;
    }
    displayToast(scene, message, type);
}

export function clearToasts(): void {
    active.forEach(t => { if (t.text.active) t.text.destroy(); });
    active = [];
    queue = [];
    if (timer) { clearTimeout(timer); timer = null; }
}
