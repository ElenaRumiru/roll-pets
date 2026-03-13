import { Scene, GameObjects } from 'phaser';
import { UI, GRADE, getGradeForChance, getOddsString } from '../core/config';
import { getGameWidth } from '../core/orientation';
import { PETS } from '../data/pets';
import { Button } from './components/Button';
import { fitText } from './components/fitText';
import { t } from '../data/locales';
import { ShopOffer, PetDef } from '../types';
import { formatCoins } from '../core/formatCoins';

const CARD_W = 141;
const CARD_H = 160;
const CARD_GAP = 17;

export function buildPetCards(
    scene: Scene,
    container: GameObjects.Container,
    offers: ShopOffer[],
    coins: number,
    cardsY: number,
    buyBtnY: number,
    onBuy: (petId: string, canAfford: boolean) => void,
    cols?: number,
): void {
    container.removeAll(true);
    if (offers.length === 0) return;
    const gw = getGameWidth();

    if (cols && cols < offers.length) {
        // Multi-row layout (portrait)
        const rowGap = 25;
        const rowH = CARD_H + 8 + 47; // card + gap + btn
        for (let i = 0; i < offers.length; i++) {
            const row = Math.floor(i / cols);
            const colIdx = i % cols;
            const rowCount = Math.min(cols, offers.length - row * cols);
            const rowW = rowCount * CARD_W + (rowCount - 1) * CARD_GAP;
            const rowStartX = gw / 2 - rowW / 2 + CARD_W / 2;
            const x = rowStartX + colIdx * (CARD_W + CARD_GAP);
            const cy = cardsY + row * (rowH + rowGap);
            const by = cy + CARD_H / 2 + 8 + 47 / 2;
            const pet = PETS.find(p => p.id === offers[i].petId);
            if (!pet) continue;
            createOfferCard(scene, container, x, cy, by, offers[i], pet, coins, onBuy);
        }
    } else {
        // Single-row layout (landscape)
        const totalW = offers.length * CARD_W + (offers.length - 1) * CARD_GAP;
        const startX = gw / 2 - totalW / 2 + CARD_W / 2;
        offers.forEach((offer, i) => {
            const pet = PETS.find(p => p.id === offer.petId);
            if (!pet) return;
            const x = startX + i * (CARD_W + CARD_GAP);
            createOfferCard(scene, container, x, cardsY, buyBtnY, offer, pet, coins, onBuy);
        });
    }
}

function createOfferCard(
    scene: Scene, container: GameObjects.Container,
    x: number, cardsY: number, buyBtnY: number,
    offer: ShopOffer, pet: PetDef, coins: number,
    onBuy: (petId: string, canAfford: boolean) => void,
): void {
    const cfg = GRADE[getGradeForChance(pet.chance)];
    const r = 15;
    const c = scene.add.container(x, cardsY);

    const bg = scene.add.graphics();
    bg.fillStyle(0x2a2a3e, 1);
    bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
    bg.lineStyle(1.5, 0x000000, 0.9);
    bg.strokeRoundedRect(-CARD_W / 2 - 4, -CARD_H / 2 - 4, CARD_W + 8, CARD_H + 8, r + 3);
    bg.lineStyle(3, cfg.color, 1);
    bg.strokeRoundedRect(-CARD_W / 2 - 2, -CARD_H / 2 - 2, CARD_W + 4, CARD_H + 4, r + 2);
    bg.lineStyle(1.5, 0x000000, 0.9);
    bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, r);
    bg.fillStyle(cfg.color, 0.1);
    bg.fillRoundedRect(-CARD_W / 2 + 1, -CARD_H / 2 + 1, CARD_W - 2, CARD_H * 0.35,
        { tl: r - 1, tr: r - 1, bl: 0, br: 0 });
    c.add(bg);

    c.add(scene.add.image(0, -20, pet.imageKey).setScale(0.47));

    const name = scene.add.text(0, CARD_H / 2 - 37, t('pet_' + pet.id), {
        fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    fitText(name, CARD_W - 10, 17);
    c.add(name);

    c.add(scene.add.text(0, CARD_H / 2 - 17, getOddsString(pet.chance), {
        fontFamily: UI.FONT_MAIN, fontSize: '14px', color: cfg.colorHex,
    }).setOrigin(0.5));

    container.add(c);

    const canAfford = coins >= offer.price;
    const btnColor = canAfford ? 0x27ae60 : 0x555566;
    const priceStr = formatCoins(offer.price);
    const btn = new Button(scene, x, buyBtnY, 148, 47,
        priceStr, btnColor, () => onBuy(offer.petId, canAfford));

    const label = btn.list[2] as GameObjects.Text;
    const textW = label.width;
    const iconSize = 20, gap = 4;
    const groupW = iconSize + gap + textW;
    const iconX = -groupW / 2 + iconSize / 2;
    label.setX(iconX + iconSize / 2 + gap + textW / 2).setY(-3);
    btn.add(scene.add.image(iconX, -3, 'ui_coin_md').setDisplaySize(iconSize, iconSize));
    if (!canAfford) btn.setEnabled(false);
    container.add(btn);
}
