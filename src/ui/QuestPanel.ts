import { GameObjects, Scene } from 'phaser';
import { UI, QUEST_PANEL } from '../core/config';
import { QuestSystem, QuestType } from '../systems/QuestSystem';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';
import { fitText } from './components/fitText';

const PW = QUEST_PANEL.w;
const PAD = 10;
const ICON_AREA = 30;
const HEADER_H = 36;
const TEXT_H = 17;
const GAP = 4;
const BAR_W = 86;
const BAR_H = 26;
const BAR_R = BAR_H / 2;
const ROW_H = TEXT_H + GAP + BAR_H;
const ROW_GAP = 7;
const RADIUS = 12;
const BTN_SHADOW = 1.5;
const DIAMOND = '\u25C6';
const BG_ALPHA = 0.75;
const BAR_BG = 0x222244;
const CLAIM_COLOR = 0x78C828;
const CLAIM_DARK = 0x4E8A18;
const BAR_CX = PW / 2;
const BADGE_COLOR = 0x78C828;
const BADGE_R = 12;

interface QuestRow {
    label: GameObjects.Text;
    barBg: GameObjects.Graphics;
    barFill: GameObjects.Graphics;
    barText: GameObjects.Text;
    claimWrap: GameObjects.Container;
    barX: number;
    barY: number;
    type: QuestType;
}

export class QuestPanel extends GameObjects.Container {
    readonly panelHeight: number;
    private rows: QuestRow[] = [];
    private badgeGfx: GameObjects.Graphics;
    private badgeText: GameObjects.Text;

    constructor(
        scene: Scene,
        private onClaim: (type: QuestType) => void,
        private onPanelClick: () => void,
    ) {
        const totalH = PAD + ICON_AREA + HEADER_H + ROW_H + ROW_GAP + ROW_H + 12;
        super(scene, QUEST_PANEL.x, 0);
        this.panelHeight = totalH;

        // Background (clickable → QuestScene)
        const bg = scene.add.graphics();
        bg.fillStyle(0x111122, BG_ALPHA);
        bg.fillRoundedRect(0, ICON_AREA, PW, totalH - ICON_AREA, RADIUS);
        bg.lineStyle(2, 0xffffff, 0.2);
        bg.strokeRoundedRect(0, ICON_AREA, PW, totalH - ICON_AREA, RADIUS);
        this.add(bg);

        // Make background interactive for navigation
        const hitZone = scene.add.zone(PW / 2, ICON_AREA + (totalH - ICON_AREA) / 2, PW, totalH - ICON_AREA);
        hitZone.setInteractive({ useHandCursor: true });
        hitZone.on('pointerdown', () => this.onPanelClick());
        this.add(hitZone);

        // Quest icon (protruding above panel, like ShopButton)
        const icon = scene.add.image(PW / 2, ICON_AREA - 3, 'ui_quest_mid')
            .setDisplaySize(140, 94);
        this.add(icon);

        // Green notification badge (top-left corner)
        const badgeX = 3;
        const badgeY = ICON_AREA + 5;
        this.badgeGfx = scene.add.graphics();
        this.badgeGfx.lineStyle(2, 0x000000, 1);
        this.badgeGfx.fillStyle(BADGE_COLOR, 1);
        this.badgeGfx.fillCircle(badgeX, badgeY, BADGE_R);
        this.badgeGfx.strokeCircle(badgeX, badgeY, BADGE_R);
        this.badgeGfx.setVisible(false);
        this.add(this.badgeGfx);

        this.badgeText = scene.add.text(badgeX, badgeY, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setVisible(false);
        this.add(this.badgeText);

        // Header
        const headerY = ICON_AREA + PAD + HEADER_H / 2;
        const header = scene.add.text(PW / 2, headerY, t('quest_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
        fitText(header, PW - 12, 17);
        this.add(header);

        // Rows
        const rowStartY = ICON_AREA + PAD + HEADER_H;
        this.rows.push(this.createRow(scene, rowStartY, 'roll'));
        this.rows.push(this.createRow(scene, rowStartY + ROW_H + ROW_GAP, 'roll'));

        scene.add.existing(this);
    }

    private createRow(scene: Scene, y: number, type: QuestType): QuestRow {
        const label = scene.add.text(PW / 2, y + TEXT_H / 2, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5, 0.5);
        this.add(label);

        const barX = BAR_CX;
        const barY = y + TEXT_H + GAP + BAR_H / 2;

        const barBg = scene.add.graphics();
        barBg.fillStyle(BAR_BG, 0.5);
        barBg.fillRoundedRect(barX - BAR_W / 2, barY - BAR_H / 2, BAR_W, BAR_H, BAR_R);
        barBg.lineStyle(2, 0x000000, 0.3);
        barBg.strokeRoundedRect(barX - BAR_W / 2, barY - BAR_H / 2, BAR_W, BAR_H, BAR_R);
        this.add(barBg);

        const barFill = scene.add.graphics();
        this.add(barFill);

        const barText = scene.add.text(barX, barY, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        this.add(barText);

        const claimWrap = scene.add.container(barX, barY).setVisible(false);
        this.add(claimWrap);

        const claimBg = scene.add.graphics();
        this.draw3DButton(claimBg);
        claimWrap.add(claimBg);

        const claimText = scene.add.text(0, -Math.floor(BTN_SHADOW / 2), t('quest_claim'), {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);
        fitText(claimText, BAR_W - 8, 13);
        claimWrap.add(claimText);

        claimWrap.setSize(BAR_W, BAR_H + BTN_SHADOW);
        claimWrap.setInteractive({ useHandCursor: true });
        claimWrap.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev: Phaser.Types.Input.EventData) => {
            ev.stopPropagation();
            this.onClaim(type);
        });
        addButtonFeedback(scene, claimWrap);

        return { label, barBg, barFill, barText, claimWrap, barX, barY, type };
    }

    updateDisplay(quests: QuestSystem): void {
        const visible = quests.getVisibleQuests();

        for (let i = 0; i < 2; i++) {
            const vq = visible[i];
            if (!vq) continue;
            const row = this.rows[i];
            row.type = vq.type;

            // Update claim callback type
            row.claimWrap.removeAllListeners('pointerdown');
            row.claimWrap.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev: Phaser.Types.Input.EventData) => {
                ev.stopPropagation();
                this.onClaim(vq.type);
            });

            // Label
            if (vq.type === 'roll') {
                row.label.setText(`${DIAMOND} ${t('quest_roll', { target: String(vq.target) })}`);
            } else if (vq.type === 'grade') {
                const gradeName = t(`grade_${quests.getRequiredGrade()}`);
                row.label.setText(`${DIAMOND} ${t('quest_grade', { grade: gradeName })}`);
            } else {
                const mins = Math.round(vq.target / 60);
                row.label.setText(`${DIAMOND} ${t('quest_online', { target: String(mins) })}`);
            }
            fitText(row.label, PW - 12, 13);

            // Bar color — uniform yellow
            const color = 0xffc107;

            // Bar text
            let barStr: string;
            if (vq.type === 'online') {
                const cm = Math.floor(vq.current / 60);
                const cs = vq.current % 60;
                const tm = Math.floor(vq.target / 60);
                const ts = vq.target % 60;
                barStr = `${cm}:${String(cs).padStart(2, '0')} / ${tm}:${String(ts).padStart(2, '0')}`;
            } else {
                barStr = `${vq.current}/${vq.target}`;
            }

            this.updateBar(row, vq.current, vq.target, color, barStr);
            this.toggleClaim(row, vq.complete);
        }

        this.updateBadge(quests);
    }

    updateBadge(quests: QuestSystem): void {
        const count = quests.getTotalClaimableCount();
        if (count > 0) {
            this.badgeText.setText(String(count));
            this.badgeText.setFontSize(count >= 10 ? '11px' : '13px');
            this.badgeGfx.setVisible(true);
            this.badgeText.setVisible(true);
        } else {
            this.badgeGfx.setVisible(false);
            this.badgeText.setVisible(false);
        }
    }

    private updateBar(row: QuestRow, current: number, target: number, color: number, text: string): void {
        const progress = Math.min(1, target > 0 ? current / target : 0);
        const maxW = BAR_W - 4;
        const fillW = Math.max(0, maxW * progress);

        row.barFill.clear();
        if (fillW >= 4) {
            const fx = row.barX - BAR_W / 2 + 2;
            const fy = row.barY - BAR_H / 2 + 2;
            const r = Math.min(BAR_R - 1, fillW / 2);
            row.barFill.fillStyle(color, 1);
            row.barFill.fillRoundedRect(fx, fy, fillW, BAR_H - 4, r);
            if (fillW > 4) {
                const hr = fillW >= BAR_H - 4 ? { tl: r - 1, tr: r - 1, bl: 0, br: 0 } : 0;
                row.barFill.fillStyle(0xffffff, 0.2);
                row.barFill.fillRoundedRect(fx + 1, fy + 1, fillW - 2, (BAR_H - 6) * 0.4, hr);
            }
        }
        row.barText.setText(text);
    }

    private toggleClaim(row: QuestRow, complete: boolean): void {
        row.barBg.setVisible(!complete);
        row.barFill.setVisible(!complete);
        row.barText.setVisible(!complete);
        row.claimWrap.setVisible(complete);
    }

    private draw3DButton(g: GameObjects.Graphics): void {
        const w = BAR_W, h = BAR_H, r = BAR_R;
        g.fillStyle(CLAIM_DARK, 1);
        g.fillRoundedRect(-w / 2, -h / 2 + BTN_SHADOW, w, h, r);
        g.fillStyle(CLAIM_COLOR, 1);
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
}
