import { Scene } from 'phaser';
import { UI, GRADE, getGradeForChance, getOddsString } from '../core/config';
import { getGameWidth, getGameHeight, isPortrait } from '../core/orientation';
import { GameManager } from '../core/GameManager';
import { LEAGUES } from '../data/leaderboard';
import { PETS } from '../data/pets';
import { Button } from '../ui/components/Button';
import { t } from '../data/locales';
import { LeaderboardEntry, LeagueTier } from '../types';
import { createSceneHeader } from '../ui/SceneHeader';

const HEADER_H = 74;

export class LeaderboardScene extends Scene {
    private manager!: GameManager;
    private entriesContainer!: Phaser.GameObjects.Container;
    private leagueTitle!: Phaser.GameObjects.Text;
    private tabs: Button[] = [];
    private port = false;
    private contentW = 500;
    private rowH = 26;
    private tabsY = 0;
    private titleY = 0;
    private tableY = 0;

    constructor() { super('LeaderboardScene'); }

    create(): void {
        this.manager = this.registry.get('gameManager') as GameManager;
        this.tabs = [];
        const gw = getGameWidth(), gh = getGameHeight();
        this.port = isPortrait();

        // Portrait: bigger rows, wider content, more spacing
        this.contentW = this.port ? 540 : 500;
        this.rowH = this.port ? 36 : 26;

        // Vertical layout
        if (this.port) {
            this.tabsY = HEADER_H + 40;
            this.titleY = HEADER_H + 95;
            this.tableY = HEADER_H + 130;
        } else {
            this.tabsY = HEADER_H + 25;
            this.titleY = HEADER_H + 60;
            this.tableY = HEADER_H + 82;
        }

        this.add.rectangle(gw / 2, gh / 2, gw, gh, 0x12121e);
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
        const gw = getGameWidth();
        const tabW = this.port ? 95 : 90;
        const tabH = this.port ? 34 : 28;
        const tabGap = this.port ? 6 : 8;
        const totalW = LEAGUES.length * tabW + (LEAGUES.length - 1) * tabGap;
        const startX = gw / 2 - totalW / 2 + tabW / 2;
        const currentTier = this.manager.leaderboard.getPlayerLeague(this.getBestChance()).tier;

        LEAGUES.forEach((league, i) => {
            const x = startX + i * (tabW + tabGap);
            const color = league.tier === currentTier ? league.color : 0x333344;
            const btn = new Button(this, x, this.tabsY, tabW, tabH, t(league.label), color, () => {
                this.showLeague(league.tier);
            });
            this.tabs.push(btn);
        });

        this.leagueTitle = this.add.text(gw / 2, this.titleY, '', {
            fontFamily: UI.FONT_STROKE, fontSize: this.port ? '22px' : '20px', color: '#ffffff',
            stroke: '#000000', strokeThickness: UI.STROKE_MEDIUM,
        }).setOrigin(0.5);
    }

    private showLeague(tier: LeagueTier): void {
        this.entriesContainer.removeAll(true);
        const gw = getGameWidth();
        const cw = this.contentW, rh = this.rowH;
        const fs = this.port ? '15px' : '13px';

        const league = LEAGUES.find(l => l.tier === tier)!;
        this.leagueTitle.setText(t(league.label));
        this.leagueTitle.setColor(league.colorHex);

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
            entries = this.manager.leaderboard.getEntries(nickname, bestChance).entries;
        } else {
            const bots = this.manager.leaderboard.getBotsForLeague(tier);
            entries = [...bots].sort((a, b) => b.chance - a.chance);
        }

        const startX = (gw - cw) / 2;
        const headerY = this.tableY;

        this.addEntry(startX + 10, headerY, '#', '#888888', false, fs);
        this.addEntry(startX + 45, headerY, t('leaderboard_player'), '#888888', false, fs);
        this.addEntry(startX + cw - 10, headerY, t('leaderboard_grade'), '#888888', true, fs);

        const lineY = headerY + 20;
        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(1, 0x444455, 0.5);
        lineGfx.lineBetween(startX, lineY, startX + cw, lineY);
        this.entriesContainer.add(lineGfx);

        const firstRowY = lineY + (this.port ? 16 : 10);
        entries.forEach((entry, i) => {
            const y = firstRowY + i * rh;
            const grade = getGradeForChance(entry.chance);
            const gradeCfg = GRADE[grade];
            const isPlayerRow = entry.isPlayer && isPlayerLeague;

            if (isPlayerRow) {
                const hl = this.add.graphics();
                hl.fillStyle(0xffc107, 0.15);
                hl.fillRoundedRect(startX, y - 4, cw, rh - 2, 6);
                this.entriesContainer.add(hl);
            }

            const color = isPlayerRow ? '#ffc107' : '#ffffff';
            this.addEntry(startX + 10, y, `${i + 1}.`, color, false, fs);
            this.addEntry(startX + 45, y, entry.name, color, false, fs);
            this.addEntry(startX + cw - 10, y, getOddsString(entry.chance),
                gradeCfg.colorHex, true, fs, gradeCfg.outlineHex, gradeCfg.strokeThickness || 1);
        });
    }

    private addEntry(
        x: number, y: number, text: string, color: string,
        rightAlign = false, fontSize = '13px', stroke?: string, strokeW?: number,
    ): void {
        const txt = this.add.text(x, y, text, {
            fontFamily: UI.FONT_STROKE, fontSize, color,
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

    update(_time: number, delta: number): void {
        this.manager.update(delta);
    }
}
