import { GameObjects, Scene } from 'phaser';
import { UI, QUEST_PANEL, BUFF_CONFIG } from '../core/config';
import { QuestSystem } from '../systems/QuestSystem';
import { t } from '../data/locales';
import { addButtonFeedback } from './components/buttonFeedback';

const PW = QUEST_PANEL.w;              // 143
const PAD = 7;
const HEADER_H = 35;
const TEXT_H = 17;
const GAP = 4;
const BAR_W = 78;
const BAR_H = 30;
const BAR_R = BAR_H / 2;
const ROW_H = TEXT_H + GAP + BAR_H;    // 41
const ROW_GAP = 7;
const RADIUS = 12;
const BTN_SHADOW = 1.5;
const DIAMOND = '\u25C6';

const BG_ALPHA = 0.75;
const BAR_BG = 0x333333;
const CLAIM_COLOR = 0x4CAF50;
const CLAIM_DARK = 0x2E7D32;

// Left-aligned: bar starts at PAD, centered within its own width
const BAR_CX = PAD + BAR_W / 2;

interface QuestRow {
    label: GameObjects.Text;
    barBg: GameObjects.Graphics;
    barFill: GameObjects.Graphics;
    barText: GameObjects.Text;
    claimWrap: GameObjects.Container;
    barX: number;
    barY: number;
    type: 'roll' | 'grade';
}

export class QuestPanel extends GameObjects.Container {
    readonly panelHeight: number;
    private rows: QuestRow[] = [];

    constructor(scene: Scene, private onClaim: (type: 'roll' | 'grade') => void) {
        const totalH = PAD + HEADER_H + ROW_H + ROW_GAP + ROW_H + PAD;
        super(scene, QUEST_PANEL.x, 0);
        this.panelHeight = totalH;

        // Background
        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, BG_ALPHA);
        bg.fillRoundedRect(0, 0, PW, totalH, RADIUS);
        this.add(bg);

        // Header — left-aligned
        const header = scene.add.text(PAD, PAD + HEADER_H / 2, t('quest_title'), {
            fontFamily: UI.FONT_STROKE, fontSize: '17px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0, 0.5);
        this.add(header);

        // Rows
        const rowStartY = PAD + HEADER_H;
        this.rows.push(this.createRow(scene, rowStartY, 'roll'));
        this.rows.push(this.createRow(scene, rowStartY + ROW_H + ROW_GAP, 'grade'));

        scene.add.existing(this);
    }

    private createRow(scene: Scene, y: number, type: 'roll' | 'grade'): QuestRow {
        // Quest text — left-aligned
        const label = scene.add.text(PAD + 2, y + TEXT_H / 2, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0, 0.5);
        this.add(label);

        const barX = BAR_CX;
        const barY = y + TEXT_H + GAP + BAR_H / 2;

        // Progress bar bg with outline
        const barBg = scene.add.graphics();
        barBg.fillStyle(BAR_BG, 1);
        barBg.fillRoundedRect(barX - BAR_W / 2, barY - BAR_H / 2, BAR_W, BAR_H, BAR_R);
        barBg.lineStyle(1.5, 0x666666, 0.6);
        barBg.strokeRoundedRect(barX - BAR_W / 2, barY - BAR_H / 2, BAR_W, BAR_H, BAR_R);
        this.add(barBg);

        // Progress bar fill
        const barFill = scene.add.graphics();
        this.add(barFill);

        // Progress text (centered on bar)
        const barText = scene.add.text(barX, barY, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5);
        this.add(barText);

        // Claim button (hidden by default) — same size as progress bar
        const claimWrap = scene.add.container(barX, barY).setVisible(false);
        this.add(claimWrap);

        const claimBg = scene.add.graphics();
        this.draw3DButton(claimBg);
        claimWrap.add(claimBg);

        const claimText = scene.add.text(0, -Math.floor(BTN_SHADOW / 2), t('quest_claim'), {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);
        claimWrap.add(claimText);

        claimWrap.setSize(BAR_W, BAR_H + BTN_SHADOW);
        claimWrap.setInteractive({ useHandCursor: true });
        claimWrap.on('pointerdown', () => this.onClaim(type));
        addButtonFeedback(scene, claimWrap);

        return { label, barBg, barFill, barText, claimWrap, barX, barY, type };
    }

    updateDisplay(quests: QuestSystem): void {
        // Quest 1: Roll
        const rq = quests.getRollQuest();
        this.rows[0].label.setText(`${DIAMOND} ${t('quest_roll', { target: String(rq.target) })}`);
        this.updateBar(this.rows[0], rq.current, rq.target, BUFF_CONFIG.lucky.color);
        this.toggleClaim(this.rows[0], quests.isRollQuestComplete());

        // Quest 2: Grade
        const gq = quests.getGradeQuest();
        const gradeName = t(`grade_${quests.getRequiredGrade()}`);
        this.rows[1].label.setText(`${DIAMOND} ${t('quest_grade', { grade: gradeName })}`);
        this.updateBar(this.rows[1], gq.current, gq.target, BUFF_CONFIG.super.color);
        this.toggleClaim(this.rows[1], quests.isGradeQuestComplete());
    }

    private updateBar(row: QuestRow, current: number, target: number, color: number): void {
        const progress = Math.min(1, current / target);
        const maxW = BAR_W - 4;
        const fillW = Math.max(0, maxW * progress);

        row.barFill.clear();
        if (fillW >= 4) {
            const fx = row.barX - BAR_W / 2 + 2;
            const fy = row.barY - BAR_H / 2 + 2;
            const r = Math.min(BAR_R - 1, fillW / 2);
            row.barFill.fillStyle(color, 1);
            row.barFill.fillRoundedRect(fx, fy, fillW, BAR_H - 4, r);
        }
        row.barText.setText(`${current}/${target}`);
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
