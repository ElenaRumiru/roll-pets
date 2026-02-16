import { GameObjects, Geom, Scene } from 'phaser';
import { UI, BONUS_PANEL, BUFF_CONFIG, GAME_HEIGHT } from '../core/config';
import { BuffSystem } from '../systems/BuffSystem';
import { t } from '../data/locales';

interface BonusRow {
    container: GameObjects.Container;
    glow: GameObjects.Graphics;
    bg: GameObjects.Graphics;
    icon: GameObjects.Image;
    label: GameObjects.Text;
    btnWrap: GameObjects.Container;
    getBtnBg: GameObjects.Graphics;
    getBtnText: GameObjects.Text;
    type: string;
    offscreen: boolean;
    progressBg?: GameObjects.Graphics;
    progressFill?: GameObjects.Graphics;
    progressText?: GameObjects.Text;
    timerWrap?: GameObjects.Container;
    timerText?: GameObjects.Text;
}

const ROW_W = BONUS_PANEL.w;
const ICON_SZ = BONUS_PANEL.iconSize;
const PAD = BONUS_PANEL.padding;
const ICON_PAD = 1;
const ROW_H = ICON_SZ + PAD * 2;
const GAP = BONUS_PANEL.gap;
const RADIUS = 10;
const BTN_W = 82;
const BTN_H = 26;
const BTN_COLOR = 0x65D059;
const BTN_Y = ROW_H - PAD - BTN_H;
const AREA_LEFT = ICON_PAD + ICON_SZ + 4;
const AREA_CX = AREA_LEFT + (ROW_W - AREA_LEFT - PAD) / 2 - 4;
const BTN_X = AREA_CX - BTN_W / 2;

export class BonusPanel extends GameObjects.Container {
    private rows: BonusRow[] = [];
    private superWasOffered = false;
    private epicWasReady = false;
    private superLastSec = -1;

    constructor(scene: Scene, onBuff: (type: string) => void) {
        const rowDefs = [
            { type: 'epic',     iconKey: 'ui_x5chance',  label: t('buff_epic'),     color: BUFF_CONFIG.epic.color },
            { type: 'lucky',    iconKey: 'ui_x2chance',  label: t('buff_lucky'),    color: BUFF_CONFIG.lucky.color },
            { type: 'autoroll', iconKey: 'ui_auto',      label: t('buff_autoroll'), color: BUFF_CONFIG.autoroll.color },
            { type: 'super',    iconKey: 'ui_x3chance',  label: t('buff_super'),    color: BUFF_CONFIG.super.color },
        ];

        const totalH = rowDefs.length * ROW_H + (rowDefs.length - 1) * GAP;
        const panelY = Math.round((GAME_HEIGHT - totalH) / 2);
        super(scene, BONUS_PANEL.x, panelY);

        rowDefs.forEach((def) => {
            const row = this.createRow(scene, def, 0, () => onBuff(def.type));
            row.offscreen = def.type === 'super';
            if (def.type === 'super') {
                row.container.x = ROW_W + 10;
                row.glow.setVisible(false);
                row.container.disableInteractive();
            }
            if (def.type === 'epic') {
                this.addEpicProgress(scene, row);
                row.glow.setVisible(false);
                row.container.setScale(0.93);
                row.container.x = ROW_W * 0.07;
                row.container.y = ROW_H * 0.07;
            }
            if (def.type === 'super') this.addSuperTimer(scene, row);
            this.rows.push(row);
        });

        this.layoutRows(true);
        scene.add.existing(this);
    }

    private createRow(
        scene: Scene,
        def: { type: string; iconKey: string; label: string; color: number },
        y: number,
        onClick: () => void,
    ): BonusRow {
        const container = scene.add.container(0, y);
        this.add(container);

        const isEpic = def.type === 'epic';
        const glow = scene.add.graphics();
        for (const { spread: s, alpha: a } of [
            { spread: isEpic ? 8 : 6, alpha: isEpic ? 0.25 : 0.15 },
            { spread: isEpic ? 4 : 3, alpha: isEpic ? 0.40 : 0.30 },
        ]) {
            glow.fillStyle(def.color, a);
            glow.fillRoundedRect(-s, -s, ROW_W + s * 2, ROW_H + s * 2, RADIUS + s);
        }
        container.add(glow);

        scene.tweens.add({
            targets: glow, alpha: { from: 0.15, to: 1 },
            duration: isEpic ? 600 : 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.6);
        bg.fillRoundedRect(0, 0, ROW_W, ROW_H, RADIUS);
        container.add(bg);

        container.setInteractive(new Geom.Rectangle(0, 0, ROW_W, ROW_H), Geom.Rectangle.Contains);
        container.input!.cursor = 'pointer';
        container.on('pointerdown', onClick);

        const iconX = ICON_PAD + ICON_SZ / 2;
        const icon = scene.add.image(iconX, ROW_H / 2, def.iconKey)
            .setDisplaySize(ICON_SZ, ICON_SZ);
        container.add(icon);

        const labelY = PAD + (BTN_Y - PAD) / 2;
        const label = scene.add.text(AREA_CX, labelY, def.label, {
            fontFamily: UI.FONT_MAIN, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5, 0.5);
        container.add(label);

        const btnCX = BTN_X + BTN_W / 2;
        const btnCY = BTN_Y + BTN_H / 2;
        const btnWrap = scene.add.container(btnCX, btnCY);
        container.add(btnWrap);

        const getBtnBg = scene.add.graphics();
        getBtnBg.fillStyle(BTN_COLOR, 1);
        getBtnBg.fillRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, BTN_H / 2);
        btnWrap.add(getBtnBg);

        const getBtnText = scene.add.text(0, 0, t('buff_get'), {
            fontFamily: UI.FONT_MAIN, fontSize: '12px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5, 0.5);
        btnWrap.add(getBtnText);

        return {
            container, glow, bg, icon, label, btnWrap, getBtnBg, getBtnText,
            type: def.type, offscreen: false,
        };
    }

    private addEpicProgress(scene: Scene, row: BonusRow): void {
        const pBg = scene.add.graphics();
        pBg.fillStyle(0x333333, 1);
        pBg.fillRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, BTN_H / 2);
        row.btnWrap.add(pBg);

        const pFill = scene.add.graphics();
        row.btnWrap.add(pFill);

        const pText = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_MAIN, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5, 0.5);
        row.btnWrap.add(pText);

        row.getBtnBg.setAlpha(0);
        row.getBtnText.setAlpha(0);
        row.progressBg = pBg;
        row.progressFill = pFill;
        row.progressText = pText;
    }

    private addSuperTimer(scene: Scene, row: BonusRow): void {
        const tw = 30, th = 14, tr = 4;
        const wrap = scene.add.container(ROW_W / 2 + 22, 2).setVisible(false);
        const bg = scene.add.graphics();
        bg.fillStyle(BUFF_CONFIG.super.color, 1);
        bg.fillRoundedRect(-tw / 2, -th / 2, tw, th, tr);
        wrap.add(bg);
        const txt = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_MAIN, fontSize: '10px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5, 0.5);
        wrap.add(txt);
        row.container.add(wrap);
        row.timerWrap = wrap;
        row.timerText = txt;
    }

    /** Reposition visible rows top-to-bottom. instant=true skips tweens. */
    private layoutRows(instant = false): void {
        let idx = 0;
        for (const row of this.rows) {
            if (row.offscreen) continue;
            const targetY = idx * (ROW_H + GAP);
            if (instant || row.container.x > ROW_W / 2) {
                row.container.y = targetY;
            } else if (Math.abs(row.container.y - targetY) > 1) {
                this.scene.tweens.add({
                    targets: row.container, y: targetY,
                    duration: 200, ease: 'Sine.easeInOut',
                });
            }
            idx++;
        }
    }

    /** Called after a buff is granted — slides lucky/autoroll out for 5s */
    onBuffClaimed(type: string): void {
        if (type !== 'lucky' && type !== 'autoroll') return;
        const row = this.rows.find(r => r.type === type);
        if (!row || row.offscreen) return;
        row.offscreen = true;
        row.container.disableInteractive();
        this.scene.tweens.add({
            targets: row.container, x: ROW_W + 10, duration: 300, ease: 'Cubic.easeIn',
            onComplete: () => {
                row.glow.setVisible(false);
                this.layoutRows();
                this.scene.time.delayedCall(5000, () => {
                    row.offscreen = false;
                    this.layoutRows();
                    row.glow.setVisible(true);
                    this.scene.tweens.add({
                        targets: row.container, x: 0, duration: 300, ease: 'Back.easeOut',
                        onComplete: () => row.container.setInteractive(
                            new Geom.Rectangle(0, 0, ROW_W, ROW_H), Geom.Rectangle.Contains,
                        ),
                    });
                });
            },
        });
    }

    updateBuffDisplay(buffs: BuffSystem): void {
        for (const row of this.rows) {
            if (row.type === 'super') this.updateSuperRow(row, buffs);
            else if (row.type === 'epic') this.updateEpicRow(row, buffs);
        }
    }

    private updateSuperRow(row: BonusRow, buffs: BuffSystem): void {
        const offered = buffs.isSuperOffered();
        if (offered && !this.superWasOffered) {
            this.superLastSec = -1;
            row.offscreen = false;
            this.layoutRows();
            row.glow.setVisible(true);
            row.timerWrap?.setVisible(true);
            this.scene.tweens.add({
                targets: row.container, x: 0, duration: 300, ease: 'Back.easeOut',
                onComplete: () => row.container.setInteractive(
                    new Geom.Rectangle(0, 0, ROW_W, ROW_H), Geom.Rectangle.Contains,
                ),
            });
        } else if (!offered && this.superWasOffered) {
            row.timerWrap?.setVisible(false);
            row.container.disableInteractive();
            this.scene.tweens.add({
                targets: row.container, x: ROW_W + 10, duration: 300, ease: 'Cubic.easeIn',
                onComplete: () => {
                    row.glow.setVisible(false);
                    row.offscreen = true;
                    this.layoutRows();
                },
            });
        }
        this.superWasOffered = offered;

        // Update timer text + pulse
        if (offered && row.timerWrap && row.timerText) {
            const remaining = buffs.getSuperOfferRemaining();
            const sec = Math.ceil(remaining / 1000);
            row.timerText.setText(`${sec}s`);
            if (sec !== this.superLastSec && this.superLastSec !== -1) {
                this.scene.tweens.add({
                    targets: row.timerWrap,
                    scaleX: 1.15, scaleY: 1.15,
                    duration: 80, yoyo: true, ease: 'Quad.easeOut',
                });
            }
            this.superLastSec = sec;
        }
    }

    private updateEpicRow(row: BonusRow, buffs: BuffSystem): void {
        const ready = buffs.isEpicReady();
        if (ready !== this.epicWasReady) {
            row.getBtnBg.setAlpha(ready ? 1 : 0);
            row.getBtnText.setAlpha(ready ? 1 : 0);
            row.progressBg!.setAlpha(ready ? 0 : 1);
            row.progressFill!.setAlpha(ready ? 0 : 1);
            row.progressText!.setAlpha(ready ? 0 : 1);
            row.icon.setTexture(ready ? 'ui_x5chance_ready' : 'ui_x5chance');
            row.glow.setVisible(ready);
            this.scene.tweens.add({
                targets: row.container,
                scaleX: ready ? 1 : 0.93,
                scaleY: ready ? 1 : 0.93,
                x: ready ? 0 : ROW_W * 0.07,
                y: ready ? 0 : ROW_H * 0.07,
                duration: 250,
                ease: ready ? 'Back.easeOut' : 'Sine.easeIn',
            });
            if (ready) {
                this.drawBtn(row.getBtnBg, BTN_COLOR, 1);
                row.container.setInteractive(
                    new Geom.Rectangle(0, 0, ROW_W, ROW_H), Geom.Rectangle.Contains,
                );
            } else {
                row.container.disableInteractive();
            }
            this.epicWasReady = ready;
        }
        if (!ready) {
            const remaining = buffs.getEpicTimerRemaining();
            const progress = 1 - remaining / BUFF_CONFIG.epic.timer;
            const maxW = BTN_W - 4;
            const barH = BTN_H - 4;
            const fillW = Math.max(0, maxW * progress);
            row.progressFill!.clear();
            if (fillW >= 4) {
                const r = Math.min(barH / 2, fillW / 2);
                row.progressFill!.fillStyle(BUFF_CONFIG.epic.color, 1);
                row.progressFill!.fillRoundedRect(-BTN_W / 2 + 2, -BTN_H / 2 + 2, fillW, barH, r);
            }
            row.progressText!.setText(`${Math.ceil(remaining / 1000)}s`);
        }
    }

    private drawBtn(g: GameObjects.Graphics, color: number, alpha: number): void {
        g.clear();
        g.fillStyle(color, 1);
        g.fillRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, BTN_H / 2);
        g.setAlpha(alpha);
    }
}
