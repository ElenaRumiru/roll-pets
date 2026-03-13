import { AUTO, Game, Scale } from 'phaser';
import { detectOrientation, setPortrait, getGameWidth, getGameHeight } from '../core/orientation';
import { BootScene } from '../scenes/BootScene';
import { MainScene } from '../scenes/MainScene';
import { CollectionScene } from '../scenes/CollectionScene';
import { ProgressionScene } from '../scenes/ProgressionScene';
import { ShopScene } from '../scenes/ShopScene';
import { LeaderboardScene } from '../scenes/LeaderboardScene';
import { QuestScene } from '../scenes/QuestScene';
import { DailyBonusScene } from '../scenes/DailyBonusScene';
import { NestsScene } from '../scenes/NestsScene';

const SKIP_RESTART = ['BootScene'];

const StartGame = (parent: string) => {
    // Detect initial orientation
    setPortrait(detectOrientation());

    const config: Phaser.Types.Core.GameConfig = {
        type: AUTO,
        width: getGameWidth(),
        height: getGameHeight(),
        parent,
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

    const game = new Game(config);

    // Orientation change handler (debounced)
    let debounceTimer = 0;
    let currentPortrait = detectOrientation();

    window.addEventListener('resize', () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
            const nowPortrait = detectOrientation();
            if (nowPortrait === currentPortrait) return;
            currentPortrait = nowPortrait;
            setPortrait(nowPortrait);

            game.scale.setGameSize(getGameWidth(), getGameHeight());

            // Restart active scene if it supports portrait
            const activeScene = game.scene.getScenes(true)[0];
            if (!activeScene) return;

            const key = activeScene.scene.key;

            // Guard: don't restart if mid-roll
            const manager = game.registry.get('gameManager') as { isRolling?: boolean } | undefined;
            if (manager?.isRolling) {
                const check = () => {
                    if (!manager.isRolling) {
                        game.scale.setGameSize(getGameWidth(), getGameHeight());
                        if (!SKIP_RESTART.includes(key)) {
                            activeScene.scene.restart();
                        }
                    } else {
                        setTimeout(check, 100);
                    }
                };
                setTimeout(check, 100);
                return;
            }

            if (!SKIP_RESTART.includes(key)) {
                activeScene.scene.restart();
            }
        }, 150);
    });

    return game;
};

export default StartGame;
