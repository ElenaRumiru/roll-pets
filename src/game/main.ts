import { AUTO, Game, Scale } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { BootScene } from '../scenes/BootScene';
import { MainScene } from '../scenes/MainScene';
import { CollectionScene } from '../scenes/CollectionScene';
import { ProgressionScene } from '../scenes/ProgressionScene';
import { ShopScene } from '../scenes/ShopScene';
import { LeaderboardScene } from '../scenes/LeaderboardScene';
import { QuestScene } from '../scenes/QuestScene';
import { DailyBonusScene } from '../scenes/DailyBonusScene';
import { NestsScene } from '../scenes/NestsScene';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    roundPixels: true,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
    },
    scene: [
        BootScene,
        MainScene,
        CollectionScene,
        ProgressionScene,
        ShopScene,
        LeaderboardScene,
        QuestScene,
        DailyBonusScene,
        NestsScene,
    ],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
