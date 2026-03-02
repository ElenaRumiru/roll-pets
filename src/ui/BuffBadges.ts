import { GameObjects, Scene } from 'phaser';
import { UI, BUFF_CONFIG, REBIRTH_CONFIG } from '../core/config';
import { BuffSystem } from '../systems/BuffSystem';
import { t } from '../data/locales';

interface Badge {
    container: GameObjects.Container;
    bg: GameObjects.Graphics;
    icon: GameObjects.Image;
    text: GameObjects.Text;
    color: number;
    key: string;
    tooltipKey: string;
    dynamicTooltip?: string;
}

const BADGE_H = 28;
const BADGE_R = 7;
const BADGE_GAP = 4;
const ICON_SZ = 23;
const PAD_X = 6;
const ICON_TEXT_GAP = 2;

const TOOLTIP_KEYS: Record<string, string> = {
    lucky: 'tip_lucky',
    super: 'tip_super',
    epic: 'tip_epic',
    samsara: 'tip_samsara',
};

const BADGE_ICON: Record<string, string> = {
    lucky: 'luck_x2_md', super: 'luck_x3_md', epic: 'luck_x5_md', samsara: 'luck_x2_md',
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

        this.createBadge(scene, 'samsara', REBIRTH_CONFIG.color);
        this.createBadge(scene, 'lucky', BUFF_CONFIG.lucky.color);
        this.createBadge(scene, 'super', BUFF_CONFIG.super.color);
        this.createBadge(scene, 'epic',  BUFF_CONFIG.epic.color);

        // Shared tooltip
        this.tooltipBg = scene.add.graphics().setDepth(200);
        this.tooltipText = scene.add.text(0, 0, '', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '12px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
            align: 'center',
            wordWrap: { width: 160 },
        }).setOrigin(0.5).setDepth(200);
        this.tooltipBg.setVisible(false);
        this.tooltipText.setVisible(false);

        scene.add.existing(this);
    }

    private createBadge(scene: Scene, key: string, color: number): void {
        const c = scene.add.container(0, 0);

        const bg = scene.add.graphics();
        c.add(bg);

        const icon = scene.add.image(0, 1, BADGE_ICON[key] || 'luck_x2_md')
            .setDisplaySize(ICON_SZ, ICON_SZ);
        c.add(icon);

        const txt = scene.add.text(0, 1, '', {
            fontFamily: UI.FONT_STROKE,
            fontSize: '12px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: UI.STROKE_THIN,
        }).setOrigin(0, 0.5);
        c.add(txt);

        // Long-press tooltip
        c.setSize(60, BADGE_H);
        c.setInteractive();
        const tooltipKey = TOOLTIP_KEYS[key] || '';

        c.on('pointerdown', () => {
            this.longPressTimer = scene.time.delayedCall(300, () => {
                const b = this.badges.find(bd => bd.key === key);
                this.showTooltip(c, tooltipKey, b?.dynamicTooltip);
            });
        });

        c.on('pointerup', () => this.cancelTooltip());
        c.on('pointerout', () => this.cancelTooltip());

        c.setVisible(false);
        this.add(c);
        this.badges.push({ container: c, bg, icon, text: txt, color, key, tooltipKey });
    }

    private redrawBadge(badge: Badge): void {
        const textW = badge.text.width;
        const contentW = ICON_SZ + ICON_TEXT_GAP + textW;
        const badgeW = contentW + PAD_X * 2;

        // Position icon + text centered in pill
        const startX = -contentW / 2;
        badge.icon.setPosition(startX + ICON_SZ / 2, 1);
        badge.text.setX(startX + ICON_SZ + ICON_TEXT_GAP);

        badge.bg.clear();
        badge.bg.fillStyle(badge.color, 0.85);
        badge.bg.fillRoundedRect(-badgeW / 2, -BADGE_H / 2, badgeW, BADGE_H, BADGE_R);
        badge.bg.lineStyle(1.5, 0x000000, 0.25);
        badge.bg.strokeRoundedRect(-badgeW / 2, -BADGE_H / 2, badgeW, BADGE_H, BADGE_R);

        // Update interactive hit area to match new width
        badge.container.setSize(badgeW, BADGE_H);
        badge.container.setInteractive();
    }

    private showTooltip(badge: GameObjects.Container, localeKey: string, dynamicText?: string): void {
        const text = dynamicText || t(localeKey);
        this.tooltipText.setText(text);
        const padX = 17;
        const padY = 15;
        const tw = this.tooltipText.width + padX * 2;
        const th = this.tooltipText.height + padY * 2;
        // Position above the badge
        const worldX = this.x + badge.x;
        const worldY = this.y - BADGE_H - 43;
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
        const rm = buffs.getRebirthMultiplier();
        this.setBadgeRaw('samsara', rm > 1 ? `\u00d7${rm}` : '', rm > 1);
        const samsaraBadge = this.badges.find(b => b.key === 'samsara');
        if (samsaraBadge) {
            samsaraBadge.icon.setTexture(`luck_x${rm}_md`);
            samsaraBadge.dynamicTooltip = rm > 1
                ? `${t('tip_samsara')} (\u00d7${rm})` : undefined;
        }

        this.setBadge('lucky', buffs.getCount('lucky'));
        this.setBadge('super', buffs.getCount('super'));
        this.setBadge('epic',  buffs.getCount('epic'));

        this.layoutBadges();
    }

    private setBadge(key: string, count: number): void {
        this.setBadgeRaw(key, count > 0 ? `x${count}` : '', count > 0);
    }

    private setBadgeRaw(key: string, text: string, visible: boolean): void {
        const badge = this.badges.find(b => b.key === key);
        if (!badge) return;
        badge.container.setVisible(visible);
        if (visible) {
            badge.text.setText(text);
            this.redrawBadge(badge);
        }
    }

    private layoutBadges(): void {
        const visible = this.badges.filter(b => b.container.visible);
        const widths = visible.map(b => {
            const textW = b.text.width;
            return ICON_SZ + ICON_TEXT_GAP + textW + PAD_X * 2;
        });
        const totalW = widths.reduce((s, w) => s + w, 0)
            + Math.max(0, visible.length - 1) * BADGE_GAP;
        let curX = -totalW / 2;
        visible.forEach((b, i) => {
            b.container.setX(curX + widths[i] / 2);
            curX += widths[i] + BADGE_GAP;
        });

        this.bgPanel.clear();
    }
}
