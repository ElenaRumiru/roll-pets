import { GameObjects, Scene } from 'phaser';
import { UI, BUFF_CONFIG } from '../core/config';
import { BuffSystem } from '../systems/BuffSystem';
import { t } from '../data/locales';

interface Badge {
    container: GameObjects.Container;
    bg: GameObjects.Graphics;
    text: GameObjects.Text;
    key: string;
}

const BADGE_W = 64;
const BADGE_H = 20;
const BADGE_R = 8;
const BADGE_GAP = 4;

export class BuffBadges extends GameObjects.Container {
    private badges: Badge[] = [];

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y);

        this.createBadge(scene, 'lucky', BUFF_CONFIG.lucky.color);
        this.createBadge(scene, 'super', BUFF_CONFIG.super.color);
        this.createBadge(scene, 'epic',  BUFF_CONFIG.epic.color);
        this.createBadge(scene, 'auto',  BUFF_CONFIG.autoroll.color);

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

        c.setVisible(false);
        this.add(c);
        this.badges.push({ container: c, bg, text: txt, key });
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
    }
}
