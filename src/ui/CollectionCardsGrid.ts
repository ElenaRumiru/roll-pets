import { Scene, GameObjects } from 'phaser';
import { UI } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait } from '../core/orientation';
import { CollectionTracker } from '../systems/CollectionTracker';
import { CollectionCard, COL_CARD_W, COL_CARD_H } from './CollectionCard';
import { t } from '../data/locales';

const GRID_TOP = 118;

export interface CardsGridResult {
    maxScroll: number;
    cleanup: () => void;
}

export function buildCollectionCards(
    scene: Scene,
    container: GameObjects.Container,
    tracker: CollectionTracker,
    playerCollection: Set<string>,
    onCardClick: (collId: string) => void,
): CardsGridResult {
    const gw = getGameWidth();
    const gh = getGameHeight();
    const gridH = gh - GRID_TOP;
    const port = isPortrait();

    const cols = port ? 3 : 5;
    const cardW = port ? 160 : COL_CARD_W;
    const cardH = port ? 192 : COL_CARD_H;
    const gapX = port ? 10 : 12;
    const gapY = port ? 10 : 12;
    const cardSX = cardW + gapX;
    const cardSY = cardH + gapY;

    const discovered = tracker.getDiscoveredSorted(playerCollection);
    let scrollOffset = 0;

    if (discovered.length === 0) {
        const hint = scene.add.text(gw / 2, gh / 2 - 20, t('col_hint_empty'), {
            fontFamily: UI.FONT_BODY, fontSize: '18px', color: '#777777',
            wordWrap: { width: 400 }, align: 'center',
        }).setOrigin(0.5);
        container.add(hint);
        return { maxScroll: 0, cleanup: () => {} };
    }

    const maskGfx = scene.make.graphics({});
    maskGfx.fillRect(0, GRID_TOP, gw, gridH);

    const gridContainer = scene.add.container(0, 0);
    gridContainer.setMask(maskGfx.createGeometryMask());
    container.add(gridContainer);

    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = (gw - totalW) / 2 + cardW / 2;

    const cardOpts = port ? { cardW, cardH } : undefined;

    discovered.forEach((coll, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * cardSX;
        const y = GRID_TOP + 16 + cardH / 2 + row * cardSY;
        const progress = tracker.getProgressById(coll.id, playerCollection);
        const isClaimed = tracker.isClaimed(coll.id);
        const isClaimable = !isClaimed && progress.current === progress.total;
        const hasUnseen = tracker.getUnseenCount(coll.id, playerCollection) > 0;

        const card = new CollectionCard(scene, x, y, coll, progress, isClaimed, isClaimable, hasUnseen, isClaimable ? 1 : 0, () => {
            onCardClick(coll.id);
        }, cardOpts);
        gridContainer.add(card);
    });

    const rows = Math.ceil(discovered.length / cols);
    const contentH = 16 + rows * cardSY;
    const maxScroll = Math.max(0, contentH - gridH);

    function clampScroll() {
        scrollOffset = Phaser.Math.Clamp(scrollOffset, 0, maxScroll);
        gridContainer.y = -scrollOffset;
    }

    const wheelHandler = (_p: Phaser.Input.Pointer, _go: GameObjects.GameObject[], _dx: number, dy: number) => {
        scrollOffset += dy * 0.5;
        clampScroll();
    };
    let dragY = 0;
    let startOff = 0;
    const downHandler = (p: Phaser.Input.Pointer) => {
        if (p.y > GRID_TOP) { dragY = p.y; startOff = scrollOffset; }
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
        maxScroll,
        cleanup: () => {
            scene.input.off('wheel', wheelHandler);
            scene.input.off('pointerdown', downHandler);
            scene.input.off('pointermove', moveHandler);
            scene.input.off('pointerup', upHandler);
            maskGfx.destroy();
        },
    };
}
