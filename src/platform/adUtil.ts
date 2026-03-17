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
