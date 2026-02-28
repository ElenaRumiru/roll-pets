import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI, REBIRTH_CONFIG } from '../core/config';
import { RebirthData } from '../types';
import { AudioSystem } from '../systems/AudioSystem';
import { Button } from './components/Button';
import { t } from '../data/locales';
import { fitText } from './components/fitText';

const CX = GAME_WIDTH / 2;
const CY = GAME_HEIGHT / 2;
const DEPTH = 500;

export class RebirthOverlay {
    private scene: Scene;
    private elements: GameObjects.GameObject[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
    }

    show(data: RebirthData, onClose: () => void): void {
        this.cleanup();

        const audio = this.scene.registry.get('audio') as AudioSystem | undefined;
        audio?.playSfx('sfx_levelup');

        const blocker = this.scene.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
            .setDepth(DEPTH).setInteractive();
        this.elements.push(blocker);

        const container = this.scene.add.container(CX, CY).setDepth(DEPTH + 1).setScale(0);
        this.elements.push(container);

        // Rebirth icon
        const iconY = -155;
        const icon = this.scene.add.image(0, iconY, 'ui_rebirth_md');
        const src = this.scene.textures.get('ui_rebirth_md').getSourceImage();
        const iconH = 100;
        const iconW = Math.round(iconH * src.width / src.height);
        icon.setDisplaySize(iconW, iconH);
        container.add(icon);

        // Title
        const titleY = iconY + iconH / 2 + 22;
        const title = this.scene.add.text(0, titleY, t('rebirth_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '30px',
            color: REBIRTH_CONFIG.colorHex, stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        fitText(title, 400, 30);
        container.add(title);

        // Subtitle
        const subY = titleY + 35;
        const subtitle = this.scene.add.text(0, subY, t('rebirth_subtitle'), {
            fontFamily: UI.FONT_STROKE, fontSize: '18px',
            color: '#ffffff', stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(subtitle, 380, 18);
        container.add(subtitle);

        // Multiplier
        const multY = subY + 34;
        const multText = t('rebirth_multiplier').replace('{n}', String(data.newMultiplier));
        const mult = this.scene.add.text(0, multY, multText, {
            fontFamily: UI.FONT_MAIN, fontSize: '36px',
            color: REBIRTH_CONFIG.colorHex, stroke: '#000000', strokeThickness: UI.STROKE_THICK,
        }).setOrigin(0.5);
        container.add(mult);

        // Description lines
        const descY = multY + 40;
        const resets = this.scene.add.text(0, descY, t('rebirth_resets'), {
            fontFamily: UI.FONT_BODY, fontSize: '14px',
            color: '#ff6666', stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        container.add(resets);

        const keeps = this.scene.add.text(0, descY + 22, t('rebirth_keeps'), {
            fontFamily: UI.FONT_BODY, fontSize: '14px',
            color: '#78C828', stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        container.add(keeps);

        // ACCEPT button
        const btnY = descY + 68;
        const btn = new Button(this.scene, 0, btnY, 180, 44, t('rebirth_accept'), 0x78C828, () => {
            this.close(onClose);
        });
        btn.setDepth(0);
        container.add(btn);

        this.scene.tweens.add({
            targets: container, scale: 1, duration: 300, ease: 'Back.easeOut',
        });
    }

    private close(onDone: () => void): void {
        this.scene.tweens.add({
            targets: this.elements,
            alpha: 0,
            duration: 250,
            onComplete: () => { this.cleanup(); onDone(); },
        });
    }

    cleanup(): void {
        for (const el of this.elements) el.destroy();
        this.elements = [];
    }
}
