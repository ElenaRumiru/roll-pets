import { Scene, GameObjects } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI } from '../core/config';
import { GameManager } from '../core/GameManager';
import { Button } from '../ui/components/Button';
import { t } from '../data/locales';
import { addButtonFeedback } from '../ui/components/buttonFeedback';
import { createCardGrid, createMilestoneTrack, CARD_H, CARD_GAP } from '../ui/DailyBonusCards';

const HEADER_H = 74;
const TRACK_Y = 110;
const GRID_TOP = 200;
const DAY7_H = CARD_H * 2 + CARD_GAP;
const HINT_Y = GRID_TOP + DAY7_H + 22;
const CLAIM_Y = HINT_Y + 46;
const FREE_CLR = 0x78C828;
const FREE_DRK = 0x4E8A18;

export class DailyBonusScene extends Scene {
    private manager!: GameManager;
    private timerText!: GameObjects.Text;
    private timerElapsed = 0;

    constructor() { super('DailyBonusScene'); }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.timerElapsed = 0;
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);
        this.createHeader();
        createMilestoneTrack(this, TRACK_Y, this.manager);
        createCardGrid(this, GRID_TOP, this.manager.dailyBonus);
        this.add.text(GAME_WIDTH / 2, HINT_Y, t('daily_bonus_hint'), {
            fontFamily: UI.FONT_BODY, fontSize: '14px', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.createClaimButton();
        this.createTimer();
    }

    private createHeader(): void {
        const hdr = this.add.graphics();
        hdr.fillStyle(0x000000, 0.5);
        hdr.fillRect(0, 0, GAME_WIDTH, HEADER_H);
        hdr.lineStyle(1, UI.PANEL_BORDER, 0.3);
        hdr.lineBetween(0, HEADER_H, GAME_WIDTH, HEADER_H);
        new Button(this, 68, 37, 111, 39, `\u2190 ${t('daily_bonus_back')}`, 0x444455, () => {
            this.scene.start('MainScene');
        });
        this.add.text(GAME_WIDTH / 2, 37, t('daily_bonus_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '25px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
    }

    private createClaimButton(): void {
        const canClaim = !this.manager.dailyBonus.claimedToday;
        const label = canClaim ? t('daily_bonus_claim') : t('daily_bonus_claimed');
        const clr = canClaim ? FREE_CLR : 0x555566;
        const drk = canClaim ? FREE_DRK : 0x333344;
        const bw = 180, bh = 44, br = bh / 2;

        const wrap = this.add.container(GAME_WIDTH / 2, CLAIM_Y);
        const g = this.add.graphics();
        g.fillStyle(drk, 1);
        g.fillRoundedRect(-bw / 2, -bh / 2 + 2, bw, bh, br);
        g.fillStyle(clr, 1);
        g.fillRoundedRect(-bw / 2, -bh / 2, bw, bh - 2, br);
        if (canClaim) {
            g.fillStyle(0xffffff, 0.15);
            g.fillRoundedRect(-bw / 2 + 3, -bh / 2 + 1, bw - 6, (bh - 2) * 0.4,
                { tl: br - 1, tr: br - 1, bl: 0, br: 0 });
        }
        g.lineStyle(1, 0x000000, 0.2);
        g.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, br);
        wrap.add(g);

        const txt = this.add.text(0, -1, label, {
            fontFamily: UI.FONT_STROKE, fontSize: '18px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        wrap.add(txt);

        if (canClaim) {
            wrap.setSize(bw, bh + 2);
            wrap.setInteractive({ useHandCursor: true });
            wrap.on('pointerdown', () => {
                this.manager.claimDailyBonus();
                this.scene.restart();
            });
            addButtonFeedback(this, wrap);
        }
    }

    private createTimer(): void {
        this.timerText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '', {
            fontFamily: UI.FONT_BODY, fontSize: '16px', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.updateTimerText();
    }

    update(_time: number, delta: number): void {
        this.timerElapsed += delta;
        if (this.timerElapsed >= 1000) {
            this.timerElapsed -= 1000;
            this.updateTimerText();
        }
    }

    private updateTimerText(): void {
        const secs = this.manager.dailyBonus.getSecondsUntilReset();
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        this.timerText.setText(t('daily_bonus_timer', { time }));
    }
}
