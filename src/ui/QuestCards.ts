import { Scene, GameObjects } from 'phaser';
import { UI } from '../core/config';
import { isPortrait } from '../core/orientation';
import { QuestType, QuestSystem } from '../systems/QuestSystem';
import { t } from '../data/locales';
import { fitText } from './components/fitText';
import { addButtonFeedback } from './components/buttonFeedback';
import { addShineEffect } from './components/shineEffect';

const CARD_H = 90, CARD_GAP = 12, CARD_R = 14;
const BAR_H = 20, BAR_R = BAR_H / 2, BAR_COLOR = 0xffc107;
const MINI_R = 10, MBTN_H = 28, MBTN_R = MBTN_H / 2;
const BUFF_ICON: Record<string, string> = { lucky: 'luck_x2_lg', super: 'luck_x3_lg', epic: 'luck_x5_lg' };
const BUFF_CLR: Record<string, string> = { lucky: '#78C828', super: '#4FC3F7', epic: '#ffc107' };

interface QL { cardW: number; barW: number; miniW: number; miniGap: number; mbtnW: number }

function getL(): QL {
    return isPortrait()
        ? { cardW: 540, barW: 220, miniW: 120, miniGap: 8, mbtnW: 85 }
        : { cardW: 700, barW: 280, miniW: 155, miniGap: 10, mbtnW: 100 };
}

export { CARD_H, CARD_GAP };

export function buildQuestCards(
    scene: Scene, ct: GameObjects.Container, cx: number, startY: number,
    quests: QuestSystem, onClaim: (type: QuestType, ad: boolean) => void,
): void {
    ct.removeAll(true);
    let y = startY;
    for (const type of (['roll', 'grade', 'online'] as QuestType[])) {
        const done = type === 'roll' ? quests.isRollQuestComplete()
            : type === 'grade' ? quests.isGradeQuestComplete() : quests.isOnlineComplete();
        createCard(scene, ct, cx, y, type, done, quests, onClaim);
        y += CARD_H + CARD_GAP;
    }
}

function createCard(
    scene: Scene, parent: GameObjects.Container, cx: number, topY: number,
    type: QuestType, complete: boolean,
    quests: QuestSystem, onClaim: (type: QuestType, ad: boolean) => void,
): void {
    const L = getL();
    const ct = scene.add.container(0, 0);
    const cfg = quests.getReward(type);

    const bg = scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(cx - L.cardW / 2, topY, L.cardW, CARD_H, CARD_R);
    bg.lineStyle(1.5, 0x333355, 0.5);
    bg.strokeRoundedRect(cx - L.cardW / 2, topY, L.cardW, CARD_H, CARD_R);
    ct.add(bg);

    let questName: string, current: number, target: number;
    if (type === 'roll') {
        const rq = quests.getRollQuest();
        questName = `\u25C6 ${t('quest_roll', { target: String(rq.target) })}`;
        current = rq.current; target = rq.target;
    } else if (type === 'grade') {
        const gq = quests.getGradeQuest();
        const gn = t(`grade_${quests.getRequiredGrade()}`);
        questName = `\u25C6 ${t(gq.target > 1 ? 'quest_grade_n' : 'quest_grade', { grade: gn, target: String(gq.target) })}`;
        current = gq.current; target = gq.target;
    } else {
        const oq = quests.getOnlineQuest();
        questName = `\u25C6 ${t('quest_online', { target: String(Math.round(oq.target / 60)) })}`;
        current = Math.floor(oq.current); target = oq.target;
    }

    const nameText = scene.add.text(cx - L.cardW / 2 + 20, complete ? topY + 22 : topY + 20, questName, {
        fontFamily: UI.FONT_STROKE, fontSize: '16px', color: '#ffffff',
        stroke: '#000000', strokeThickness: UI.STROKE_THIN,
    }).setOrigin(0, 0.5);
    fitText(nameText, L.barW, 16);
    ct.add(nameText);

    const barX = cx - L.cardW / 2 + 20, barY = topY + 50;
    drawBar(scene, ct, barX, barY, current, target, L.barW);

    let pStr: string;
    if (type === 'online') {
        const cm = Math.floor(current / 60), cs = current % 60;
        const tm = Math.floor(target / 60), ts = target % 60;
        pStr = `${cm}:${String(cs).padStart(2, '0')} / ${tm}:${String(ts).padStart(2, '0')}`;
    } else pStr = `${current}/${target}`;
    ct.add(scene.add.text(barX + L.barW / 2, barY + BAR_H / 2, pStr, {
        fontFamily: UI.FONT_STROKE, fontSize: '11px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5));

    if (complete) {
        addRewards(scene, ct, cx, topY, type, cfg, L, onClaim);
    } else {
        const rx = cx + L.cardW / 2 - 70;
        ct.add(scene.add.text(rx, topY + 14, `${t('quest_reward')}:`, {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5));
        ct.add(scene.add.image(rx, topY + 48, BUFF_ICON[cfg.buffType] || 'luck_x2_lg').setDisplaySize(50, 50));
        ct.add(scene.add.text(rx, topY + 76, `${cfg.freeCount}-${cfg.adCount}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1.5,
        }).setOrigin(0.5));
    }
    parent.add(ct);
}

function addRewards(
    scene: Scene, ct: GameObjects.Container, cx: number, topY: number,
    type: QuestType, cfg: { freeCount: number; adCount: number; buffType: string },
    L: QL, onClaim: (type: QuestType, ad: boolean) => void,
): void {
    const buffClr = BUFF_CLR[cfg.buffType] || '#ffffff';
    const rEnd = cx + L.cardW / 2 - 12;
    const aX = rEnd - L.miniW / 2;
    const fX = aX - L.miniW - L.miniGap;
    const miniTop = topY + 6, miniH = CARD_H - 12;

    const mcg = scene.add.graphics();
    mcg.fillStyle(0x111122, 0.8);
    for (const [mx, clr] of [[fX, 0x78C828], [aX, 0x7B2FBE]] as [number, number][]) {
        mcg.fillRoundedRect(mx - L.miniW / 2, miniTop, L.miniW, miniH, MINI_R);
        mcg.lineStyle(1, clr, 0.35);
        mcg.strokeRoundedRect(mx - L.miniW / 2, miniTop, L.miniW, miniH, MINI_R);
    }
    ct.add(mcg);

    const addCol = (colX: number, count: number, label: string, clr: number, drk: number, ad: boolean) => {
        const hd = scene.add.text(colX, miniTop + 16, t(`buff_${cfg.buffType}`, { count }), {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1.5,
        }).setOrigin(0.5);
        fitText(hd, L.miniW - 12, 14); ct.add(hd);
        ct.add(scene.add.text(colX, miniTop + 30, t(`buff_desc_${cfg.buffType}`), {
            fontFamily: UI.FONT_STROKE, fontSize: '10px', color: buffClr,
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(0.5));
        addBtn(scene, ct, colX, miniTop + 54, label, clr, drk, L.mbtnW, () => onClaim(type, ad));
    };
    addCol(fX, cfg.freeCount, t('quest_claim'), 0x78C828, 0x4E8A18, false);
    addCol(aX, cfg.adCount, t('quest_watch'), 0x7B2FBE, 0x4A1A72, true);
}

function addBtn(
    scene: Scene, ct: GameObjects.Container, cx: number, cy: number,
    label: string, clr: number, drk: number, bw: number, onClick: () => void,
): void {
    const wrap = scene.add.container(cx, cy), g = scene.add.graphics();
    const hh = MBTN_H / 2;
    g.fillStyle(drk, 1).fillRoundedRect(-bw / 2, -hh + 2, bw, MBTN_H, MBTN_R);
    g.fillStyle(clr, 1).fillRoundedRect(-bw / 2, -hh, bw, MBTN_H - 2, MBTN_R);
    g.fillStyle(0xffffff, 0.15).fillRoundedRect(-bw / 2 + 3, -hh + 1, bw - 6,
        (MBTN_H - 2) * 0.4, { tl: MBTN_R - 1, tr: MBTN_R - 1, bl: 0, br: 0 });
    g.lineStyle(1, 0x000000, 0.2).strokeRoundedRect(-bw / 2, -hh, bw, MBTN_H, MBTN_R);
    wrap.add(g);
    const txt = scene.add.text(0, -1, label, {
        fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 1.5,
    }).setOrigin(0.5);
    fitText(txt, bw - 10, 12); wrap.add(txt);
    wrap.setSize(bw, MBTN_H + 2);
    addShineEffect(scene, wrap, bw, MBTN_H, MBTN_R);
    wrap.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
    addButtonFeedback(scene, wrap); ct.add(wrap);
}

function drawBar(
    scene: Scene, ct: GameObjects.Container,
    x: number, y: number, cur: number, tgt: number, bw: number,
): void {
    const bg = scene.add.graphics();
    bg.fillStyle(0x222244, 0.5).fillRoundedRect(x, y, bw, BAR_H, BAR_R);
    bg.lineStyle(2, 0x000000, 0.3).strokeRoundedRect(x, y, bw, BAR_H, BAR_R);
    ct.add(bg);
    const p = Math.min(1, tgt > 0 ? cur / tgt : 0);
    const fw = Math.max(0, (bw - 4) * p);
    if (fw >= 4) {
        const fill = scene.add.graphics(), r = Math.min(BAR_R - 1, fw / 2);
        fill.fillStyle(BAR_COLOR, 1).fillRoundedRect(x + 2, y + 2, fw, BAR_H - 4, r);
        if (fw > 4) {
            const hr = fw >= BAR_H - 4 ? { tl: r - 1, tr: r - 1, bl: 0, br: 0 } : 0;
            fill.fillStyle(0xffffff, 0.2).fillRoundedRect(x + 3, y + 3, fw - 2, (BAR_H - 6) * 0.4, hr);
        }
        ct.add(fill);
    }
}
