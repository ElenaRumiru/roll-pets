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

/** Block all input (keyboard, mouse, touch, wheel) during ad playback. Returns unblock fn. */
export function blockInput(game?: Phaser.Game): () => void {
    const stop = (e: Event): void => { e.stopPropagation(); e.preventDefault(); };
    const captureOpts = { capture: true } as EventListenerOptions;
    const passiveCapture = { passive: false, capture: true } as AddEventListenerOptions;

    document.addEventListener('keydown', stop, captureOpts);
    document.addEventListener('keyup', stop, captureOpts);
    document.addEventListener('mousedown', stop, captureOpts);
    document.addEventListener('mouseup', stop, captureOpts);
    document.addEventListener('click', stop, captureOpts);
    document.addEventListener('touchstart', stop, passiveCapture);
    document.addEventListener('touchend', stop, passiveCapture);
    document.addEventListener('pointerdown', stop, captureOpts);
    document.addEventListener('pointerup', stop, captureOpts);
    document.addEventListener('wheel', stop, passiveCapture);

    if (game?.input?.keyboard) game.input.keyboard.enabled = false;
    if (game?.input) game.input.enabled = false;

    return () => {
        document.removeEventListener('keydown', stop, captureOpts);
        document.removeEventListener('keyup', stop, captureOpts);
        document.removeEventListener('mousedown', stop, captureOpts);
        document.removeEventListener('mouseup', stop, captureOpts);
        document.removeEventListener('click', stop, captureOpts);
        document.removeEventListener('touchstart', stop, captureOpts);
        document.removeEventListener('touchend', stop, captureOpts);
        document.removeEventListener('pointerdown', stop, captureOpts);
        document.removeEventListener('pointerup', stop, captureOpts);
        document.removeEventListener('wheel', stop, captureOpts);

        if (game?.input?.keyboard) game.input.keyboard.enabled = true;
        if (game?.input) game.input.enabled = true;
    };
}
