/** Race a promise against a timeout. Rejects on expiry. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Ad timeout')), ms),
        ),
    ]);
}

export const AD_TIMEOUT_MS = 30_000;

const BLOCKED_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

/** Block keyboard (space/arrows) and wheel during ad playback. Returns unblock fn. */
export function blockInput(): () => void {
    const onKey = (e: KeyboardEvent): void => {
        if (BLOCKED_KEYS.has(e.code)) e.preventDefault();
    };
    const onWheel = (e: Event): void => e.preventDefault();
    document.addEventListener('keydown', onKey, { capture: true });
    document.addEventListener('wheel', onWheel, { passive: false, capture: true } as AddEventListenerOptions);
    return () => {
        document.removeEventListener('keydown', onKey, { capture: true } as EventListenerOptions);
        document.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
    };
}
