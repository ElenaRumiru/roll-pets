import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        document.fonts.load('900 16px "Rubik Black"'),
        document.fonts.load('500 16px "Rubik"'),
        document.fonts.load('300 16px "Rubik Light"'),
    ]);
    StartGame('game-container');
});