import { GameObjects, Geom, Scene } from 'phaser';
import { UI, BONUS_PANEL, BUFF_CONFIG, GAME_HEIGHT } from '../core/config';
import { BuffSystem } from '../systems/BuffSystem';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';

interface BonusRow {
    container: GameObjects.Container;
    glowWrap: GameObjects.Container;
    glow: GameObjects.Graphics;
    bg: GameObjects.Graphics;
    icon: GameObjects.Image;
    label: GameObjects.Text;
    desc: GameObjects.Text;
    btnWrap: GameObjects.Container;
    getBtnBg: GameObjects.Graphics;
    getBtnText: GameObjects.Text;
    type: string;
    offscreen: boolean;
    progressBg?: GameObjects.Graphics;
    progressFill?: GameObjects.Graphics;
    progressText?: GameObjects.Text;
    timerTab?: GameObjects.Container;
    timerText?: GameObjects.Text;
}

const ROW_W = BONUS_PANEL.w;
const ICON_SZ = 51;
const EPIC_ICON_SZ = 56;
const ACCENT_H = 1;
const PAD = 4;
const ICON_PAD = 7;
const ROW_H = ICON_SZ + PAD * 2 + ACCENT_H + 10;
const GAP = BONUS_PANEL.gap;
const RADIUS = 10;
const BTN_W = 78;
const BTN_H = 24;
const BTN_SHADOW = 1.5;
const AD_COLOR = 0x7B2FBE;
const AD_COLOR_DARK = 0x4A1A72;
const FREE_COLOR = 0x4CAF50;
const FREE_COLOR_DARK = 0x2E7D32;
const AREA_LEFT = ICON_PAD + ICON_SZ + 4;
const AREA_CX = AREA_LEFT + (ROW_W - AREA_LEFT - PAD) / 2;
const CONTENT_TOP = ACCENT_H + 6;
const CONTENT_CY = CONTENT_TOP + (ROW_H - CONTENT_TOP) / 2;

const BUFF_DESC: Record<string, string> = {
    lucky: 'x2 chance',
    super: 'x3 chance',
    epic: 'x5 chance',
};

const TOOLTIP_KEYS: Record<string, string> = {
    epic: 'tip_epic',
    lucky: 'tip_lucky',
    super: 'tip_super',
};

const TAB_W = 50;
const TAB_H = 16;
const TAB_R = 6;

export class BonusPanel extends GameObjects.Container {
    private rows: BonusRow[] = [];
    private superWasOffered = false;
    private epicWasReady = false;
    private superLastSec = -1;
    private tooltipBg: GameObjects.Graphics;
    private tooltipText: GameObjects.Text;
    private longPressTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Scene, onBuff: (type: string) => void) {
        const rowDefs = [
            { type: 'epic',     iconKey: 'ui_x5wow_mid',     label: t('buff_epic'),     color: BUFF_CONFIG.epic.color },
            { type: 'lucky',    iconKey: 'ui_x2simple_mid',   label: t('buff_lucky'),    color: BUFF_CONFIG.lucky.color },
            { type: 'super',    iconKey: 'ui_x3wow_mid',      label: t('buff_super'),    color: BUFF_CONFIG.super.color },
        ];

        const totalH = rowDefs.length * ROW_H + (rowDefs.length - 1) * GAP;
        const panelY = Math.round((GAME_HEIGHT - totalH) / 2);
        super(scene, BONUS_PANEL.x, panelY);

        // Shared tooltip (rendered above everything)
        this.tooltipBg = scene.add.graphics().setDepth(200).setVisible(false);
        this.tooltipText = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_MAIN, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
            align: 'center', wordWrap: { width: 140 },
        }).setOrigin(0.5).setDepth(200).setVisible(false);

        rowDefs.forEach((def) => {
            const row = this.createRow(scene, def, () => onBuff(def.type));
            row.offscreen = def.type === 'super';
            if (def.type === 'super') {
                row.container.x = ROW_W + 10;
                row.glow.setVisible(false);
                row.btnWrap.disableInteractive();
            }
            if (def.type === 'epic') {
                this.addEpicProgress(scene, row);
                row.glow.setVisible(false);
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
        onClick: () => void,
    ): BonusRow {
        const container = scene.add.container(0, 0);
        this.add(container);

        const isEpic = def.type === 'epic';
        const isSuper = def.type === 'super';
        const isAd = !isEpic;

        // Outer glow — slow, subtle pulse
        const glowWrap = scene.add.container(ROW_W / 2, ROW_H / 2);
        container.add(glowWrap);
        const glow = scene.add.graphics();
        const sp = isEpic ? 6 : 4;
        glow.fillStyle(def.color, 0.25);
        glow.fillRoundedRect(-sp, -sp, ROW_W + sp * 2, ROW_H + sp * 2, RADIUS + sp);
        glow.setPosition(-ROW_W / 2, -ROW_H / 2);
        glowWrap.add(glow);
        scene.tweens.add({
            targets: glow, alpha: { from: 0.3, to: 0.8 },
            duration: isEpic ? 1200 : 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        // Card background
        const bg = scene.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.9);
        bg.fillRoundedRect(0, 0, ROW_W, ROW_H, RADIUS);
        bg.fillStyle(def.color, 0.7);
        bg.fillRoundedRect(0, 0, ROW_W, ACCENT_H, { tl: RADIUS, tr: RADIUS, bl: 0, br: 0 });
        bg.lineStyle(1.5, def.color, 0.3);
        bg.strokeRoundedRect(0, 0, ROW_W, ROW_H, RADIUS);
        container.add(bg);

        // Card body interactive — for long-press tooltip only (no scale feedback)
        container.setInteractive(
            new Geom.Rectangle(0, 0, ROW_W, ROW_H), Geom.Rectangle.Contains,
        );
        const tipKey = TOOLTIP_KEYS[def.type] || '';
        container.on('pointerdown', () => {
            this.longPressTimer = scene.time.delayedCall(300, () => {
                this.showTooltip(container, tipKey);
            });
        });
        container.on('pointerup', () => this.cancelTooltip());
        container.on('pointerout', () => this.cancelTooltip());

        // Icon — left side, centered in content zone
        const iconX = ICON_PAD + ICON_SZ / 2;
        const isLucky = def.type === 'lucky';
        const iconSize = isEpic ? EPIC_ICON_SZ : isSuper ? 54 : isLucky ? 49 : ICON_SZ;
        const iconY = isEpic ? CONTENT_CY + 2 : CONTENT_CY;
        const icon = scene.add.image(iconX, iconY, def.iconKey)
            .setDisplaySize(iconSize, iconSize);
        container.add(icon);

        // Buff name
        const label = scene.add.text(AREA_CX, CONTENT_TOP + 11.5, def.label, {
            fontFamily: UI.FONT_MAIN, fontSize: '12px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5, 0.5);
        container.add(label);

        // Benefit description
        const descText = BUFF_DESC[def.type] || '';
        const desc = scene.add.text(AREA_CX, CONTENT_TOP + 25.5, descText, {
            fontFamily: UI.FONT_MAIN, fontSize: '11px',
            color: this.colorToHex(def.color),
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5, 0.5);
        container.add(desc);

        // 3D action button — click target + scale feedback here only
        const btnCY = ROW_H - PAD - BTN_H / 2 - BTN_SHADOW + 1;
        const btnWrap = scene.add.container(AREA_CX, btnCY);
        container.add(btnWrap);

        const btnColor = isAd ? AD_COLOR : FREE_COLOR;
        const btnColorDark = isAd ? AD_COLOR_DARK : FREE_COLOR_DARK;

        const getBtnBg = scene.add.graphics();
        this.draw3DButton(getBtnBg, btnColor, btnColorDark);
        btnWrap.add(getBtnBg);

        const btnLabel = isAd ? `▶ ${t('buff_watch')}` : t('buff_free');
        const getBtnText = scene.add.text(0, -Math.floor(BTN_SHADOW / 2), btnLabel, {
            fontFamily: UI.FONT_MAIN, fontSize: '10px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5, 0.5);
        btnWrap.add(getBtnText);

        // Button is the click target with scale feedback
        btnWrap.setSize(BTN_W, BTN_H + BTN_SHADOW);
        btnWrap.setInteractive({ useHandCursor: true });
        btnWrap.on('pointerdown', (p: Phaser.Input.Pointer, lx: number, ly: number, ev: Phaser.Types.Input.EventData) => {
            ev.stopPropagation();
            this.cancelTooltip();
            onClick();
        });
        addButtonFeedback(scene, btnWrap);

        return {
            container, glowWrap, glow, bg, icon, label, desc, btnWrap,
            getBtnBg, getBtnText, type: def.type, offscreen: false,
        };
    }

    private showTooltip(card: GameObjects.Container, localeKey: string): void {
        const text = t(localeKey);
        if (!text) return;
        this.tooltipText.setText(text);
        const padX = 14, padY = 10;
        const tw = this.tooltipText.width + padX * 2;
        const th = this.tooltipText.height + padY * 2;
        const worldX = this.x + card.x + ROW_W / 2;
        const worldY = this.y + card.y - th / 2 - 6;
        this.tooltipText.setPosition(worldX, worldY);
        this.tooltipBg.clear();
        this.tooltipBg.fillStyle(0x000000, 0.85);
        this.tooltipBg.fillRoundedRect(worldX - tw / 2, worldY - th / 2, tw, th, 6);
        this.tooltipBg.setVisible(true);
        this.tooltipText.setVisible(true);
    }

    private cancelTooltip(): void {
        if (this.longPressTimer) {
            this.longPressTimer.destroy();
            this.longPressTimer = null;
        }
        this.tooltipBg.setVisible(false);
        this.tooltipText.setVisible(false);
    }

    private draw3DButton(
        g: GameObjects.Graphics, color: number, colorDark: number,
    ): void {
        const w = BTN_W, h = BTN_H, r = h / 2;
        g.clear();
        g.fillStyle(colorDark, 1);
        g.fillRoundedRect(-w / 2, -h / 2 + BTN_SHADOW, w, h, r);
        g.fillStyle(color, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h - BTN_SHADOW, r);
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(
            -w / 2 + 3, -h / 2 + 1,
            w - 6, (h - BTN_SHADOW) * 0.4,
            { tl: r - 1, tr: r - 1, bl: 0, br: 0 },
        );
        g.lineStyle(1.5, 0x000000, 0.25);
        g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    }

    private addEpicProgress(scene: Scene, row: BonusRow): void {
        const pBg = scene.add.graphics();
        pBg.fillStyle(0x333333, 1);
        pBg.fillRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, BTN_H / 2);
        row.btnWrap.add(pBg);

        const pFill = scene.add.graphics();
        row.btnWrap.add(pFill);

        const pText = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_MAIN, fontSize: '10px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5, 0.5);
        row.btnWrap.add(pText);

        row.getBtnBg.setAlpha(0);
        row.getBtnText.setAlpha(0);
        row.btnWrap.disableInteractive();
        row.progressBg = pBg;
        row.progressFill = pFill;
        row.progressText = pText;
    }

    private addSuperTimer(scene: Scene, row: BonusRow): void {
        const tab = scene.add.container(ROW_W / 2, ROW_H).setVisible(false);
        const g = scene.add.graphics();
        g.fillStyle(BUFF_CONFIG.super.color, 0.9);
        g.fillRoundedRect(-TAB_W / 2, 0, TAB_W, TAB_H, { tl: 0, tr: 0, bl: TAB_R, br: TAB_R });
        g.lineStyle(1, 0x000000, 0.25);
        g.strokeRoundedRect(-TAB_W / 2, 0, TAB_W, TAB_H, { tl: 0, tr: 0, bl: TAB_R, br: TAB_R });
        g.fillStyle(0xffffff, 0.12);
        g.fillRect(-TAB_W / 2 + 2, 1, TAB_W - 4, 4);
        tab.add(g);

        const txt = scene.add.text(0, TAB_H / 2, '', {
            fontFamily: UI.FONT_MAIN, fontSize: '10px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5, 0.5);
        tab.add(txt);

        row.container.add(tab);
        row.timerTab = tab;
        row.timerText = txt;
    }

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

    onBuffClaimed(type: string): void {
        if (type !== 'lucky' && type !== 'autoroll') return;
        const row = this.rows.find(r => r.type === type);
        if (!row || row.offscreen) return;
        row.offscreen = true;
        row.btnWrap.disableInteractive();
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
                        onComplete: () => {
                            row.btnWrap.setInteractive({ useHandCursor: true });
                        },
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
            row.timerTab?.setVisible(true);
            this.scene.tweens.add({
                targets: row.container, x: 0, duration: 300, ease: 'Back.easeOut',
                onComplete: () => {
                    row.btnWrap.setInteractive({ useHandCursor: true });
                },
            });
        } else if (!offered && this.superWasOffered) {
            row.timerTab?.setVisible(false);
            row.btnWrap.disableInteractive();
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

        if (offered && row.timerTab && row.timerText) {
            const remaining = buffs.getSuperOfferRemaining();
            const sec = Math.ceil(remaining / 1000);
            row.timerText.setText(`${sec}s`);
            if (sec !== this.superLastSec && this.superLastSec !== -1) {
                this.scene.tweens.add({
                    targets: row.timerTab,
                    scaleX: 1.1, scaleY: 1.1,
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
            row.icon.setTexture('ui_x5wow_mid');
            row.glow.setVisible(ready);
            if (ready) {
                this.draw3DButton(row.getBtnBg, FREE_COLOR, FREE_COLOR_DARK);
                row.btnWrap.setInteractive({ useHandCursor: true });
            } else {
                row.btnWrap.disableInteractive();
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
                row.progressFill!.fillRoundedRect(
                    -BTN_W / 2 + 2, -BTN_H / 2 + 2, fillW, barH, r,
                );
            }
            row.progressText!.setText(`${Math.ceil(remaining / 1000)}s`);
        }
    }

    private colorToHex(color: number): string {
        return `#${color.toString(16).padStart(6, '0')}`;
    }
}
