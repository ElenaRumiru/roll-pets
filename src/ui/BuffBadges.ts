import { GameObjects, Scene } from 'phaser';
import { UI, BUFF_CONFIG } from '../core/config';
import { BuffSystem } from '../systems/BuffSystem';
import { t } from '../data/locales';

interface Badge {
    container: GameObjects.Container;
    bg: GameObjects.Graphics;
    text: GameObjects.Text;
    key: string;
    tooltipKey: string;
}

const BADGE_W = 68;
const BADGE_H = 20;
const BADGE_R = 5;
const BADGE_GAP = 4;

const TOOLTIP_KEYS: Record<string, string> = {
    lucky: 'tip_lucky',
    super: 'tip_super',
    epic: 'tip_epic',
    auto: 'tip_autoroll',
};

export class BuffBadges extends GameObjects.Container {
    private badges: Badge[] = [];
    private bgPanel: GameObjects.Graphics;
    private tooltipBg: GameObjects.Graphics;
    private tooltipText: GameObjects.Text;
    private longPressTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y);

        // Dark background behind all badges
        this.bgPanel = scene.add.graphics();
        this.add(this.bgPanel);

        this.createBadge(scene, 'lucky', BUFF_CONFIG.lucky.color);
        this.createBadge(scene, 'super', BUFF_CONFIG.super.color);
        this.createBadge(scene, 'epic',  BUFF_CONFIG.epic.color);
        this.createBadge(scene, 'auto',  BUFF_CONFIG.autoroll.color);

        // Shared tooltip
        this.tooltipBg = scene.add.graphics().setDepth(200);
        this.tooltipText = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
            align: 'center',
            wordWrap: { width: 130 },
        }).setOrigin(0.5).setDepth(200);
        this.tooltipBg.setVisible(false);
        this.tooltipText.setVisible(false);

        scene.add.existing(this);
    }

    private createBadge(scene: Scene, key: string, color: number): void {
        const c = scene.add.container(0, 0);

        const bg = scene.add.graphics();
        bg.fillStyle(color, 0.85);
        bg.fillRoundedRect(-BADGE_W / 2, -BADGE_H / 2, BADGE_W, BADGE_H, BADGE_R);
        bg.lineStyle(1.5, 0x000000, 0.25);
        bg.strokeRoundedRect(-BADGE_W / 2, -BADGE_H / 2, BADGE_W, BADGE_H, BADGE_R);
        c.add(bg);

        const txt = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_MAIN,
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0.5);
        c.add(txt);

        // Long-press tooltip
        c.setSize(BADGE_W, BADGE_H);
        c.setInteractive();
        const tooltipKey = TOOLTIP_KEYS[key] || '';

        c.on('pointerdown', () => {
            this.longPressTimer = scene.time.delayedCall(300, () => {
                this.showTooltip(c, tooltipKey);
            });
        });

        c.on('pointerup', () => this.cancelTooltip());
        c.on('pointerout', () => this.cancelTooltip());

        c.setVisible(false);
        this.add(c);
        this.badges.push({ container: c, bg, text: txt, key, tooltipKey });
    }

    private showTooltip(badge: GameObjects.Container, localeKey: string): void {
        const text = t(localeKey);
        this.tooltipText.setText(text);
        const padX = 14;
        const padY = 12;
        const tw = this.tooltipText.width + padX * 2;
        const th = this.tooltipText.height + padY * 2;
        // Position above the badge
        const worldX = this.x + badge.x;
        const worldY = this.y - BADGE_H - 35;
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

    updateFromBuffs(buffs: BuffSystem): void {
        this.setBadge('lucky', t('badge_lucky'), buffs.getCount('lucky'));
        this.setBadge('super', t('badge_super'), buffs.getCount('super'));
        this.setBadge('epic',  t('badge_epic'),  buffs.getCount('epic'));

        const autoMs = buffs.getAutorollRemaining();
        if (autoMs > 0) {
            const secs = Math.ceil(autoMs / 1000);
            this.setBadgeRaw('auto', `Auto ${secs}s`, true);
        } else {
            this.setBadgeRaw('auto', '', false);
        }

        this.layoutBadges();
    }

    private setBadge(key: string, label: string, count: number): void {
        this.setBadgeRaw(key, count > 0 ? `${label} x${count}` : '', count > 0);
    }

    private setBadgeRaw(key: string, text: string, visible: boolean): void {
        const badge = this.badges.find(b => b.key === key);
        if (!badge) return;
        badge.container.setVisible(visible);
        if (visible) badge.text.setText(text);
    }

    private layoutBadges(): void {
        const visible = this.badges.filter(b => b.container.visible);
        const totalW = visible.length * BADGE_W + Math.max(0, visible.length - 1) * BADGE_GAP;
        const startX = -totalW / 2 + BADGE_W / 2;
        visible.forEach((b, i) => b.container.setX(startX + i * (BADGE_W + BADGE_GAP)));

        this.bgPanel.clear();
    }
}
