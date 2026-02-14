import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI } from '../core/config';
import { t } from '../data/locales';
import { AudioSystem } from '../systems/AudioSystem';
import { SaveSystem } from '../systems/SaveSystem';

const PANEL_W = 320;
const PANEL_H = 220;
const SLIDER_W = 180;
const SLIDER_H = 8;

export class SettingsPanel extends GameObjects.Container {
    private overlay: GameObjects.Rectangle;
    private panel: GameObjects.Graphics;
    private musicToggle!: GameObjects.Text;
    private sliderTrack!: GameObjects.Graphics;
    private sliderFill!: GameObjects.Graphics;
    private sliderThumb!: GameObjects.Graphics;
    private audio: AudioSystem;
    private save: SaveSystem;
    private dragging = false;

    constructor(scene: Scene, audio: AudioSystem, save: SaveSystem) {
        super(scene, 0, 0);
        this.audio = audio;
        this.save = save;
        this.setDepth(1000);

        // Dark overlay
        this.overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
        this.overlay.setInteractive();
        this.overlay.on('pointerdown', () => this.hide());
        this.add(this.overlay);

        // Panel background
        const px = GAME_WIDTH / 2 - PANEL_W / 2;
        const py = GAME_HEIGHT / 2 - PANEL_H / 2;
        this.panel = scene.add.graphics();
        this.panel.fillStyle(UI.PANEL_BG, 0.95);
        this.panel.fillRoundedRect(px, py, PANEL_W, PANEL_H, UI.CORNER_RADIUS);
        this.panel.lineStyle(2, UI.PANEL_BORDER);
        this.panel.strokeRoundedRect(px, py, PANEL_W, PANEL_H, UI.CORNER_RADIUS);
        this.add(this.panel);

        // Title
        const title = scene.add.text(GAME_WIDTH / 2, py + 28, t('settings'), {
            fontFamily: UI.FONT_MAIN,
            fontSize: '20px',
            color: '#ffffff',
        }).setOrigin(0.5);
        this.add(title);

        // Close button
        const closeBtn = scene.add.text(px + PANEL_W - 20, py + 12, '\u2715', {
            fontFamily: UI.FONT_BODY,
            fontSize: '18px',
            color: '#aaaaaa',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.hide());
        closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#aaaaaa'));
        this.add(closeBtn);

        // Music toggle
        this.createMusicToggle(px, py);

        // Volume slider
        this.createVolumeSlider(px, py);

        scene.add.existing(this);
        this.setVisible(false);
    }

    private createMusicToggle(px: number, py: number): void {
        const labelY = py + 80;
        const label = this.scene.add.text(px + 30, labelY, t('settings_music'), {
            fontFamily: UI.FONT_BODY,
            fontSize: '16px',
            color: '#cccccc',
        }).setOrigin(0, 0.5);
        this.add(label);

        this.musicToggle = this.scene.add.text(
            px + PANEL_W - 30, labelY,
            this.audio.musicOn ? t('sound_on') : t('sound_off'),
            {
                fontFamily: UI.FONT_MAIN,
                fontSize: '14px',
                color: this.audio.musicOn ? '#00ff88' : '#ff5555',
            },
        ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        this.musicToggle.on('pointerdown', () => {
            const newState = !this.audio.musicOn;
            this.audio.setMusicOn(newState);
            this.musicToggle.setText(newState ? t('sound_on') : t('sound_off'));
            this.musicToggle.setColor(newState ? '#00ff88' : '#ff5555');
            this.save.getData().settings.music = newState;
            this.save.save();
        });

        this.add(this.musicToggle);
    }

    private createVolumeSlider(px: number, py: number): void {
        const labelY = py + 130;
        const sliderY = py + 160;
        const sliderX = px + (PANEL_W - SLIDER_W) / 2;

        const label = this.scene.add.text(px + 30, labelY, t('settings_volume'), {
            fontFamily: UI.FONT_BODY,
            fontSize: '16px',
            color: '#cccccc',
        }).setOrigin(0, 0.5);
        this.add(label);

        // Volume percentage text
        const pctText = this.scene.add.text(
            px + PANEL_W - 30, labelY,
            `${Math.round(this.audio.volume * 100)}%`,
            {
                fontFamily: UI.FONT_MAIN,
                fontSize: '14px',
                color: '#ffffff',
            },
        ).setOrigin(1, 0.5);
        this.add(pctText);

        // Track background
        this.sliderTrack = this.scene.add.graphics();
        this.sliderTrack.fillStyle(0x333355, 1);
        this.sliderTrack.fillRoundedRect(sliderX, sliderY - SLIDER_H / 2, SLIDER_W, SLIDER_H, 4);
        this.add(this.sliderTrack);

        // Fill
        this.sliderFill = this.scene.add.graphics();
        this.add(this.sliderFill);

        // Thumb
        this.sliderThumb = this.scene.add.graphics();
        this.add(this.sliderThumb);

        this.drawSlider(sliderX, sliderY, this.audio.volume);

        // Hit zone for slider interaction
        const hitZone = this.scene.add.rectangle(
            sliderX + SLIDER_W / 2, sliderY, SLIDER_W + 20, 30, 0x000000, 0,
        ).setInteractive({ useHandCursor: true, draggable: true });
        this.add(hitZone);

        const updateFromPointer = (pointerX: number) => {
            const local = pointerX - sliderX;
            const vol = Math.max(0, Math.min(1, local / SLIDER_W));
            this.audio.setVolume(vol);
            this.drawSlider(sliderX, sliderY, vol);
            pctText.setText(`${Math.round(vol * 100)}%`);
            this.save.getData().settings.volume = vol;
            this.save.save();
        };

        hitZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
            this.dragging = true;
            updateFromPointer(p.x);
        });

        this.scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (this.dragging) updateFromPointer(p.x);
        });

        this.scene.input.on('pointerup', () => {
            this.dragging = false;
        });
    }

    private drawSlider(x: number, y: number, value: number): void {
        const fillW = SLIDER_W * value;
        const thumbX = x + fillW;

        this.sliderFill.clear();
        this.sliderFill.fillStyle(UI.PRIMARY_GREEN, 1);
        if (fillW > 0) {
            this.sliderFill.fillRoundedRect(x, y - SLIDER_H / 2, fillW, SLIDER_H, 4);
        }

        this.sliderThumb.clear();
        this.sliderThumb.fillStyle(0xffffff, 1);
        this.sliderThumb.fillCircle(thumbX, y, 10);
        this.sliderThumb.fillStyle(UI.PRIMARY_GREEN, 1);
        this.sliderThumb.fillCircle(thumbX, y, 7);
    }

    show(): void {
        this.setVisible(true);
        this.musicToggle.setText(this.audio.musicOn ? t('sound_on') : t('sound_off'));
        this.musicToggle.setColor(this.audio.musicOn ? '#00ff88' : '#ff5555');
    }

    hide(): void {
        this.setVisible(false);
        this.dragging = false;
    }

    get isVisible(): boolean {
        return this.visible;
    }
}
