import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI, GRADE, getGradeForChance, getOddsString } from '../core/config';
import { GameManager } from '../core/GameManager';
import { LEAGUES } from '../data/leaderboard';
import { PETS } from '../data/pets';
import { Button } from '../ui/components/Button';
import { t } from '../data/locales';
import { LeaderboardEntry, LeagueTier } from '../types';
import { createSceneHeader } from '../ui/SceneHeader';

const HEADER_H = 74;
const ROW_H = 26;
const CONTENT_W = 500;
const TAB_W = 90;
const TAB_GAP = 8;

export class LeaderboardScene extends Scene {
    private manager!: GameManager;
    private entriesContainer!: Phaser.GameObjects.Container;
    private leagueTitle!: Phaser.GameObjects.Text;
    private tabs: Button[] = [];

    constructor() { super('LeaderboardScene'); }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.tabs = [];
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e);
        this.entriesContainer = this.add.container(0, 0);
        createSceneHeader({
            scene: this, titleKey: 'leaderboard_scene_title', backKey: 'leaderboard_back',
            onBack: () => this.scene.start('MainScene'),
            coins: this.manager.progression.coins, depth: 10,
        });
        this.createTabs();

        const league = this.manager.leaderboard.getPlayerLeague(this.getBestChance());
        this.showLeague(league.tier);
    }

    private createTabs(): void {
        const totalW = LEAGUES.length * TAB_W + (LEAGUES.length - 1) * TAB_GAP;
        const startX = GAME_WIDTH / 2 - totalW / 2 + TAB_W / 2;
        const y = HEADER_H + 25;
        const currentTier = this.manager.leaderboard.getPlayerLeague(this.getBestChance()).tier;

        LEAGUES.forEach((league, i) => {
            const x = startX + i * (TAB_W + TAB_GAP);
            // Filled color = player's own league; gray = other leagues
            const color = league.tier === currentTier ? league.color : 0x333344;
            const btn = new Button(this, x, y, TAB_W, 28, t(league.label), color, () => {
                this.showLeague(league.tier);
            });
            this.tabs.push(btn);
        });

        const titleY = HEADER_H + 60;
        this.leagueTitle = this.add.text(GAME_WIDTH / 2, titleY, '', {
            fontFamily: UI.FONT_STROKE, fontSize: '20px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
    }

    private showLeague(tier: LeagueTier): void {
        this.entriesContainer.removeAll(true);

        const league = LEAGUES.find(l => l.tier === tier)!;
        this.leagueTitle.setText(t(league.label));
        this.leagueTitle.setColor(league.colorHex);

        // Fill = player's own league, outline = currently viewed tab
        const currentTier = this.manager.leaderboard.getPlayerLeague(this.getBestChance()).tier;
        LEAGUES.forEach((l, i) => {
            this.tabs[i].setColor(l.tier === currentTier ? l.color : 0x333344);
            this.tabs[i].setOutline(l.tier === tier ? l.color : null);
        });

        const bestChance = this.getBestChance();
        const nickname = this.manager.save.getNickname() || t('default_nickname');
        const isPlayerLeague = currentTier === tier;

        let entries: LeaderboardEntry[];
        if (isPlayerLeague) {
            const result = this.manager.leaderboard.getEntries(nickname, bestChance);
            entries = result.entries;
        } else {
            const bots = this.manager.leaderboard.getBotsForLeague(tier);
            entries = [...bots].sort((a, b) => b.chance - a.chance);
        }

        const startX = (GAME_WIDTH - CONTENT_W) / 2;
        const headerY = HEADER_H + 82;

        // Column headers
        this.addEntry(startX + 10, headerY, '#', '#888888');
        this.addEntry(startX + 45, headerY, t('leaderboard_player'), '#888888');
        this.addEntry(startX + CONTENT_W - 10, headerY, t('leaderboard_grade'), '#888888', true);

        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(1, 0x444455, 0.5);
        lineGfx.lineBetween(startX, headerY + 18, startX + CONTENT_W, headerY + 18);
        this.entriesContainer.add(lineGfx);

        // Rows
        entries.forEach((entry, i) => {
            const y = headerY + 24 + i * ROW_H;
            const grade = getGradeForChance(entry.chance);
            const gradeCfg = GRADE[grade];
            const isPlayerRow = entry.isPlayer && isPlayerLeague;

            if (isPlayerRow) {
                const hl = this.add.graphics();
                hl.fillStyle(0xffc107, 0.15);
                hl.fillRoundedRect(startX, y - 4, CONTENT_W, ROW_H - 2, 6);
                this.entriesContainer.add(hl);
            }

            const color = isPlayerRow ? '#ffc107' : '#ffffff';
            this.addEntry(startX + 10, y, `${i + 1}.`, color);
            this.addEntry(startX + 45, y, entry.name, color);
            this.addEntry(startX + CONTENT_W - 10, y, getOddsString(entry.chance),
                gradeCfg.colorHex, true, gradeCfg.outlineHex, gradeCfg.strokeThickness || 1);
        });
    }

    private addEntry(
        x: number, y: number, text: string, color: string,
        rightAlign = false, stroke?: string, strokeW?: number,
    ): void {
        const txt = this.add.text(x, y, text, {
            fontFamily: UI.FONT_STROKE, fontSize: '13px', color,
            stroke: stroke ?? '#000000', strokeThickness: strokeW ?? 1,
        });
        if (rightAlign) txt.setOrigin(1, 0);
        this.entriesContainer.add(txt);
    }

    private getBestChance(): number {
        const collected = PETS.filter(p => this.manager.progression.collection.has(p.id));
        if (collected.length === 0) return 2;
        return collected.reduce((a, b) => a.chance > b.chance ? a : b).chance;
    }
}
