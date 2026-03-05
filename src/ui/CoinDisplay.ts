import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH, COIN_HUD, UI, THEME } from '../core/config';

const HUD_X = GAME_WIDTH - 49 - 21 - COIN_HUD.gap - COIN_HUD.w;
const HUD_Y = 15;
const TEXT_LEFT = COIN_HUD.iconSize * 0.6 + 2;
const TEXT_CENTER_X = TEXT_LEFT + (COIN_HUD.w - TEXT_LEFT) / 2;

export class CoinDisplay extends GameObjects.Container {
    private label: GameObjects.Text;

    constructor(scene: Scene) {
        super(scene, HUD_X, HUD_Y);

        const bg = scene.add.graphics();
        bg.fillStyle(THEME.PANEL_BG, THEME.PANEL_ALPHA);
        bg.fillRoundedRect(0, 0, COIN_HUD.w, COIN_HUD.h, COIN_HUD.h / 2);
        bg.lineStyle(2, 0x000000, 0.7);
        bg.strokeRoundedRect(0, 0, COIN_HUD.w, COIN_HUD.h, COIN_HUD.h / 2);
        this.add(bg);

        const icon = scene.add.image(
            COIN_HUD.iconSize * 0.28,
            COIN_HUD.h / 2,
            'ui_coin_md',
        ).setDisplaySize(COIN_HUD.iconSize, COIN_HUD.iconSize);
        this.add(icon);

        this.label = scene.add.text(TEXT_CENTER_X, COIN_HUD.h / 2, '0', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '15px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5, 0.5);
        this.add(this.label);

        scene.add.existing(this);
    }

    updateCoins(amount: number): void {
        this.label.setText(this.formatNumber(amount));
    }

    showFloatingGain(amount: number, scene: Scene): void {
        if (amount <= 0) return;
        const icon = scene.add.image(0, 0, 'ui_coin_sm').setDisplaySize(15, 15);
        const txt = scene.add.text(11, 0, `+${this.formatNumber(amount)}`, {
            fontFamily: UI.FONT_STROKE,
            fontSize: '14px',
            color: '#ffc107',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0, 0.5);

        const container = scene.add.container(
            HUD_X + COIN_HUD.w / 2,
            HUD_Y + COIN_HUD.h + 2,
            [icon, txt],
        ).setDepth(this.depth + 1);

        scene.tweens.add({
            targets: container,
            y: container.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => container.destroy(),
        });
    }

    private formatNumber(n: number): string {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
        return n.toLocaleString('en-US');
    }
}
