import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI } from '../core/config';
import { t } from '../data/locales';
import { AudioSystem } from '../systems/AudioSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { addButtonFeedback } from './components/buttonFeedback';

const PANEL_W = 320;
const PANEL_H = 340;
const SLIDER_H = 8;

export class SettingsPanel extends GameObjects.Container {
    private overlay: GameObjects.Rectangle;
    private musicToggle!: GameObjects.Text;
    private sfxToggle!: GameObjects.Text;
    private audio: AudioSystem;
    private save: SaveSystem;
    private draggingMusic = false;
    private draggingSfx = false;

    constructor(scene: Scene, audio: AudioSystem, save: SaveSystem) {
        super(scene, 0, 0);
        this.audio = audio;
        this.save = save;
        this.setDepth(1000);

        const px = GAME_WIDTH / 2 - PANEL_W / 2;
        const py = GAME_HEIGHT / 2 - PANEL_H / 2;

        // Dark overlay
        this.overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
        this.overlay.setInteractive();
        this.overlay.on('pointerdown', () => this.hide());
        this.add(this.overlay);

        // Panel background
        const panel = scene.add.graphics();
        panel.fillStyle(UI.PANEL_BG, 0.95);
        panel.fillRoundedRect(px, py, PANEL_W, PANEL_H, UI.CORNER_RADIUS);
        panel.lineStyle(2, UI.PANEL_BORDER);
        panel.strokeRoundedRect(px, py, PANEL_W, PANEL_H, UI.CORNER_RADIUS);
        this.add(panel);

        // Title
        const title = scene.add.text(GAME_WIDTH / 2, py + 28, t('settings'), {
            fontFamily: UI.FONT_MAIN, fontSize: '20px', color: '#ffffff',
        }).setOrigin(0.5);
        this.add(title);

        // Close button
        const closeBtn = scene.add.text(px + PANEL_W - 20, py + 12, '\u2715', {
            fontFamily: UI.FONT_BODY, fontSize: '18px', color: '#aaaaaa',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.hide());
        closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#aaaaaa'));
        addButtonFeedback(scene, closeBtn, { clickEffect: false });
        this.add(closeBtn);

        // --- Music section ---
        this.createMusicToggle(px, py + 70);
        this.createSlider(px, py + 100, 'music');

        // --- SFX section ---
        this.createSfxToggle(px, py + 170);
        this.createSlider(px, py + 200, 'sfx');

        // Global pointer events
        scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (this.draggingMusic) this.musicSliderUpdate?.(p.x);
            if (this.draggingSfx) this.sfxSliderUpdate?.(p.x);
        });
        scene.input.on('pointerup', () => {
            this.draggingMusic = false;
            this.draggingSfx = false;
        });

        scene.add.existing(this);
        this.setVisible(false);
    }

    private musicSliderUpdate: ((x: number) => void) | null = null;
    private sfxSliderUpdate: ((x: number) => void) | null = null;

    private createMusicToggle(px: number, y: number): void {
        const label = this.scene.add.text(px + 30, y, t('settings_music'), {
            fontFamily: UI.FONT_BODY, fontSize: '16px', color: '#cccccc',
        }).setOrigin(0, 0.5);
        this.add(label);

        this.musicToggle = this.scene.add.text(
            px + PANEL_W - 30, y,
            this.audio.musicOn ? t('sound_on') : t('sound_off'),
            { fontFamily: UI.FONT_MAIN, fontSize: '14px', color: this.audio.musicOn ? '#00ff88' : '#ff5555' },
        ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        this.musicToggle.on('pointerdown', () => {
            const on = !this.audio.musicOn;
            this.audio.setMusicOn(on);
            this.musicToggle.setText(on ? t('sound_on') : t('sound_off'));
            this.musicToggle.setColor(on ? '#00ff88' : '#ff5555');
            this.save.getData().settings.music = on;
            this.save.save();
        });
        this.add(this.musicToggle);
    }

    private createSfxToggle(px: number, y: number): void {
        const label = this.scene.add.text(px + 30, y, t('settings_sfx'), {
            fontFamily: UI.FONT_BODY, fontSize: '16px', color: '#cccccc',
        }).setOrigin(0, 0.5);
        this.add(label);

        this.sfxToggle = this.scene.add.text(
            px + PANEL_W - 30, y,
            this.audio.sfxOn ? t('sound_on') : t('sound_off'),
            { fontFamily: UI.FONT_MAIN, fontSize: '14px', color: this.audio.sfxOn ? '#00ff88' : '#ff5555' },
        ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        this.sfxToggle.on('pointerdown', () => {
            const on = !this.audio.sfxOn;
            this.audio.setSfxOn(on);
            this.sfxToggle.setText(on ? t('sound_on') : t('sound_off'));
            this.sfxToggle.setColor(on ? '#00ff88' : '#ff5555');
            this.save.getData().settings.sfx = on;
            this.save.save();
        });
        this.add(this.sfxToggle);
    }

    private createSlider(px: number, y: number, type: 'music' | 'sfx'): void {
        const sliderStartX = px + 100;
        const sliderEndX = px + PANEL_W - 75;
        const sliderW = sliderEndX - sliderStartX;
        const currentVal = type === 'music' ? this.audio.volume : this.audio.sfxVolume;

        const pctText = this.scene.add.text(
            px + PANEL_W - 30, y,
            `${Math.round(currentVal * 100)}%`,
            { fontFamily: UI.FONT_MAIN, fontSize: '13px', color: '#ffffff' },
        ).setOrigin(1, 0.5);
        this.add(pctText);

        const volLabel = this.scene.add.text(px + 30, y, t('settings_volume'), {
            fontFamily: UI.FONT_BODY, fontSize: '13px', color: '#999999',
        }).setOrigin(0, 0.5);
        this.add(volLabel);

        // Track
        const track = this.scene.add.graphics();
        track.fillStyle(0x333355, 1);
        track.fillRoundedRect(sliderStartX, y - SLIDER_H / 2, sliderW, SLIDER_H, 4);
        this.add(track);

        const fill = this.scene.add.graphics();
        this.add(fill);
        const thumb = this.scene.add.graphics();
        this.add(thumb);

        const drawSlider = (val: number) => {
            const fillW = sliderW * val;
            const tx = sliderStartX + fillW;
            fill.clear();
            fill.fillStyle(type === 'music' ? UI.PRIMARY_GREEN : UI.ACCENT_ORANGE, 1);
            if (fillW > 0) fill.fillRoundedRect(sliderStartX, y - SLIDER_H / 2, fillW, SLIDER_H, 4);
            thumb.clear();
            thumb.fillStyle(0xffffff, 1);
            thumb.fillCircle(tx, y, 10);
            thumb.fillStyle(type === 'music' ? UI.PRIMARY_GREEN : UI.ACCENT_ORANGE, 1);
            thumb.fillCircle(tx, y, 7);
        };

        drawSlider(currentVal);

        const hitZone = this.scene.add.rectangle(
            sliderStartX + sliderW / 2, y, sliderW + 20, 30, 0x000000, 0,
        ).setInteractive({ useHandCursor: true });
        this.add(hitZone);

        const update = (pointerX: number) => {
            const vol = Math.max(0, Math.min(1, (pointerX - sliderStartX) / sliderW));
            if (type === 'music') {
                this.audio.setVolume(vol);
                this.save.getData().settings.volume = vol;
            } else {
                this.audio.setSfxVolume(vol);
                this.save.getData().settings.sfxVolume = vol;
            }
            drawSlider(vol);
            pctText.setText(`${Math.round(vol * 100)}%`);
            this.save.save();
        };

        hitZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (type === 'music') this.draggingMusic = true;
            else this.draggingSfx = true;
            update(p.x);
        });

        if (type === 'music') this.musicSliderUpdate = update;
        else this.sfxSliderUpdate = update;
    }

    show(): void {
        this.setVisible(true);
        this.musicToggle.setText(this.audio.musicOn ? t('sound_on') : t('sound_off'));
        this.musicToggle.setColor(this.audio.musicOn ? '#00ff88' : '#ff5555');
        this.sfxToggle.setText(this.audio.sfxOn ? t('sound_on') : t('sound_off'));
        this.sfxToggle.setColor(this.audio.sfxOn ? '#00ff88' : '#ff5555');
    }

    hide(): void {
        this.setVisible(false);
        this.draggingMusic = false;
        this.draggingSfx = false;
    }

    get isVisible(): boolean {
        return this.visible;
    }
}
