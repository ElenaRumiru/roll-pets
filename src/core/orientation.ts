export const LANDSCAPE_W = 1031;
export const LANDSCAPE_H = 580;
export const PORTRAIT_W = 580;
export const PORTRAIT_H = 1031;

let portrait = false;

export function isPortrait(): boolean {
    return portrait;
}

export function detectOrientation(): boolean {
    return typeof window !== 'undefined'
        ? window.innerWidth < window.innerHeight
        : false;
}

export function setPortrait(p: boolean): void {
    portrait = p;
}

export function getGameWidth(): number {
    return portrait ? PORTRAIT_W : LANDSCAPE_W;
}

export function getGameHeight(): number {
    return portrait ? PORTRAIT_H : LANDSCAPE_H;
}
