import { Scene } from 'phaser';

export class AudioSystem {
    private scene: Scene;
    private bgm: Phaser.Sound.BaseSound | null = null;
    private _musicOn: boolean;
    private _volume: number;

    constructor(scene: Scene, musicOn: boolean, volume: number) {
        this.scene = scene;
        this._musicOn = musicOn;
        this._volume = volume;
    }

    startBGM(): void {
        if (this.bgm) return;
        this.bgm = this.scene.sound.add('bgm', {
            loop: true,
            volume: this._musicOn ? this._volume : 0,
        });
        this.bgm.play();
    }

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
}
