import { Textures } from 'phaser';

type TM = Textures.TextureManager;

/** Get scale factor to display a pet texture at the desired pixel size */
export function getPetScale(textures: TM, imageKey: string, targetSize: number): number {
    if (!textures.exists(imageKey)) return 0;
    const src = textures.get(imageKey).getSourceImage();
    const maxDim = Math.max(src.width, src.height);
    return maxDim > 0 ? targetSize / maxDim : 0;
}

/** Trim transparent pixels from source, then create multiple sized square textures */
export function trimAndDownscaleCoin(
    textures: TM, srcKey: string, targets: { key: string; size: number }[],
): void {
    const src = textures.get(srcKey).getSourceImage() as HTMLImageElement;
    const tmp = document.createElement('canvas');
    tmp.width = src.width;
    tmp.height = src.height;
    const tmpCtx = tmp.getContext('2d')!;
    tmpCtx.drawImage(src, 0, 0);
    const data = tmpCtx.getImageData(0, 0, tmp.width, tmp.height);
    let top = tmp.height, left = tmp.width, bottom = 0, right = 0;
    for (let y = 0; y < tmp.height; y++) {
        for (let x = 0; x < tmp.width; x++) {
            if (data.data[(y * tmp.width + x) * 4 + 3] > 10) {
                if (y < top) top = y;
                if (y > bottom) bottom = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
    }
    const tw = right - left + 1;
    const th = bottom - top + 1;
    for (const { key, size } of targets) {
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const scale = Math.min(size / tw, size / th);
        const dw = Math.round(tw * scale);
        const dh = Math.round(th * scale);
        ctx.drawImage(src, left, top, tw, th, (size - dw) / 2, (size - dh) / 2, dw, dh);
        textures.addCanvas(key, c);
    }
}

/** Trim transparent pixels, scale so width = targetWidth, preserve aspect ratio */
export function trimToWidth(
    textures: TM, srcKey: string, destKey: string,
    targetWidth: number, alphaThreshold = 10,
): void {
    const src = textures.get(srcKey).getSourceImage() as HTMLImageElement;
    const tmp = document.createElement('canvas');
    tmp.width = src.width;
    tmp.height = src.height;
    const tmpCtx = tmp.getContext('2d')!;
    tmpCtx.drawImage(src, 0, 0);
    const data = tmpCtx.getImageData(0, 0, tmp.width, tmp.height);
    let top = tmp.height, left = tmp.width, bottom = 0, right = 0;
    for (let y = 0; y < tmp.height; y++) {
        for (let x = 0; x < tmp.width; x++) {
            if (data.data[(y * tmp.width + x) * 4 + 3] > alphaThreshold) {
                if (y < top) top = y;
                if (y > bottom) bottom = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
    }
    const tw = right - left + 1;
    const th = bottom - top + 1;
    const scale = targetWidth / tw;
    const dh = Math.round(th * scale);
    const c = document.createElement('canvas');
    c.width = targetWidth;
    c.height = dh;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, left, top, tw, th, 0, 0, targetWidth, dh);
    textures.addCanvas(destKey, c);
}

/** Trim transparent pixels, scale so height = targetHeight, preserve aspect ratio */
export function trimToHeight(
    textures: TM, srcKey: string, destKey: string, targetHeight: number,
): void {
    const src = textures.get(srcKey).getSourceImage() as HTMLImageElement;
    const tmp = document.createElement('canvas');
    tmp.width = src.width;
    tmp.height = src.height;
    const tmpCtx = tmp.getContext('2d')!;
    tmpCtx.drawImage(src, 0, 0);
    const data = tmpCtx.getImageData(0, 0, tmp.width, tmp.height);
    let top = tmp.height, left = tmp.width, bottom = 0, right = 0;
    for (let y = 0; y < tmp.height; y++) {
        for (let x = 0; x < tmp.width; x++) {
            if (data.data[(y * tmp.width + x) * 4 + 3] > 10) {
                if (y < top) top = y;
                if (y > bottom) bottom = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
    }
    const tw = right - left + 1;
    const th = bottom - top + 1;
    const scale = targetHeight / th;
    const dw = Math.round(tw * scale);
    const c = document.createElement('canvas');
    c.width = dw;
    c.height = targetHeight;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, left, top, tw, th, 0, 0, dw, targetHeight);
    textures.addCanvas(destKey, c);
}

/** High-quality canvas resample to exact dimensions */
export function downscaleTexture(
    textures: TM, srcKey: string, destKey: string, w: number, h: number,
): void {
    const src = textures.get(srcKey).getSourceImage() as HTMLImageElement;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, w, h);
    textures.addCanvas(destKey, c);
}

/** Downscale a pet texture 512px → 250px in-place */
export function downscalePet(textures: TM, imageKey: string): void {
    const TARGET = 250;
    const src = textures.get(imageKey).getSourceImage() as HTMLImageElement;
    const ratio = Math.min(TARGET / src.width, TARGET / src.height, 1);
    const w = Math.round(src.width * ratio);
    const h = Math.round(src.height * ratio);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, w, h);
    textures.remove(imageKey);
    textures.addCanvas(imageKey, c);
}

/** Create egg_N_sm (170px) small variant from full-size egg texture */
export function createEggSmall(textures: TM, tier: number): void {
    const TARGET = 170;
    const key = `egg_${tier}`;
    if (textures.exists(`${key}_sm`)) return;
    const src = textures.get(key).getSourceImage() as HTMLImageElement;
    const c = document.createElement('canvas');
    c.width = TARGET;
    c.height = TARGET;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, TARGET, TARGET);
    textures.addCanvas(`${key}_sm`, c);
}

/** Copy collection icon to canvas texture (GPU handles display scaling) */
export function processCollectionIcon(textures: TM, name: string): void {
    if (textures.exists(`col_${name}`)) return;
    const src = textures.get(`col_${name}_raw`).getSourceImage() as HTMLImageElement;
    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d')!.drawImage(src, 0, 0);
    textures.addCanvas(`col_${name}`, c);
}

/** Downscale automod toggle icon to 232x144 (2x display) to avoid moire */
export function processAutomodIcon(textures: TM, key: string): void {
    const src = textures.get(key).getSourceImage() as HTMLImageElement;
    const c = document.createElement('canvas');
    c.width = 232;
    c.height = 144;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, 232, 144);
    textures.remove(key);
    textures.addCanvas(key, c);
}
