import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', async () => {
    await document.fonts.ready;
    StartGame('game-container');
});