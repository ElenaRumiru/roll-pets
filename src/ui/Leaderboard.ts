import { GameObjects, Geom, Scene } from 'phaser';
import { UI, LEFT_PANEL, GRADE, getGradeForChance, getOddsString } from '../core/config';
import { t } from '../data/locales';
import { LeaderboardEntry, LeagueConfig } from '../types';

const PANEL_W = 163;
const RADIUS = 9;
const VISIBLE_ROWS = 5;
const ROW_H = 17;
const ICON_AREA = 48;
const HEADER_Y = ICON_AREA + 34;
const ROW_START_Y = HEADER_Y + 21;
const COMPACT_H = ROW_START_Y + VISIBLE_ROWS * ROW_H + 8;
const SEP_Y = ROW_START_Y + VISIBLE_ROWS * ROW_H + 3;
const PLAYER_Y = SEP_Y + 4;
const EXPANDED_H = PLAYER_Y + 19 + 8;

export class Leaderboard extends GameObjects.Container {
    private bg: GameObjects.Graphics;
    private leagueName: GameObjects.Text;
    private rowTexts: { rank: GameObjects.Text; name: GameObjects.Text; odds: GameObjects.Text }[] = [];
    private separator: GameObjects.Graphics;
    private playerBg: GameObjects.Graphics;
    private playerRankText: GameObjects.Text;
    private playerNameText: GameObjects.Text;
    private playerOddsText: GameObjects.Text;
    private currentH = EXPANDED_H;

    constructor(scene: Scene, onClick: () => void) {
        super(scene, LEFT_PANEL.x, 0);

        // Panel background (redrawn dynamically)
        this.bg = scene.add.graphics();
        this.add(this.bg);
        this.drawBg(EXPANDED_H);

        // Rating icon (protruding above panel, 1:1 pixel mapping — no setDisplaySize)
        const icon = scene.add.image(PANEL_W / 2, ICON_AREA - 10, 'ui_rating_mid');
        this.add(icon);

        // League title
        this.leagueName = scene.add.text(PANEL_W / 2, ICON_AREA + 9, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '15px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5, 0);
        this.add(this.leagueName);

        // Column headers
        this.add(scene.add.text(8, HEADER_Y, `#  ${t('leaderboard_player')}`, {
            fontFamily: UI.FONT_STROKE, fontSize: '10px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }));
        this.add(scene.add.text(PANEL_W - 8, HEADER_Y, t('leaderboard_grade'), {
            fontFamily: UI.FONT_STROKE, fontSize: '10px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(1, 0));

        const headerLine = scene.add.graphics();
        headerLine.lineStyle(1, 0xaaaaaa, 0.5);
        headerLine.lineBetween(8, HEADER_Y + 17, PANEL_W - 8, HEADER_Y + 17);
        this.add(headerLine);

        // 5 dynamic row slots
        for (let i = 0; i < VISIBLE_ROWS; i++) {
            const y = ROW_START_Y + i * ROW_H;
            const rank = scene.add.text(8, y, '', {
                fontFamily: UI.FONT_STROKE, fontSize: '10px', color: '#ffffff',
                stroke: '#000000', strokeThickness: 1,
            });
            const name = scene.add.text(25, y, '', {
                fontFamily: UI.FONT_STROKE, fontSize: '10px', color: '#ffffff',
                stroke: '#000000', strokeThickness: 1,
            });
            const odds = scene.add.text(PANEL_W - 8, y, '', {
                fontFamily: UI.FONT_STROKE, fontSize: '10px', color: '#ffffff',
                stroke: '#000000', strokeThickness: 1,
            }).setOrigin(1, 0);
            this.add(rank); this.add(name); this.add(odds);
            this.rowTexts.push({ rank, name, odds });
        }

        // Separator + player row
        this.separator = scene.add.graphics();
        this.separator.lineStyle(1, 0x888888, 0.8);
        this.separator.lineBetween(8, SEP_Y, PANEL_W - 8, SEP_Y);
        this.add(this.separator);

        this.playerBg = scene.add.graphics();
        this.playerBg.fillStyle(0xffc107, 0.15);
        this.playerBg.fillRoundedRect(4, PLAYER_Y - 2, PANEL_W - 8, 19, 4);
        this.add(this.playerBg);

        this.playerRankText = scene.add.text(8, PLAYER_Y, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '10px', color: '#ffc107',
            stroke: '#000000', strokeThickness: 1,
        });
        this.playerNameText = scene.add.text(30, PLAYER_Y, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '10px', color: '#ffc107',
            stroke: '#000000', strokeThickness: 1,
        });
        this.playerOddsText = scene.add.text(PANEL_W - 8, PLAYER_Y, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '10px', color: '#ffc107',
            stroke: '#000000', strokeThickness: 1,
        }).setOrigin(1, 0);
        this.add(this.playerRankText); this.add(this.playerNameText); this.add(this.playerOddsText);

        // Clickable
        this.setInteractive(new Geom.Rectangle(0, 0, PANEL_W, EXPANDED_H), Geom.Rectangle.Contains);
        this.input!.hitArea = new Geom.Rectangle(0, 0, PANEL_W, EXPANDED_H);
        this.on('pointerdown', onClick);

        scene.add.existing(this);
    }

    updateDisplay(entries: LeaderboardEntry[], playerRank: number, league: LeagueConfig): void {
        this.leagueName.setText(t(league.label));
        this.leagueName.setColor(league.colorHex);

        const top5 = entries.slice(0, VISIBLE_ROWS);
        for (let i = 0; i < VISIBLE_ROWS; i++) {
            const row = this.rowTexts[i];
            if (i < top5.length) {
                const entry = top5[i];
                const grade = getGradeForChance(entry.chance);
                const cfg = GRADE[grade];
                row.rank.setText(`${i + 1}.`);
                row.name.setText(entry.name);
                row.odds.setText(getOddsString(entry.chance));
                row.odds.setColor(cfg.colorHex);
                row.odds.setStroke(cfg.outlineHex, cfg.strokeThickness || 1);
                const textColor = entry.isPlayer ? '#ffc107' : '#ffffff';
                row.rank.setColor(textColor);
                row.name.setColor(textColor);
            }
        }

        const inTop5 = playerRank <= VISIBLE_ROWS;
        this.separator.setVisible(!inTop5);
        this.playerBg.setVisible(!inTop5);
        this.playerRankText.setVisible(!inTop5);
        this.playerNameText.setVisible(!inTop5);
        this.playerOddsText.setVisible(!inTop5);

        // Dynamic panel height
        const newH = inTop5 ? COMPACT_H : EXPANDED_H;
        if (newH !== this.currentH) {
            this.currentH = newH;
            this.drawBg(newH);
            this.input!.hitArea = new Geom.Rectangle(0, 0, PANEL_W, newH);
        }

        if (!inTop5) {
            const pe = entries.find(e => e.isPlayer);
            if (pe) {
                this.playerRankText.setText(`${playerRank}.`);
                this.playerNameText.setText(pe.name);
                this.playerOddsText.setText(getOddsString(pe.chance));
            }
        }
    }

    private drawBg(h: number): void {
        this.bg.clear();
        this.bg.fillStyle(0x111122, 0.75);
        this.bg.fillRoundedRect(0, ICON_AREA, PANEL_W, h - ICON_AREA, RADIUS);
        this.bg.lineStyle(2, 0xffffff, 0.2);
        this.bg.strokeRoundedRect(0, ICON_AREA, PANEL_W, h - ICON_AREA, RADIUS);
    }
}
