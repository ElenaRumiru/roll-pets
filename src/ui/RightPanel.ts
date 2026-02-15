import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH, UI, ROLL_BTN, BUFF_CONFIG } from '../core/config';
import { Button } from './components/Button';
import { BuffBadges } from './BuffBadges';
import { BuffSystem } from '../systems/BuffSystem';
import { t } from '../data/locales';

export class RightPanel extends GameObjects.Container {
    private rollBtn: Button;
    private luckyBtn: Button;
    private superBtn: Button;
    private epicBtn: Button;
    private autoBtn: Button;
    private badges: BuffBadges;
    private spaceHint: GameObjects.Text;
    private epicBadgeBg: GameObjects.Graphics;
    private epicBadgeText: GameObjects.Text;
    private superTimerBg: GameObjects.Graphics;
    private superTimerText: GameObjects.Text;
    private tooltipBg: GameObjects.Graphics;
    private tooltipText: GameObjects.Text;
    private superVisible = false;
    private autorollActive = false;
    private autorollPaused = false;
    private epicPulseTimer = 0;
    private superPulseTimer = 0;

    private onRoll: () => void;
    private onStopAutoroll: () => void;
    private onResumeAutoroll: () => void;

    constructor(
        scene: Scene,
        onRoll: () => void,
        onBuff: (type: string) => void,
        onStopAutoroll: () => void,
        onResumeAutoroll: () => void,
    ) {
        super(scene, 0, 0);

        const buffX = GAME_WIDTH - 84;
        const buffW = 150;
        const buffH = 40;
        const buffGap = 52;
        const startY = 140;

        // Lucky Roll button — always visible (slot 0)
        this.luckyBtn = new Button(
            scene, buffX, startY, buffW, buffH,
            t('buff_lucky'), BUFF_CONFIG.lucky.color, () => onBuff('lucky'),
        );
        this.add(this.luckyBtn);
        this.addAdsBadge(scene, buffX + buffW / 2 - 10, startY - buffH / 2 - 5);

        // Epic Roll — free, timer-based (slot 1)
        this.epicBtn = new Button(
            scene, buffX, startY + buffGap, buffW, buffH,
            t('buff_epic'), BUFF_CONFIG.epic.color, () => onBuff('epic'),
        );
        this.epicBtn.setEnabled(false);
        this.add(this.epicBtn);

        // Gray timer badge (like ADS badge but gray, shows countdown)
        const epicBadgeX = buffX + buffW / 2 - 10;
        const epicBadgeY = startY + buffGap - buffH / 2 - 5;
        this.epicBadgeBg = scene.add.graphics();
        this.epicBadgeBg.fillStyle(0x666666, 1);
        this.epicBadgeBg.fillRoundedRect(epicBadgeX - 18, epicBadgeY - 8, 36, 16, 5);
        this.add(this.epicBadgeBg);

        this.epicBadgeText = scene.add.text(epicBadgeX, epicBadgeY, '', {
            fontFamily: UI.FONT_MAIN, fontSize: '9px', color: '#ffffff',
        }).setOrigin(0.5);
        this.add(this.epicBadgeText);

        // Autoroll button — always visible (slot 2)
        this.autoBtn = new Button(
            scene, buffX, startY + buffGap * 2, buffW, buffH,
            t('buff_autoroll'), BUFF_CONFIG.autoroll.color, () => onBuff('autoroll'),
        );
        this.add(this.autoBtn);
        this.addAdsBadge(scene, buffX + buffW / 2 - 10, startY + buffGap * 2 - buffH / 2 - 5);

        // Super Roll button — slides in below Auto Roll (slot 3)
        this.superBtn = new Button(
            scene, GAME_WIDTH + 100, startY + buffGap * 3, buffW, buffH,
            t('buff_super'), BUFF_CONFIG.super.color, () => onBuff('super'),
        );
        this.add(this.superBtn);
        this.addAdsBadgeToContainer(scene, this.superBtn, buffW / 2 - 10, -buffH / 2 - 5);

        // Offer timer plate below super button (child so it slides with it)
        this.superTimerBg = scene.add.graphics();
        this.superTimerBg.fillStyle(0x000000, 0.5);
        this.superTimerBg.fillRoundedRect(-30, buffH / 2 + 3, 60, 18, 6);
        this.superBtn.add(this.superTimerBg);

        this.superTimerText = scene.add.text(0, buffH / 2 + 12, '', {
            fontFamily: UI.FONT_MAIN, fontSize: '11px', color: '#ffc107',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        this.superBtn.add(this.superTimerText);

        // Store callbacks
        this.onRoll = onRoll;
        this.onStopAutoroll = onStopAutoroll;
        this.onResumeAutoroll = onResumeAutoroll;

        // Roll button — 3 states: ROLL / STOP / AUTO ROLL (resume)
        this.rollBtn = new Button(
            scene, ROLL_BTN.x, ROLL_BTN.y, ROLL_BTN.width, ROLL_BTN.height,
            t('roll_button'), UI.PRIMARY_GREEN, () => {
                if (this.autorollActive) {
                    this.onStopAutoroll();
                } else if (this.autorollPaused) {
                    this.onResumeAutoroll();
                } else {
                    this.onRoll();
                }
            },
        );
        this.add(this.rollBtn);

        // Space hint
        this.spaceHint = scene.add.text(ROLL_BTN.x, ROLL_BTN.y + 36, 'SPACE', {
            fontFamily: UI.FONT_BODY, fontSize: '10px', color: '#666666',
        }).setOrigin(0.5);
        this.add(this.spaceHint);

        // Buff badges above Roll button
        this.badges = new BuffBadges(scene, ROLL_BTN.x, ROLL_BTN.y - 40);
        this.add(this.badges);

        // Shared tooltip (hidden by default, high depth)
        this.tooltipBg = scene.add.graphics().setDepth(200);
        this.tooltipText = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_MAIN, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5).setDepth(200);
        this.tooltipBg.setVisible(false);
        this.tooltipText.setVisible(false);

        // Hover tooltips for each buff button
        this.addTooltip(this.luckyBtn, 'tip_lucky');
        this.addTooltip(this.epicBtn, 'tip_epic');
        this.addTooltip(this.autoBtn, 'tip_autoroll');
        this.addTooltip(this.superBtn, 'tip_super');

        scene.add.existing(this);
    }

    private addAdsBadge(scene: Scene, x: number, y: number): void {
        const badge = scene.add.graphics();
        badge.fillStyle(0xcc0000, 1);
        badge.fillRoundedRect(x - 16, y - 8, 32, 16, 5);
        this.add(badge);

        const txt = scene.add.text(x, y, t('ads_badge'), {
            fontFamily: UI.FONT_MAIN, fontSize: '9px', color: '#ffffff',
        }).setOrigin(0.5);
        this.add(txt);
    }

    /** Add ADS badge as child of a container (moves with it) */
    private addAdsBadgeToContainer(scene: Scene, container: GameObjects.Container, x: number, y: number): void {
        const badge = scene.add.graphics();
        badge.fillStyle(0xcc0000, 1);
        badge.fillRoundedRect(x - 16, y - 8, 32, 16, 5);
        container.add(badge);

        const txt = scene.add.text(x, y, t('ads_badge'), {
            fontFamily: UI.FONT_MAIN, fontSize: '9px', color: '#ffffff',
        }).setOrigin(0.5);
        container.add(txt);
    }

    setRolling(rolling: boolean): void {
        if (this.autorollActive) {
            this.rollBtn.setEnabled(true);
            this.rollBtn.setText(t('roll_stop'));
            this.rollBtn.setColor(0xe74c3c);
        } else if (this.autorollPaused) {
            this.rollBtn.setEnabled(true);
            this.rollBtn.setText(t('roll_auto'));
            this.rollBtn.setColor(BUFF_CONFIG.autoroll.color);
        } else if (rolling) {
            this.rollBtn.setEnabled(false);
            this.rollBtn.setText(t('rolling'));
        } else {
            this.rollBtn.setEnabled(true);
            this.rollBtn.setText(t('roll_button'));
            this.rollBtn.setColor(UI.PRIMARY_GREEN);
        }
    }

    updateBuffDisplay(buffs: BuffSystem): void {
        this.badges.updateFromBuffs(buffs);

        // Super slide in/out + offer timer
        if (buffs.isSuperOffered() && !this.superVisible) {
            this.slideInSuper();
        } else if (!buffs.isSuperOffered() && this.superVisible) {
            this.slideOutSuper();
        }

        if (this.superVisible) {
            const offerMs = buffs.getSuperOfferRemaining();
            const offerSecs = Math.ceil(offerMs / 1000);
            this.superTimerText.setText(`${offerSecs}s`);
            // Last 5 seconds: bigger text + red + pulse
            if (offerSecs <= 5) {
                this.superTimerText.setFontSize('14px').setColor('#ff4444');
                this.superPulseTimer += 16;
                if (this.superPulseTimer >= 2_000) {
                    this.superPulseTimer = 0;
                    this.pulseBtn(this.superBtn);
                }
            } else {
                this.superTimerText.setFontSize('11px').setColor('#ffc107');
                this.superPulseTimer = 0;
            }
        } else {
            this.superPulseTimer = 0;
        }

        // Epic timer badge: gray with countdown while ticking, hidden when ready
        const epicRemaining = buffs.getEpicTimerRemaining();
        const epicReady = epicRemaining <= 0;
        this.epicBtn.setEnabled(epicReady);
        if (epicReady) {
            this.epicBadgeBg.setVisible(false);
            this.epicBadgeText.setVisible(false);
            // Pulse every 3s while available
            this.epicPulseTimer += 16;
            if (this.epicPulseTimer >= 3_000) {
                this.epicPulseTimer = 0;
                this.pulseBtn(this.epicBtn);
            }
        } else {
            this.epicPulseTimer = 0;
            const epicSecs = Math.ceil(epicRemaining / 1000);
            this.epicBadgeBg.setVisible(true);
            this.epicBadgeText.setVisible(true);
            this.epicBadgeText.setText(`${epicSecs}s`);
        }

        // Autoroll state on Roll button
        const wasAuto = this.autorollActive;
        const wasPaused = this.autorollPaused;
        this.autorollActive = buffs.isAutorollActive();
        this.autorollPaused = buffs.isAutorollPaused();

        if (this.autorollActive && !wasAuto) {
            this.rollBtn.setText(t('roll_stop'));
            this.rollBtn.setColor(0xe74c3c);
            this.rollBtn.setEnabled(true);
        } else if (!this.autorollActive && wasAuto) {
            if (this.autorollPaused) {
                this.rollBtn.setText(t('roll_auto'));
                this.rollBtn.setColor(BUFF_CONFIG.autoroll.color);
                this.rollBtn.setEnabled(true);
            } else {
                this.rollBtn.setText(t('roll_button'));
                this.rollBtn.setColor(UI.PRIMARY_GREEN);
            }
        } else if (this.autorollPaused && !wasPaused) {
            this.rollBtn.setText(t('roll_auto'));
            this.rollBtn.setColor(BUFF_CONFIG.autoroll.color);
            this.rollBtn.setEnabled(true);
        } else if (!this.autorollPaused && wasPaused && !this.autorollActive) {
            this.rollBtn.setText(t('roll_button'));
            this.rollBtn.setColor(UI.PRIMARY_GREEN);
        }

    }

    pulseRollButton(): void {
        this.pulseBtn(this.rollBtn);
    }

    private pulseBtn(btn: GameObjects.Container): void {
        if (!this.scene) return;
        this.scene.tweens.add({
            targets: btn,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 150,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut',
        });
    }

    private addTooltip(btn: Button, localeKey: string): void {
        btn.on('pointerover', () => {
            const text = t(localeKey);
            this.tooltipText.setText(text);
            const pad = 8;
            const tw = this.tooltipText.width + pad * 2;
            const th = this.tooltipText.height + pad;
            const tx = btn.x - btn.width / 2 - tw / 2 - 6;
            const ty = btn.y;
            this.tooltipText.setPosition(tx, ty);
            this.tooltipBg.clear();
            this.tooltipBg.fillStyle(0x000000, 0.85);
            this.tooltipBg.fillRoundedRect(tx - tw / 2, ty - th / 2, tw, th, 6);
            this.tooltipBg.setVisible(true);
            this.tooltipText.setVisible(true);
        });
        btn.on('pointerout', () => {
            this.tooltipBg.setVisible(false);
            this.tooltipText.setVisible(false);
        });
    }

    private slideInSuper(): void {
        this.superVisible = true;
        const buffX = GAME_WIDTH - 84;
        this.scene.tweens.add({
            targets: this.superBtn,
            x: buffX,
            duration: 300,
            ease: 'Back.easeOut',
        });
    }

    private slideOutSuper(): void {
        this.superVisible = false;
        this.superTimerText.setText('');
        this.scene.tweens.add({
            targets: this.superBtn,
            x: GAME_WIDTH + 100,
            duration: 200,
            ease: 'Power2',
        });
    }
}
