import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI } from '../core/config';
import { CollectionTracker } from '../systems/CollectionTracker';
import { CollectionCard, COL_CARD_W, COL_CARD_H } from './CollectionCard';
import { t } from '../data/locales';

const GRID_TOP = 118;
const GRID_H = GAME_HEIGHT - GRID_TOP;
const COLS = 5;
const GAP_X = 12;
const GAP_Y = 12;
const CARD_SX = COL_CARD_W + GAP_X;
const CARD_SY = COL_CARD_H + GAP_Y;

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
    const discovered = tracker.getDiscoveredSorted(playerCollection);
    let scrollOffset = 0;

    if (discovered.length === 0) {
        const hint = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, t('col_hint_empty'), {
            fontFamily: UI.FONT_BODY, fontSize: '18px', color: '#777777',
            wordWrap: { width: 400 }, align: 'center',
        }).setOrigin(0.5);
        container.add(hint);
        return { maxScroll: 0, cleanup: () => {} };
    }

    const maskGfx = scene.make.graphics({});
    maskGfx.fillRect(0, GRID_TOP, GAME_WIDTH, GRID_H);

    const gridContainer = scene.add.container(0, 0);
    gridContainer.setMask(maskGfx.createGeometryMask());
    container.add(gridContainer);

    const totalW = COLS * COL_CARD_W + (COLS - 1) * GAP_X;
    const startX = (GAME_WIDTH - totalW) / 2 + COL_CARD_W / 2;

    discovered.forEach((coll, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = startX + col * CARD_SX;
        const y = GRID_TOP + 16 + COL_CARD_H / 2 + row * CARD_SY;
        const progress = tracker.getProgressById(coll.id, playerCollection);
        const isClaimed = tracker.isClaimed(coll.id);
        const isClaimable = !isClaimed && progress.current === progress.total;
        const hasUnseen = tracker.getUnseenCount(coll.id, playerCollection) > 0;

        const card = new CollectionCard(scene, x, y, coll, progress, isClaimed, isClaimable, hasUnseen, isClaimable ? 1 : 0, () => {
            onCardClick(coll.id);
        });
        gridContainer.add(card);
    });

    const rows = Math.ceil(discovered.length / COLS);
    const contentH = 16 + rows * CARD_SY;
    const maxScroll = Math.max(0, contentH - GRID_H);

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
