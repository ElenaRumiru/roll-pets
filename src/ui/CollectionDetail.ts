import { GameObjects, Scene } from 'phaser';
import { UI } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait } from '../core/orientation';
import { CollectionDef } from '../data/collections';
import { CollectionTracker } from '../systems/CollectionTracker';
import { PETS } from '../data/pets';
import { PetCard } from './PetCard';
import { Button } from './components/Button';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { addShineEffect } from './components/shineEffect';

const BAR_CORNER_R = 6;
const BAR_GREEN = 0x78C828;
const BAR_GREEN_DARK = 0x5A9A1E;

function formatReward(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
    return String(n);
}

export interface DetailResult {
    cleanup: () => void;
}

export function buildDetailView(
    scene: Scene,
    container: GameObjects.Container,
    coll: CollectionDef,
    tracker: CollectionTracker,
    playerCollection: Set<string>,
    onNav: (direction: -1 | 1) => void,
    onClaim: (collId: string) => void,
    onClose: () => void,
): DetailResult {
    const gw = getGameWidth();
    const gh = getGameHeight();
    const port = isPortrait();

    const POPUP_W = port ? 460 : 820;
    const POPUP_H = port ? 810 : 470;
    const POPUP_R = 16;
    const PET_COLS = port ? 3 : 6;
    const PET_CARD_SX = 123;
    const PET_CARD_SY = 138;
    const BAR_W = port ? 160 : 180;
    const BAR_H_DETAIL = 21;
    const titleFontSz = port ? 20 : 22;

    const progress = tracker.getProgressById(coll.id, playerCollection);
    const isClaimed = tracker.isClaimed(coll.id);
    const isComplete = progress.current === progress.total;
    const isClaimable = isComplete && !isClaimed;
    const ratio = progress.total > 0 ? progress.current / progress.total : 0;

    const unseenIds = new Set(tracker.getUnseenPetIds(coll.id, playerCollection));
    tracker.markSeen(coll.id, playerCollection);

    const px = gw / 2;
    const py = gh / 2;
    const top = py - POPUP_H / 2;

    // Dim overlay
    const dimBg = scene.add.rectangle(px, py, gw, gh, 0x000000, 0.7);
    dimBg.setInteractive();
    dimBg.on('pointerdown', onClose);
    container.add(dimBg);

    // Panel background
    const panelBg = scene.add.graphics();
    panelBg.fillStyle(0x1a1a2e, 1);
    panelBg.fillRoundedRect(px - POPUP_W / 2, top, POPUP_W, POPUP_H, POPUP_R);
    panelBg.lineStyle(4, 0x000000, 1);
    panelBg.strokeRoundedRect(px - POPUP_W / 2, top, POPUP_W, POPUP_H, POPUP_R);
    panelBg.lineStyle(1.5, 0xFEBF07, 1);
    panelBg.strokeRoundedRect(px - POPUP_W / 2, top, POPUP_W, POPUP_H, POPUP_R);
    container.add(panelBg);

    // Panel zone blocks closing + blocks wheel events
    const panelZone = scene.add.zone(px, py, POPUP_W, POPUP_H).setInteractive();
    container.add(panelZone);

    // === HEADER ===
    const titleY = top + 26;

    const closeX = scene.add.text(px + POPUP_W / 2 - 22, titleY, '\u2715', {
        fontFamily: UI.FONT_STROKE, fontSize: `${titleFontSz}px`, color: '#aaaaaa',
        stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeX.on('pointerdown', onClose);
    closeX.on('pointerover', () => closeX.setColor('#ffffff'));
    closeX.on('pointerout', () => closeX.setColor('#aaaaaa'));
    container.add(closeX);
    container.add(scene.add.text(px, titleY, t(coll.nameKey), {
        fontFamily: UI.FONT_STROKE, fontSize: `${titleFontSz}px`, color: '#ffffff',
        stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5));

    // === PROGRESS BAR ===
    const barY = top + 60;
    const fillColor = isClaimed ? BAR_GREEN_DARK : BAR_GREEN;
    const barGfx = scene.add.graphics();

    barGfx.lineStyle(1.5, 0x000000, 0.9);
    barGfx.strokeRoundedRect(px - BAR_W / 2 - 4, barY - BAR_H_DETAIL / 2 - 4, BAR_W + 8, BAR_H_DETAIL + 8, BAR_CORNER_R + 3);
    barGfx.lineStyle(3, 0xFEBF07, 1);
    barGfx.strokeRoundedRect(px - BAR_W / 2 - 2, barY - BAR_H_DETAIL / 2 - 2, BAR_W + 4, BAR_H_DETAIL + 4, BAR_CORNER_R + 2);
    barGfx.lineStyle(1.5, 0x000000, 0.9);
    barGfx.strokeRoundedRect(px - BAR_W / 2, barY - BAR_H_DETAIL / 2, BAR_W, BAR_H_DETAIL, BAR_CORNER_R);

    barGfx.fillStyle(0x222244, 0.6);
    barGfx.fillRoundedRect(px - BAR_W / 2, barY - BAR_H_DETAIL / 2, BAR_W, BAR_H_DETAIL, BAR_CORNER_R);

    const fillW = Math.max(0, ratio * BAR_W);
    if (fillW > 2) {
        const fw = Math.min(fillW, BAR_W - 1);
        const fr = fw >= BAR_H_DETAIL ? BAR_CORNER_R : Math.min(fw / 2, BAR_CORNER_R);
        barGfx.fillStyle(fillColor, 1);
        barGfx.fillRoundedRect(px - BAR_W / 2 + 1, barY - BAR_H_DETAIL / 2 + 1, fw, BAR_H_DETAIL - 2, fr);
        if (fw > 6) {
            const hlR = fw >= BAR_H_DETAIL ? { tl: BAR_CORNER_R - 1, tr: BAR_CORNER_R - 1, bl: 0, br: 0 } : 0;
            barGfx.fillStyle(0xffffff, 0.18);
            barGfx.fillRoundedRect(px - BAR_W / 2 + 2, barY - BAR_H_DETAIL / 2 + 2, fw - 2, (BAR_H_DETAIL - 4) * 0.4, hlR);
        }
    }
    container.add(barGfx);

    container.add(scene.add.text(px, barY, `${progress.current}/${progress.total}`, {
        fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5));

    // Circle at bar end
    const circleR = 16;
    const circleXPos = px + BAR_W / 2;
    const circleYPos = barY;
    const coinGfx = scene.add.graphics();

    coinGfx.lineStyle(1.5, 0x000000, 0.9);
    coinGfx.strokeCircle(circleXPos, circleYPos, circleR + 3.5);
    coinGfx.lineStyle(1.5, 0xFEBF07, 1);
    coinGfx.strokeCircle(circleXPos, circleYPos, circleR + 1.5);
    coinGfx.lineStyle(1.5, 0x000000, 0.9);
    coinGfx.strokeCircle(circleXPos, circleYPos, circleR);
    coinGfx.fillStyle(0x12121e, 1);
    coinGfx.fillCircle(circleXPos, circleYPos, circleR);
    container.add(coinGfx);

    if (isClaimed) {
        if (scene.textures.exists('ui_ok_md')) {
            container.add(scene.add.image(circleXPos, circleYPos + 2, 'ui_ok_md').setDisplaySize(28, 28));
        }
    } else {
        if (scene.textures.exists('ui_coin_md')) {
            container.add(scene.add.image(circleXPos, circleYPos - 4, 'ui_coin_md').setDisplaySize(23, 23));
        }
        container.add(scene.add.text(circleXPos, circleYPos + 9, formatReward(coll.reward.coins), {
            fontFamily: UI.FONT_STROKE, fontSize: '10px', color: '#f5c842',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5));
    }

    // === NAV ARROWS ===
    const arrowOffX = port ? 26 : 28;
    createArrowImg(scene, container, px - POPUP_W / 2 - arrowOffX, py, 'ui_arrow_l', () => onNav(-1));
    createArrowImg(scene, container, px + POPUP_W / 2 + arrowOffX, py, 'ui_arrow_r', () => onNav(1));

    // === STATUS BUTTON ===
    const gridTopOffset = 122;
    const claimY = top + 102;

    if (isClaimed) {
        const claimedBtn = new Button(scene, px, claimY, 112, 32,
            '\u2713 ' + t('col_claimed'), 0x8a7530, () => {});
        claimedBtn.setAlpha(0.7);
        container.add(claimedBtn);
    } else if (isClaimable) {
        const claimBtn = new Button(scene, px, claimY, 112, 32,
            t('col_claim'), 0x78C828, () => onClaim(coll.id));
        addShineEffect(scene, claimBtn, 112, 30, 15);
        container.add(claimBtn);
    } else {
        const progressBtn = new Button(scene, px, claimY, 112, 32,
            t('col_in_progress'), 0x2a5a1a, () => {});
        progressBtn.setAlpha(0.5);
        container.add(progressBtn);
    }

    // === PET GRID ===
    const collPets = coll.petIds
        .map(pid => PETS.find(p => p.id === pid))
        .filter((p): p is NonNullable<typeof p> => p !== undefined)
        .sort((a, b) => a.chance - b.chance);

    const gridAbsTop = top + gridTopOffset;
    const gridAbsBot = top + POPUP_H - 10;
    const gridH = gridAbsBot - gridAbsTop;

    const maskGfx = scene.make.graphics({});
    maskGfx.fillRect(px - POPUP_W / 2 + 10, gridAbsTop, POPUP_W - 20, gridH);
    const gridContainer = scene.add.container(0, 0);
    gridContainer.setMask(maskGfx.createGeometryMask());
    container.add(gridContainer);

    const gridW = PET_COLS * PET_CARD_SX;
    const startX = px - gridW / 2 + PET_CARD_SX / 2;

    const rows = Math.ceil(collPets.length / PET_COLS);
    const gridStartY = gridAbsTop + PET_CARD_SY / 2 + 8;

    collPets.forEach((pet, i) => {
        const col = i % PET_COLS;
        const row = Math.floor(i / PET_COLS);
        const x = startX + col * PET_CARD_SX;
        const y = gridStartY + row * PET_CARD_SY;
        const found = playerCollection.has(pet.id);
        const card = new PetCard(scene, x, y, pet, found, found && unseenIds.has(pet.id));
        gridContainer.add(card);
    });

    const scrollContentH = PET_CARD_SY / 2 + 8 + rows * PET_CARD_SY;
    const maxScroll = Math.max(0, scrollContentH - gridH);
    let scrollOffset = 0;

    function clampScroll() {
        scrollOffset = Phaser.Math.Clamp(scrollOffset, 0, maxScroll);
        gridContainer.y = -scrollOffset;
    }

    const wheelHandler = (_p: Phaser.Input.Pointer, _go: GameObjects.GameObject[], _dx: number, dy: number) => {
        scrollOffset += dy * 0.5; clampScroll();
    };
    let dragY = 0;
    let startOff = 0;
    const downHandler = (p: Phaser.Input.Pointer) => {
        if (p.y > gridAbsTop && p.y < gridAbsBot) { dragY = p.y; startOff = scrollOffset; }
    };
    const moveHandler = (p: Phaser.Input.Pointer) => {
        if (p.isDown && dragY > 0) { scrollOffset = startOff - (p.y - dragY); clampScroll(); }
    };
    const upHandler = () => { dragY = 0; };

    scene.input.on('wheel', wheelHandler);
    scene.input.on('pointerdown', downHandler);
    scene.input.on('pointermove', moveHandler);
    scene.input.on('pointerup', upHandler);

    return {
        cleanup: () => {
            scene.input.off('wheel', wheelHandler);
            scene.input.off('pointerdown', downHandler);
            scene.input.off('pointermove', moveHandler);
            scene.input.off('pointerup', upHandler);
            maskGfx.destroy();
        },
    };
}

function createArrowImg(
    scene: Scene, container: GameObjects.Container,
    x: number, y: number, textureKey: string, onClick: () => void,
): void {
    const arrow = scene.add.image(x, y, textureKey);
    arrow.setInteractive({ useHandCursor: true });
    arrow.on('pointerdown', onClick);
    addButtonFeedback(scene, arrow, { clickScale: 0.85 });
    container.add(arrow);
}
