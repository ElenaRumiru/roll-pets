import { Scene } from 'phaser';
import { UI } from '../core/config';
import { getGameWidth, isPortrait } from '../core/orientation';
import { Button } from './components/Button';
import { addButtonFeedback } from './components/buttonFeedback';
import { CoinDisplay } from './CoinDisplay';
import { t } from '../data/locales';

const HEADER_H = 74;
const TITLE_Y = 37;
const CLOSE_Y = 33;

export interface SceneHeaderConfig {
    scene: Scene;
    titleKey: string;
    backKey: string;
    onBack: () => void;
    coins?: number;
    depth?: number;
}

export interface SceneHeaderResult {
    headerHeight: number;
    coinDisplay: CoinDisplay;
}

export function createSceneHeader(cfg: SceneHeaderConfig): SceneHeaderResult {
    const { scene, titleKey, backKey, onBack, coins, depth } = cfg;
    const d = depth ?? 0;
    const gw = getGameWidth();
    const port = isPortrait();

    // Header background
    const hdr = scene.add.graphics();
    hdr.fillStyle(0x000000, 0.5);
    hdr.fillRect(0, 0, gw, HEADER_H);
    hdr.lineStyle(1, UI.PANEL_BORDER, 0.3);
    hdr.lineBetween(0, HEADER_H, gw, HEADER_H);
    hdr.setDepth(d);

    // Back button
    const btnW = port ? 95 : 111;
    const btnH = port ? 35 : 39;
    const backBtn = new Button(scene, port ? 58 : 68, TITLE_Y, btnW, btnH,
        `\u2190 ${t(backKey)}`, 0x444455, onBack);
    backBtn.setDepth(d);

    // Title
    scene.add.text(gw / 2, TITLE_Y, t(titleKey), {
        fontFamily: UI.FONT_STROKE, fontSize: port ? '22px' : '25px', color: '#ffffff',
        stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
    }).setOrigin(0.5).setDepth(d);

    // Coin display
    const coinDisplay = new CoinDisplay(scene);
    coinDisplay.setDepth(d);
    if (coins !== undefined) coinDisplay.updateCoins(coins);

    // ESC key → back (Poki requirement: ESC navigates back in sub-scenes)
    scene.input.keyboard?.on('keydown-ESC', onBack);

    // Close button (×)
    const closeX = gw - 38;
    const closeBtn = scene.add.text(closeX, CLOSE_Y, '\u2715', {
        fontFamily: UI.FONT_STROKE, fontSize: port ? '24px' : '28px', color: '#aaaaaa',
        stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
    }).setOrigin(0.5).setDepth(d);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', onBack);
    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#aaaaaa'));
    addButtonFeedback(scene, closeBtn);

    return { headerHeight: HEADER_H, coinDisplay };
}
