import { GameObjects, Scene } from 'phaser';
import { UI } from '../../core/config';
import { fitText } from './fitText';
import { AudioSystem } from '../../systems/AudioSystem';

export interface DropdownOption {
    value: string;
    label: string;
    color?: number;
    count?: string;
}

const PILL_H = 26; // 15% shorter than 30
const PILL_R = 10;
const ITEM_H = 30;
const MAX_VISIBLE = 12;
const DEPTH = 400;

export class Dropdown extends GameObjects.Container {
    private pillGfx: GameObjects.Graphics;
    private pillText: GameObjects.Text;
    private listContainer: GameObjects.Container;
    private listBg: GameObjects.Graphics;
    private isOpen = false;
    private selected: string;
    private options: DropdownOption[];
    private onChange: (value: string) => void;
    private outsideHandler: (() => void) | null = null;
    private pillW: number;
    private listW: number;

    constructor(scene: Scene, x: number, y: number, w: number, options: DropdownOption[],
        defaultValue: string, onChange: (value: string) => void, listWidth?: number) {
        super(scene, x, y);
        this.options = options;
        this.selected = defaultValue;
        this.onChange = onChange;
        this.pillW = w;
        this.listW = listWidth ?? w;

        this.pillGfx = scene.add.graphics();
        this.drawPill();
        this.add(this.pillGfx);

        const sel = options.find(o => o.value === defaultValue) ?? options[0];
        this.pillText = scene.add.text(w - 10, PILL_H / 2, sel.label + ' \u25be', {
            fontFamily: UI.FONT_STROKE, fontSize: '14px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(1, 0.5);
        fitText(this.pillText, w - 14, 14, 9);
        this.add(this.pillText);

        this.listBg = scene.add.graphics();
        // Offset list so its right edge aligns with pill's right edge
        const listOffX = w - this.listW;
        this.listContainer = scene.add.container(listOffX, PILL_H + 4);
        this.listContainer.add(this.listBg);
        this.listContainer.setVisible(false);
        this.listContainer.setDepth(DEPTH);
        this.add(this.listContainer);

        this.setSize(w, PILL_H);

        // Use a Zone for reliable click detection (no scale-related hitbox issues)
        const pillZone = scene.add.zone(w / 2, PILL_H / 2, w, PILL_H).setInteractive({ useHandCursor: true });
        pillZone.on('pointerdown', () => {
            const audio = scene.registry.get('audio') as AudioSystem | undefined;
            audio?.playSfx('sfx_click', 1.0);
            if (this.isOpen) this.close(); else this.open();
        });
        this.add(pillZone);

        scene.add.existing(this);
    }

    private drawPill(): void {
        const w = this.pillW;
        this.pillGfx.clear();
        this.pillGfx.fillStyle(0x111122, 1);
        this.pillGfx.fillRoundedRect(0, 0, w, PILL_H, PILL_R);
        this.pillGfx.lineStyle(2, 0xffffff, 0.2);
        this.pillGfx.strokeRoundedRect(0, 0, w, PILL_H, PILL_R);
    }

    private open(): void {
        if (this.isOpen) return;
        this.isOpen = true;
        const w = this.listW;
        const count = Math.min(this.options.length, MAX_VISIBLE);
        const listH = count * ITEM_H + 6;

        this.listBg.clear();
        this.listBg.fillStyle(0x111122, 0.97);
        this.listBg.fillRoundedRect(0, 0, w, listH, 8);
        this.listBg.lineStyle(2, 0xffffff, 0.2);
        this.listBg.strokeRoundedRect(0, 0, w, listH, 8);

        // Remove old items (keep bg at index 0)
        while (this.listContainer.list.length > 1) {
            (this.listContainer.list[this.listContainer.list.length - 1] as GameObjects.GameObject).destroy();
        }

        for (let i = 0; i < this.options.length; i++) {
            const opt = this.options[i];
            const iy = 3 + i * ITEM_H;
            const isSelected = opt.value === this.selected;

            if (isSelected) {
                const hl = this.scene.add.graphics();
                hl.fillStyle(0xffffff, 0.08);
                hl.fillRoundedRect(3, iy, w - 6, ITEM_H, 4);
                this.listContainer.add(hl);
            }

            if (opt.color !== undefined) {
                const dot = this.scene.add.graphics();
                dot.fillStyle(opt.color, 1);
                dot.fillCircle(14, iy + ITEM_H / 2, 5);
                this.listContainer.add(dot);
            }

            const lx = opt.color !== undefined ? 26 : 10;
            let text = opt.label;
            if (opt.count) text += ` ${opt.count}`;
            const txt = this.scene.add.text(lx, iy + ITEM_H / 2, text, {
                fontFamily: UI.FONT_STROKE, fontSize: '13px',
                color: isSelected ? '#ffffff' : '#cccccc',
                stroke: '#000000', strokeThickness: 1,
            }).setOrigin(0, 0.5);
            fitText(txt, w - lx - 6, 13, 9);
            this.listContainer.add(txt);

            const zone = this.scene.add.zone(w / 2, iy + ITEM_H / 2, w, ITEM_H).setInteractive();
            zone.on('pointerdown', () => {
                const audio = this.scene.registry.get('audio') as AudioSystem | undefined;
                audio?.playSfx('sfx_click', 1.0);
                this.selectOption(opt.value);
            });
            this.listContainer.add(zone);
        }

        this.listContainer.setVisible(true);
        this.outsideHandler = () => { if (this.isOpen) this.close(); };
        this.scene.time.delayedCall(50, () => {
            this.scene.input.on('pointerdown', this.outsideHandler!);
        });
    }

    close(): void {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.listContainer.setVisible(false);
        if (this.outsideHandler) {
            this.scene.input.off('pointerdown', this.outsideHandler);
            this.outsideHandler = null;
        }
    }

    private selectOption(value: string): void {
        this.selected = value;
        const opt = this.options.find(o => o.value === value) ?? this.options[0];
        this.pillText.setText(opt.label + ' \u25be');
        fitText(this.pillText, this.pillW - 14, 14, 9);
        this.close();
        this.onChange(value);
    }

    getSelected(): string { return this.selected; }

    destroy(fromScene?: boolean): void {
        this.close();
        super.destroy(fromScene);
    }
}
