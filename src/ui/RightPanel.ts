import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH, UI, ROLL_BTN } from '../core/config';
import { Button } from './components/Button';
import { t } from '../data/locales';

const BUFF_COLORS = {
    luck:     0xd4a017,
    x2xp:     0x8e44ad,
    autoroll: 0x2980b9,
};

export class RightPanel extends GameObjects.Container {
    private rollBtn: Button;
    private buffX2Btn: Button;
    private buffAutoBtn: Button;
    private buffLuckBtn: Button;
    private buffTimerTexts: GameObjects.Text[] = [];
    private spaceHint: GameObjects.Text;

    constructor(
        scene: Scene,
        onRoll: () => void,
        onBuff: (type: string) => void,
    ) {
        super(scene, 0, 0);

        // --- BUFF BUTTONS (right side, vertically stacked) ---
        const buffX = GAME_WIDTH - 84;
        const buffY = 155;
        const buffW = 150;
        const buffH = 40;
        const buffGap = 56;

        this.buffLuckBtn = new Button(
            scene, buffX, buffY, buffW, buffH,
            'x2 Luck Roll!', BUFF_COLORS.luck, () => onBuff('luck'),
        );
        this.add(this.buffLuckBtn);
        this.addAdsBadge(scene, buffX + buffW / 2 - 10, buffY - buffH / 2 - 5);

        this.buffX2Btn = new Button(
            scene, buffX, buffY + buffGap, buffW, buffH,
            'SUPER Roll', BUFF_COLORS.x2xp, () => onBuff('x2xp'),
        );
        this.add(this.buffX2Btn);
        this.addAdsBadge(scene, buffX + buffW / 2 - 10, buffY + buffGap - buffH / 2 - 5);

        this.buffAutoBtn = new Button(
            scene, buffX, buffY + buffGap * 2, buffW, buffH,
            'Autoroll 1 min!', BUFF_COLORS.autoroll, () => onBuff('autoroll'),
        );
        this.add(this.buffAutoBtn);
        this.addAdsBadge(scene, buffX + buffW / 2 - 10, buffY + buffGap * 2 - buffH / 2 - 5);

        // Timer labels under each buff
        [buffY, buffY + buffGap, buffY + buffGap * 2].forEach((y) => {
            const txt = scene.add.text(buffX, y + 27, '', {
                fontFamily: UI.FONT_BODY,
                fontSize: '10px',
                color: '#66ffcc',
                stroke: '#000000',
                strokeThickness: UI.STROKE_THIN,
            }).setOrigin(0.5);
            this.buffTimerTexts.push(txt);
            this.add(txt);
        });

        // --- ROLL BUTTON (bottom center, large and prominent) ---
        this.rollBtn = new Button(
            scene,
            ROLL_BTN.x,
            ROLL_BTN.y,
            ROLL_BTN.width, ROLL_BTN.height,
            t('roll_button'),
            UI.PRIMARY_GREEN,
            onRoll,
        );
        this.add(this.rollBtn);

        // Space hint
        this.spaceHint = scene.add.text(ROLL_BTN.x, ROLL_BTN.y + 36, 'SPACE', {
            fontFamily: UI.FONT_BODY,
            fontSize: '10px',
            color: '#666666',
        }).setOrigin(0.5);
        this.add(this.spaceHint);

        scene.add.existing(this);
    }

    private addAdsBadge(scene: Scene, x: number, y: number): void {
        const badge = scene.add.graphics();
        badge.fillStyle(0xcc0000, 1);
        badge.fillRoundedRect(x - 16, y - 8, 32, 16, 5);
        this.add(badge);

        const txt = scene.add.text(x, y, t('ads_badge'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '9px',
            color: '#ffffff',
        }).setOrigin(0.5);
        this.add(txt);
    }

    setRolling(rolling: boolean): void {
        this.rollBtn.setEnabled(!rolling);
        this.rollBtn.setText(rolling ? t('rolling') : t('roll_button'));
    }

    updateBuffTimers(x2xp: number, autoroll: number, luck: number): void {
        this.buffTimerTexts[0].setText(luck > 0 ? this.formatTime(luck) : '');
        this.buffTimerTexts[1].setText(x2xp > 0 ? this.formatTime(x2xp) : '');
        this.buffTimerTexts[2].setText(autoroll > 0 ? this.formatTime(autoroll) : '');
    }

    private formatTime(ms: number): string {
        const s = Math.ceil(ms / 1000);
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }
}
