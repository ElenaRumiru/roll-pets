import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRADE_ORDER, GRADE, getGradeForChance, UI } from '../core/config';
import { PETS, TOTAL_PETS, getPetsByGrade } from '../data/pets';
import { PetCard } from './PetCard';
import { Dropdown, DropdownOption } from './components/Dropdown';
import { t } from '../data/locales';
import { Grade } from '../types';

const FILTER_Y = 95; // same height as tabs
const GRID_TOP = 118;
const GRID_H = GAME_HEIGHT - GRID_TOP;
const COLS = 8;
const CARD_SX = 123;
const CARD_SY = 138;
const DROPDOWN_W = 128;

export interface AllTabResult {
    dropdown: Dropdown;
    cleanup: () => void;
}

export function buildAllTab(
    scene: Scene,
    container: GameObjects.Container,
    collection: Set<string>,
    newPetIds: Set<string>,
): AllTabResult {
    let scrollOffset = 0;
    let maxScroll = 0;
    let gridContainer: GameObjects.Container;

    const maskGfx = scene.make.graphics({});
    maskGfx.fillRect(0, GRID_TOP, GAME_WIDTH, GRID_H);

    gridContainer = scene.add.container(0, 0);
    gridContainer.setMask(maskGfx.createGeometryMask());
    container.add(gridContainer);

    // Dropdown options — grade name only, no counts
    const options: DropdownOption[] = [
        { value: 'all', label: t('filter_all') },
    ];
    for (const g of GRADE_ORDER) {
        options.push({ value: g, label: t(`grade_${g}`), color: GRADE[g].color });
    }

    // Position: far right with generous margin so dropdown list doesn't clip offscreen
    // Keep dropdown at scene level (not nested in container) to avoid interaction issues
    const dropdownX = GAME_WIDTH - DROPDOWN_W - 8;
    const dropdown = new Dropdown(scene, dropdownX, FILTER_Y - 15, DROPDOWN_W, options, 'all', (val) => {
        scrollOffset = 0;
        buildGrid(val as Grade | 'all');
    });
    dropdown.setDepth(50);

    // Grade label left of dropdown, same vertical center
    const gradeLabel = scene.add.text(dropdownX - 8, FILTER_Y, t('col_grade_filter') + ':', {
        fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#aaaaaa',
        stroke: '#000000', strokeThickness: 1,
    }).setOrigin(1, 0.5);
    container.add(gradeLabel);

    function buildGrid(filter: Grade | 'all') {
        gridContainer.removeAll(true);
        const pets = filter === 'all' ? PETS : PETS.filter(p => getGradeForChance(p.chance) === filter);
        const gridW = COLS * CARD_SX;
        const startX = GAME_WIDTH / 2 - gridW / 2 + CARD_SX / 2;

        pets.forEach((pet, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = startX + col * CARD_SX;
            const y = GRID_TOP + CARD_SY / 2 + 10 + row * CARD_SY;
            const found = collection.has(pet.id);
            const card = new PetCard(scene, x, y, pet, found, found && newPetIds.has(pet.id));
            gridContainer.add(card);
        });

        const rows = Math.ceil(pets.length / COLS);
        maxScroll = Math.max(0, (CARD_SY / 2 + 10 + rows * CARD_SY) - GRID_H);
        gridContainer.y = -scrollOffset;
    }

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

    buildGrid('all');

    return {
        dropdown,
        cleanup: () => {
            scene.input.off('wheel', wheelHandler);
            scene.input.off('pointerdown', downHandler);
            scene.input.off('pointermove', moveHandler);
            scene.input.off('pointerup', upHandler);
            maskGfx.destroy();
            dropdown.destroy();
        },
    };
}
