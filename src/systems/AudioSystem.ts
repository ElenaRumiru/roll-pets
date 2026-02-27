import type { Grade } from '../types';

type GradeSfxKey = `sfx_grade_${Grade}`;
export type SfxKey = 'sfx_click' | 'sfx_wobble' | 'sfx_reveal' | 'sfx_new_pet' | 'sfx_levelup' | GradeSfxKey;

export class AudioSystem {
    private sound: Phaser.Sound.BaseSoundManager;
    private bgm: Phaser.Sound.BaseSound | null = null;
    private _musicOn: boolean;
    private _volume: number;
    private _sfxOn: boolean;
    private _sfxVolume: number;

    constructor(soundManager: Phaser.Sound.BaseSoundManager, musicOn: boolean, volume: number, sfxOn: boolean, sfxVolume: number) {
        this.sound = soundManager;
        this._musicOn = musicOn;
        this._volume = volume;
        this._sfxOn = sfxOn;
        this._sfxVolume = sfxVolume;
    }

    startBGM(): void {
        if (this.bgm) return;
        this.bgm = this.sound.add('bgm', {
            loop: true,
            volume: this._musicOn ? this._volume : 0,
        });
        this.bgm.play();

        if (this.sound.locked) {
            const onGesture = (): void => {
                const ctx = (this.sound as unknown as { context?: AudioContext }).context;
                if (ctx?.state === 'suspended') ctx.resume();
                document.removeEventListener('click', onGesture, true);
                document.removeEventListener('touchstart', onGesture, true);
            };
            document.addEventListener('click', onGesture, { capture: true, once: true });
            document.addEventListener('touchstart', onGesture, { capture: true, once: true });
        }
    }

    playSfx(key: SfxKey, volumeScale = 1): void {
        if (!this._sfxOn || this._sfxVolume <= 0) return;
        this.sound.play(key, { volume: this._sfxVolume * volumeScale });
    }

    // --- Music ---
    get musicOn(): boolean { return this._musicOn; }

    setMusicOn(on: boolean): void {
        this._musicOn = on;
        if (this.bgm && 'setVolume' in this.bgm) {
            (this.bgm as Phaser.Sound.WebAudioSound).setVolume(on ? this._volume : 0);
        }
    }

    get volume(): number { return this._volume; }

    setVolume(vol: number): void {
        this._volume = Math.max(0, Math.min(1, vol));
        if (this.bgm && this._musicOn && 'setVolume' in this.bgm) {
            (this.bgm as Phaser.Sound.WebAudioSound).setVolume(this._volume);
        }
    }

    pauseAll(): void {
        if (this.bgm && this.bgm.isPlaying) this.bgm.pause();
    }

    resumeAll(): void {
        if (this.bgm && this.bgm.isPaused && this._musicOn) this.bgm.resume();
    }

    // --- SFX ---
    get sfxOn(): boolean { return this._sfxOn; }

    setSfxOn(on: boolean): void {
        this._sfxOn = on;
    }

    get sfxVolume(): number { return this._sfxVolume; }

    setSfxVolume(vol: number): void {
        this._sfxVolume = Math.max(0, Math.min(1, vol));
    }
}
