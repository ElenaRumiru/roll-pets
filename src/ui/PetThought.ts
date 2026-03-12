import { GameObjects, Scene } from 'phaser';
import { UI, THOUGHT_BUBBLE_CONFIG } from '../core/config';
import { getLayout } from '../core/layout';
import { t } from '../data/locales';
import { fitText } from './components/fitText';
import { addButtonFeedback } from './components/buttonFeedback';
import { addShineEffect } from './components/shineEffect';

type BubbleSide = 'right' | 'left';
type BubblePhase = 'counting' | 'ready' | 'cooldown';

const REGISTRY_KEY = 'petThoughtState';

// Cloud center offset from image center (tail takes bottom ~28%)
const CLOUD_OFF_R = { cx: 4,  cy: -14 };
const CLOUD_OFF_L = { cx: -4, cy: -14 };
const CONTENT_W = 90;
const ICON_SZ = 50;

// Claim button
const BTN_W = 72;
const BTN_H = 24;
const BTN_R = BTN_H / 2;
const CLAIM_COLOR = 0x78C828;
const CLAIM_DARK  = 0x4E8A18;

interface ThoughtState {
    phase: BubblePhase;
    timer: number;
    side: BubbleSide;
    savedAt: number;
}

export class PetThought extends GameObjects.Container {
    private phase: BubblePhase = 'cooldown';
    private side: BubbleSide = 'right';
    private timer: number;
    private bubbleImg: GameObjects.Image;
    private icon: GameObjects.Image;
    private timerText: GameObjects.Text;
    private claimBtn: GameObjects.Container;
    private claimCb: () => void;
    private hasPets = false;
    private reg: Phaser.Data.DataManager;

    constructor(scene: Scene, onClaim: () => void) {
        const l = getLayout();
        super(scene, l.thoughtRight.x, l.thoughtRight.y);
        this.claimCb = onClaim;
        this.timer = THOUGHT_BUBBLE_CONFIG.initialDelayMs;
        this.reg = scene.game.registry;

        this.restoreState();

        this.bubbleImg = scene.add.image(0, 0, 'ui_dialog_right');
        this.add(this.bubbleImg);

        const off = CLOUD_OFF_R;
        this.icon = scene.add.image(off.cx, off.cy - 25, 'luck_x100_lg')
            .setDisplaySize(ICON_SZ, ICON_SZ);
        this.add(this.icon);

        this.timerText = scene.add.text(off.cx, off.cy + 13, '', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '15px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        this.add(this.timerText);

        this.claimBtn = this.buildClaimBtn(scene, off.cx, off.cy + 12);
        this.claimBtn.setVisible(false);
        this.add(this.claimBtn);

        // Restore visual state
        if (this.phase === 'counting' || this.phase === 'ready') {
            this.applyPosition();
            this.setAlpha(1);
            if (this.phase === 'ready') {
                this.timerText.setVisible(false);
                this.claimBtn.setVisible(true);
            }
        } else {
            this.setAlpha(0);
        }

        scene.add.existing(this as unknown as GameObjects.GameObject);
        scene.events.on('shutdown', () => this.saveState());
    }

    setHasPets(has: boolean): void {
        this.hasPets = has;
    }

    tick(deltaMs: number): void {
        if (!this.hasPets) return;

        this.timer -= deltaMs;

        if (this.phase === 'cooldown') {
            if (this.timer <= 0) {
                this.phase = 'counting';
                this.timer = THOUGHT_BUBBLE_CONFIG.timerMs;
                this.applyPosition();
                this.fadeIn();
            }
            return;
        }

        if (this.phase === 'counting') {
            if (this.timer <= 0) {
                this.phase = 'ready';
                this.timerText.setVisible(false);
                this.claimBtn.setVisible(true);
            } else {
                this.updateTimerText();
            }
        }
    }

    onClaimed(): void {
        this.phase = 'cooldown';
        this.timer = THOUGHT_BUBBLE_CONFIG.cooldownMs;
        this.claimBtn.setVisible(false);
        this.timerText.setVisible(true);
        this.timerText.setText('');
        this.fadeOut();
        this.side = this.side === 'right' ? 'left' : 'right';
    }

    private saveState(): void {
        const state: ThoughtState = {
            phase: this.phase,
            timer: this.timer,
            side: this.side,
            savedAt: Date.now(),
        };
        this.reg.set(REGISTRY_KEY, state);
    }

    private restoreState(): void {
        const saved = this.reg.get(REGISTRY_KEY) as ThoughtState | undefined;
        if (!saved) return;

        const elapsed = Date.now() - saved.savedAt;
        this.phase = saved.phase;
        this.side = saved.side;
        this.timer = saved.timer - elapsed;
    }

    private applyPosition(): void {
        const l = getLayout();
        const pos = this.side === 'right' ? l.thoughtRight : l.thoughtLeft;
        this.setPosition(pos.x, pos.y);

        const texKey = this.side === 'right' ? 'ui_dialog_right' : 'ui_dialog_left';
        this.bubbleImg.setTexture(texKey);

        const off = this.side === 'right' ? CLOUD_OFF_R : CLOUD_OFF_L;
        this.icon.setPosition(off.cx, off.cy - 25);
        this.timerText.setPosition(off.cx, off.cy + 13);
        this.claimBtn.setPosition(off.cx, off.cy + 12);
    }

    private updateTimerText(): void {
        const totalSec = Math.ceil(this.timer / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        const timeStr = min > 0
            ? `${min}m ${String(sec).padStart(2, '0')}s`
            : `${sec}s`;
        this.timerText.setText(`in ${timeStr}`);
        fitText(this.timerText, CONTENT_W, 15);
    }

    private fadeIn(): void {
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 400,
            ease: 'Quad.easeOut',
        });
    }

    private fadeOut(): void {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeIn',
        });
    }

    private buildClaimBtn(scene: Scene, cx: number, cy: number): GameObjects.Container {
        const wrap = scene.add.container(cx, cy);

        const g = scene.add.graphics();
        g.fillStyle(CLAIM_DARK, 1);
        g.fillRoundedRect(-BTN_W / 2, -BTN_H / 2 + 2, BTN_W, BTN_H, BTN_R);
        g.fillStyle(CLAIM_COLOR, 1);
        g.fillRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H - 2, BTN_R);
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(-BTN_W / 2 + 3, -BTN_H / 2 + 1, BTN_W - 6, (BTN_H - 2) * 0.4,
            { tl: BTN_R - 1, tr: BTN_R - 1, bl: 0, br: 0 });
        wrap.add(g);

        const label = scene.add.text(0, -1, t('thought_claim'), {
            fontFamily: UI.FONT_STROKE,
            fontSize: '12px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5);
        fitText(label, BTN_W - 8, 12);
        wrap.add(label);

        wrap.setSize(BTN_W, BTN_H);
        addShineEffect(scene, wrap, BTN_W, BTN_H, BTN_R);
        wrap.setInteractive({ useHandCursor: true });
        wrap.on('pointerdown', () => this.claimCb());
        addButtonFeedback(scene, wrap);

        return wrap;
    }
}
