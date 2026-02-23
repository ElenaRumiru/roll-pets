import { LeaderboardEntry, LeagueTier, LeagueConfig } from '../types';
import { LEAGUES, BOT_COUNT, BOT_NICKNAMES, getLeagueForChance } from '../data/leaderboard';
import { PETS } from '../data/pets';
import { splitmix32, sfc32 } from './RNGSystem';

function hashString(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return h >>> 0;
}

function createSeededRNG(seed: number): () => number {
    const s = splitmix32(seed);
    return sfc32(s() * 2 ** 32, s() * 2 ** 32, s() * 2 ** 32, s() * 2 ** 32);
}

export class LeaderboardSystem {
    private botCache: Map<LeagueTier, LeaderboardEntry[]> = new Map();

    getPlayerLeague(bestChance: number): LeagueConfig {
        return getLeagueForChance(bestChance);
    }

    /** Get 15 sorted entries (14 bots + player) for the player's league */
    getEntries(
        playerName: string,
        playerBestChance: number,
    ): { entries: LeaderboardEntry[]; playerRank: number; league: LeagueConfig } {
        const league = this.getPlayerLeague(playerBestChance);
        const bots = this.getBotsForLeague(league.tier);
        const playerEntry: LeaderboardEntry = {
            name: playerName,
            chance: playerBestChance,
            isPlayer: true,
        };
        // Replace last bot with player to keep exactly 15
        const pool = [...bots];
        pool.pop();
        pool.push(playerEntry);
        const entries = pool.sort((a, b) => b.chance - a.chance);
        const playerRank = entries.findIndex(e => e.isPlayer) + 1;
        return { entries, playerRank, league };
    }

    /** Get 15 bot entries for any league */
    getBotsForLeague(tier: LeagueTier): LeaderboardEntry[] {
        if (this.botCache.has(tier)) return this.botCache.get(tier)!;

        const league = LEAGUES.find(l => l.tier === tier)!;
        const rng = createSeededRNG(hashString(tier));

        // Real pets within this league's range
        const leaguePets = PETS.filter(
            p => p.chance >= league.minChance && p.chance < league.maxChance,
        );

        // Pick BOT_COUNT unique nicknames
        const namePool = [...BOT_NICKNAMES];
        const names: string[] = [];
        for (let i = 0; i < BOT_COUNT; i++) {
            const idx = Math.floor(rng() * namePool.length);
            names.push(namePool[idx]);
            namePool.splice(idx, 1);
        }

        // Each bot's "best pet" is a real pet from this league
        const bots: LeaderboardEntry[] = names.map(name => {
            const pet = leaguePets[Math.floor(rng() * leaguePets.length)];
            return { name, chance: pet.chance, isPlayer: false };
        });

        this.botCache.set(tier, bots);
        return bots;
    }
}
