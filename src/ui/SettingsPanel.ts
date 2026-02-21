import { GameObjects, Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI } from '../core/config';
import { EventBus } from '../core/EventBus';
import { t, setLanguage, getLanguage } from '../data/locales';
import { AudioSystem } from '../systems/AudioSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { NicknamePrompt } from './NicknamePrompt';

const PANEL_W = 395;
const PANEL_H = 370;
const SLIDER_H = 10;

export class SettingsPanel extends GameObjects.Container {
    private overlay: GameObjects.Rectangle;
    private musicToggle!: GameObjects.Text;
    private sfxToggle!: GameObjects.Text;
    private audio: AudioSystem;
    private save: SaveSystem;
    private nicknameText!: GameObjects.Text;
    private draggingMusic = false;
    private draggingSfx = false;
    private langDropdown: GameObjects.Container | null = null;

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

        // Panel background (semi-transparent)
        const panel = scene.add.graphics();
        panel.fillStyle(0x111122, 0.82);
        panel.fillRoundedRect(px, py, PANEL_W, PANEL_H, UI.CORNER_RADIUS);
        panel.lineStyle(1.5, 0x444466, 0.4);
        panel.strokeRoundedRect(px, py, PANEL_W, PANEL_H, UI.CORNER_RADIUS);
        this.add(panel);

        // Title
        const title = scene.add.text(GAME_WIDTH / 2, py + 35, t('settings'), {
            fontFamily: UI.FONT_MAIN, fontSize: '25px', color: '#ffffff',
        }).setOrigin(0.5);
        this.add(title);

        // Close button
        const closeBtn = scene.add.text(px + PANEL_W - 25, py + 25, '\u2715', {
            fontFamily: UI.FONT_BODY, fontSize: '22px', color: '#aaaaaa',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.hide());
        closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#aaaaaa'));
        this.add(closeBtn);

        // --- Music section ---
        this.createMusicToggle(px, py + 74);
        this.createSlider(px, py + 104, 'music');

        // --- SFX section ---
        this.createSfxToggle(px, py + 148);
        this.createSlider(px, py + 178, 'sfx');

        // --- Nickname section ---
        this.createNicknameRow(px, py + 237);

        // --- Language section ---
        this.createLanguageRow(px, py + 296);

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
        const label = this.scene.add.text(px + 37, y, t('settings_music'), {
            fontFamily: UI.FONT_BODY, fontSize: '20px', color: '#cccccc',
        }).setOrigin(0, 0.5);
        this.add(label);

        this.musicToggle = this.scene.add.text(
            px + PANEL_W - 37, y,
            this.audio.musicOn ? t('sound_on') : t('sound_off'),
            { fontFamily: UI.FONT_MAIN, fontSize: '17px', color: this.audio.musicOn ? '#00ff88' : '#ff5555' },
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
        const label = this.scene.add.text(px + 37, y, t('settings_sfx'), {
            fontFamily: UI.FONT_BODY, fontSize: '20px', color: '#cccccc',
        }).setOrigin(0, 0.5);
        this.add(label);

        this.sfxToggle = this.scene.add.text(
            px + PANEL_W - 37, y,
            this.audio.sfxOn ? t('sound_on') : t('sound_off'),
            { fontFamily: UI.FONT_MAIN, fontSize: '17px', color: this.audio.sfxOn ? '#00ff88' : '#ff5555' },
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

    private createNicknameRow(px: number, y: number): void {
        const label = this.scene.add.text(px + 37, y, t('settings_nickname'), {
            fontFamily: UI.FONT_BODY, fontSize: '20px', color: '#cccccc',
        }).setOrigin(0, 0.5);
        this.add(label);

        const pencil = this.scene.add.text(px + PANEL_W - 25, y, '\u270F\uFE0F', {
            fontSize: '14px',
        }).setOrigin(1, 0.5);
        this.add(pencil);

        const currentName = this.save.getNickname() || t('default_nickname');
        this.nicknameText = this.scene.add.text(
            px + PANEL_W - 52, y, currentName,
            { fontFamily: UI.FONT_MAIN, fontSize: '17px', color: '#00ff88' },
        ).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        this.nicknameText.on('pointerover', () => this.nicknameText.setColor('#ffffff'));
        this.nicknameText.on('pointerout', () => this.nicknameText.setColor('#00ff88'));
        this.nicknameText.on('pointerdown', () => {
            new NicknamePrompt((name: string) => {
                this.save.setNickname(name);
                this.nicknameText.setText(name);
                EventBus.emit('nickname-changed', name);
            }, this.scene.input);
        });
        this.add(this.nicknameText);
    }

    private readonly LANG_LABELS: Record<string, string> = { en: 'English', ru: 'Русский' };
    private readonly LANG_ORDER = ['en', 'ru'];
    private langBtnText!: GameObjects.Text;
    private langBtnBg!: GameObjects.Graphics;
    private langBtnX = 0;
    private langBtnY = 0;
    private langBtnW = 0;

    private createLanguageRow(px: number, y: number): void {
        const label = this.scene.add.text(px + 37, y, t('settings_language'), {
            fontFamily: UI.FONT_BODY, fontSize: '20px', color: '#cccccc',
        }).setOrigin(0, 0.5);
        this.add(label);

        const btnW = 148;
        const btnH = 35;
        const btnX = px + PANEL_W - 37 - btnW;
        this.langBtnX = btnX;
        this.langBtnY = y;
        this.langBtnW = btnW;

        this.langBtnBg = this.scene.add.graphics();
        this.drawLangBtn(false);
        this.add(this.langBtnBg);

        this.langBtnText = this.scene.add.text(
            btnX + 15, y,
            this.LANG_LABELS[getLanguage()] ?? 'English',
            { fontFamily: UI.FONT_MAIN, fontSize: '16px', color: '#ffffff' },
        ).setOrigin(0, 0.5);
        this.add(this.langBtnText);

        const arrow = this.scene.add.text(btnX + btnW - 17, y, '\u25BC', {
            fontFamily: UI.FONT_BODY, fontSize: '11px', color: '#888888',
        }).setOrigin(0.5, 0.5);
        this.add(arrow);

        const hitZone = this.scene.add.rectangle(
            btnX + btnW / 2, y, btnW, btnH, 0x000000, 0,
        ).setInteractive({ useHandCursor: true });
        this.add(hitZone);

        hitZone.on('pointerdown', () => this.toggleLangDropdown());
    }

    private drawLangBtn(open: boolean): void {
        const btnH = 35;
        this.langBtnBg.clear();
        this.langBtnBg.fillStyle(open ? 0x333355 : 0x2a2a3e, 1);
        this.langBtnBg.fillRoundedRect(this.langBtnX, this.langBtnY - btnH / 2, this.langBtnW, btnH, 6);
        this.langBtnBg.lineStyle(1, 0x555577, 0.5);
        this.langBtnBg.strokeRoundedRect(this.langBtnX, this.langBtnY - btnH / 2, this.langBtnW, btnH, 6);
    }

    private toggleLangDropdown(): void {
        if (this.langDropdown) { this.closeLangDropdown(); return; }
        this.drawLangBtn(true);

        const itemH = 39;
        const dropY = this.langBtnY + 14 + 4;
        const h = this.LANG_ORDER.length * itemH;

        this.langDropdown = this.scene.add.container(0, 0);

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x222244, 0.95);
        bg.fillRoundedRect(this.langBtnX, dropY, this.langBtnW, h, 6);
        bg.lineStyle(1, 0x555577, 0.5);
        bg.strokeRoundedRect(this.langBtnX, dropY, this.langBtnW, h, 6);
        this.langDropdown.add(bg);

        this.LANG_ORDER.forEach((lang, i) => {
            const iy = dropY + i * itemH + itemH / 2;
            const isActive = lang === getLanguage();

            const row = this.scene.add.rectangle(
                this.langBtnX + this.langBtnW / 2, iy,
                this.langBtnW - 4, itemH - 2, 0x000000, 0,
            ).setInteractive({ useHandCursor: true });

            const txt = this.scene.add.text(this.langBtnX + 15, iy, this.LANG_LABELS[lang], {
                fontFamily: UI.FONT_MAIN, fontSize: '16px',
                color: isActive ? '#00ff88' : '#cccccc',
            }).setOrigin(0, 0.5);

            row.on('pointerover', () => { txt.setColor('#00ff88'); row.setFillStyle(0x444466, 0.5); });
            row.on('pointerout', () => { txt.setColor(isActive ? '#00ff88' : '#cccccc'); row.setFillStyle(0x000000, 0); });
            row.on('pointerdown', () => {
                this.closeLangDropdown();
                if (lang === getLanguage()) return;
                setLanguage(lang);
                this.save.getData().settings.language = lang;
                this.save.save();
                this.scene.registry.set('openSettings', true);
                this.scene.scene.start('MainScene');
            });

            if (isActive) {
                const check = this.scene.add.text(this.langBtnX + this.langBtnW - 20, iy, '\u2713', {
                    fontFamily: UI.FONT_BODY, fontSize: '17px', color: '#00ff88',
                }).setOrigin(0.5, 0.5);
                this.langDropdown.add(check);
            }

            this.langDropdown.add(row);
            this.langDropdown.add(txt);
        });

        this.add(this.langDropdown);
    }

    private closeLangDropdown(): void {
        if (this.langDropdown) {
            this.langDropdown.destroy();
            this.langDropdown = null;
            this.drawLangBtn(false);
        }
    }

    private createSlider(px: number, y: number, type: 'music' | 'sfx'): void {
        const sliderStartX = px + 123;
        const sliderEndX = px + PANEL_W - 92;
        const sliderW = sliderEndX - sliderStartX;
        const currentVal = type === 'music' ? this.audio.volume : this.audio.sfxVolume;

        const pctText = this.scene.add.text(
            px + PANEL_W - 37, y,
            `${Math.round(currentVal * 100)}%`,
            { fontFamily: UI.FONT_MAIN, fontSize: '16px', color: '#ffffff' },
        ).setOrigin(1, 0.5);
        this.add(pctText);

        const volLabel = this.scene.add.text(px + 37, y, t('settings_volume'), {
            fontFamily: UI.FONT_BODY, fontSize: '16px', color: '#999999',
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
        this.nicknameText.setText(this.save.getNickname() || t('default_nickname'));
    }

    hide(): void {
        this.closeLangDropdown();
        this.setVisible(false);
        this.draggingMusic = false;
        this.draggingSfx = false;
    }

    get isVisible(): boolean {
        return this.visible;
    }
}
