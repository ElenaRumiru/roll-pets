import StartGame from './game/main';
import { createAdapter } from './platform/createAdapter';

document.addEventListener('DOMContentLoaded', async () => {
    // Poki: prevent browser default scrolling on game keys
    window.addEventListener('keydown', (e) => {
        if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });
    window.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

    await Promise.all([
        document.fonts.load('900 16px "Rubik Black"'),
        document.fonts.load('500 16px "Rubik"'),
        document.fonts.load('300 16px "Rubik Light"'),
    ]);

    const sdk = await createAdapter();
    const game = StartGame('game-container');
    game.registry.set('platformSDK', sdk);
});