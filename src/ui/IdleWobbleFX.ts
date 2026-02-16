import { Renderer, Game } from 'phaser';

const fragShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform float uTime;

varying vec2 outTexCoord;

void main() {
    vec2 uv = outTexCoord;

    // factor: 1 at top (head), 0 at bottom (feet) — steep falloff, only head moves
    float f = uv.y * uv.y;
    float factor = f * f * uv.y;

    // Horizontal sway — head rocks, feet planted
    uv.x += sin(uTime * 2.8) * 0.0085 * factor;

    gl_FragColor = texture2D(uMainSampler, uv);
}
`;

export class IdleWobbleFX extends Renderer.WebGL.Pipelines.PostFXPipeline {
    private phase = 0;

    constructor(game: Game) {
        super({
            game,
            name: 'IdleWobbleFX',
            renderTarget: true,
            fragShader,
        });
    }

    setPhase(value: number): void {
        this.phase = value;
    }

    onPreRender(): void {
        const time = this.game.loop.time / 1000;
        this.set1f('uTime', time + this.phase);
    }
}
