import { GameObjects, Scene } from 'phaser';
import { UI, LEFT_PANEL, GAME_HEIGHT, GRADE, getGradeForChance } from '../core/config';
import { t } from '../data/locales';

const PANEL_W = LEFT_PANEL.w;
const PANEL_H = 204;
const RADIUS = 10;

const FAKE_ENTRIES = [
    { name: 'ProGamer', odds: '1/500K', chance: 500_000 },
    { name: 'LuckyPet', odds: '1/200K', chance: 200_000 },
    { name: 'xXPetFanXx', odds: '1/100K', chance: 100_000 },
    { name: 'PetMaster', odds: '1/50K', chance: 50_000 },
    { name: 'CoolDude', odds: '1/10K', chance: 10_000 },
];

export class Leaderboard extends GameObjects.Container {
    private playerNameText: GameObjects.Text;
    private playerOddsText: GameObjects.Text;
    private playerRankText: GameObjects.Text;

    constructor(scene: Scene) {
        super(scene, LEFT_PANEL.x, Math.round((GAME_HEIGHT - PANEL_H) / 2) - 22);

        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.75);
        bg.fillRoundedRect(0, 0, PANEL_W, PANEL_H, RADIUS);
        this.add(bg);

        const title = scene.add.text(PANEL_W / 2, 12, t('leaderboard_title'), {
            fontFamily: UI.FONT_STROKE,
            fontSize: '17px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5, 0);
        this.add(title);

        const headerY = 42;
        const hdr = scene.add.text(10, headerY, `#  ${t('leaderboard_player')}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        });
        this.add(hdr);
        const hdr2 = scene.add.text(PANEL_W - 10, headerY, t('leaderboard_grade'), {
            fontFamily: UI.FONT_STROKE, fontSize: '11px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(1, 0);
        this.add(hdr2);

        const headerLine = scene.add.graphics();
        headerLine.lineStyle(1, 0xaaaaaa, 0.5);
        headerLine.lineBetween(10, headerY + 20, PANEL_W - 10, headerY + 20);
        this.add(headerLine);

        const rowStartY = headerY + 25;
        const rowH = 20;
        FAKE_ENTRIES.forEach((entry, i) => {
            const y = rowStartY + i * rowH;
            const grade = getGradeForChance(entry.chance);
            const cfg = GRADE[grade];

            const rank = scene.add.text(10, y, `${i + 1}.`, {
                fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#ffffff',
                stroke: '#000000', strokeThickness: 1,
            });
            this.add(rank);

            const name = scene.add.text(30, y, entry.name, {
                fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#ffffff',
                stroke: '#000000', strokeThickness: 1,
            });
            this.add(name);

            const odds = scene.add.text(PANEL_W - 10, y, entry.odds, {
                fontFamily: UI.FONT_STROKE, fontSize: '12px', color: cfg.colorHex,
                stroke: cfg.outlineHex, strokeThickness: cfg.strokeThickness || 1,
            }).setOrigin(1, 0);
            this.add(odds);
        });

        const sepY = rowStartY + FAKE_ENTRIES.length * rowH + 3;
        const sep = scene.add.graphics();
        sep.lineStyle(1, 0x888888, 0.8);
        sep.lineBetween(10, sepY, PANEL_W - 10, sepY);
        this.add(sep);

        const playerY = sepY + 5;
        const playerBg = scene.add.graphics();
        playerBg.fillStyle(0xffc107, 0.15);
        playerBg.fillRoundedRect(5, playerY - 2, PANEL_W - 10, 22, 5);
        this.add(playerBg);

        this.playerRankText = scene.add.text(10, playerY, '30.', {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#ffc107',
            stroke: '#000000', strokeThickness: 1,
        });
        this.add(this.playerRankText);

        this.playerNameText = scene.add.text(35, playerY, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#ffc107',
            stroke: '#000000', strokeThickness: 1,
        });
        this.add(this.playerNameText);

        this.playerOddsText = scene.add.text(PANEL_W - 10, playerY, '1/500', {
            fontFamily: UI.FONT_STROKE, fontSize: '12px', color: '#ffc107',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(1, 0);
        this.add(this.playerOddsText);

        scene.add.existing(this);
    }

    updatePlayerEntry(nickname: string, bestOdds: string, rank: number): void {
        this.playerRankText.setText(`${rank}.`);
        this.playerNameText.setText(nickname);
        this.playerOddsText.setText(bestOdds);
    }
}
