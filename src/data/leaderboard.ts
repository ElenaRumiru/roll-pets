import { LeagueConfig } from '../types';

export const LEAGUES: LeagueConfig[] = [
    { tier: 'bronze',  label: 'league_bronze',  color: 0xcd7f32, colorHex: '#cd7f32', minChance: 2,           maxChance: 5_000 },
    { tier: 'silver',  label: 'league_silver',  color: 0xc0c0c0, colorHex: '#c0c0c0', minChance: 5_000,       maxChance: 50_000 },
    { tier: 'gold',    label: 'league_gold',    color: 0xffd700, colorHex: '#ffd700', minChance: 50_000,      maxChance: 5_000_000 },
    { tier: 'diamond', label: 'league_diamond', color: 0x00bfff, colorHex: '#00bfff', minChance: 5_000_000,   maxChance: 250_000_000 },
    { tier: 'master',  label: 'league_master',  color: 0xff4444, colorHex: '#ff4444', minChance: 250_000_000, maxChance: 1_000_000_000 },
];

export const BOT_COUNT = 15;

/** ~200 realistic international gaming nicknames */
export const BOT_NICKNAMES: string[] = [
    // Clean short names
    'Luna', 'Max', 'Nova', 'Ace', 'Ivy', 'Kai', 'Milo', 'Zara', 'Rex', 'Skye',
    'Leo', 'Finn', 'Jade', 'Ash', 'Nyx', 'Cole', 'Ruby', 'Axel', 'Iris', 'Jett',
    'Echo', 'Sage', 'Wren', 'Cleo', 'Dax', 'Kira', 'Blaze', 'Storm', 'Frost', 'Pixel',
    'Dash', 'Fern', 'Onyx', 'Rio', 'Tora', 'Lux', 'Brix', 'Vex', 'Opal', 'Zeke',
    // Gamertag style
    'DarkPhoenix', 'SilverWolf', 'NeonKnight', 'CyberFox', 'ShadowBlade',
    'IronPaws', 'StarHunter', 'FrostByte', 'TurboKing', 'BlazeMaster',
    'NightOwl', 'ThunderClaw', 'GhostRider', 'CrimsonFang', 'StormBreaker',
    'VoidWalker', 'RapidFire', 'LunarEcho', 'CosmicDust', 'ArcticFox',
    'PhantomX', 'TitanRush', 'NovaSpark', 'OmegaWave', 'PrismShot',
    'ZeroGrav', 'EagleEye', 'ViperStrike', 'MysticAura', 'DragonLord',
    'PixelHero', 'RocketPup', 'HyperNova', 'CrystalMage', 'SteelTiger',
    'BoltStrike', 'NightFlame', 'GoldRush', 'IcePhoenix', 'StarForge',
    'WindRunner', 'BlazeHawk', 'IronForge', 'VoltEdge', 'ShadowFin',
    'SkyDancer', 'MoonRise', 'FlameJet', 'ThunderBolt', 'AquaShark',
    // Roblox / casual gamer
    'iiPetLover', 'coolboy123', 'xXLuckyXx', 'PetFanatic', 'RollMaster99',
    'EpicGamer42', 'ProHatcher', 'RareFinds', 'GachaKing', 'LootLord',
    'BabyPanda88', 'FluffyCloud', 'PetWhiz', 'HatchQueen', 'RNGesus',
    'LuckyCharm7', 'SuperRoller', 'DiamondPet', 'GoldenEgg01', 'MegaLuck',
    'PetCollectr', 'OmgSoRare', 'EZWins', 'BigRolls', 'TinyPaws',
    'iiCutiePie', 'FuzzyBunny', 'CoolKid2026', 'StarPets', 'NeonPets',
    'PetManiac', 'EggCracker', 'ShinyFinder', 'RareHuntr', 'GachaGod',
    'PetNinja', 'UltraRoll', 'LegendSeekr', 'MythicFan', 'EpicFinds',
    'Sparkle777', 'xxRollxx', 'PetChamp', 'AncientOne', 'TopPlayer1',
    'QuickHatch', 'MasterEgg', 'ElitePets', 'DinoFan99', 'CatLover42',
    'DogPerson', 'BunnyHop99', 'KawaiiPets', 'SoLucky', 'GGEzPets',
    'PetWizard', 'HatcherPro', 'LootMaster', 'EpicRoller', 'TopHatcher',
    // International flair
    'SakuraPet', 'AkiraRoll', 'YukiHatch', 'TaroLucky', 'MinJunPets',
    'HanaPetGO', 'RenzoGacha', 'LucaRolls', 'EmirHatch', 'NikoGacha',
    'ZhanPets', 'ArjunRNG', 'IslaHatch', 'MateoLuck', 'SofiaRolls',
    'OscarPets', 'FelixEgg', 'ChloeLoot', 'NoahHatch', 'MiaGacha',
    'LiamRolls', 'EmmaLuck', 'OlivaPets', 'JamesPetGO', 'AvaHatch',
    'ElijahRNG', 'SophiaEgg', 'LoganPets', 'HarperRoll', 'AlexGacha',
    'RyanHatch', 'GracePets', 'DylanRNG', 'ZoeyLuck', 'EthanRoll',
    'LilyPetGO', 'JackGacha', 'EvaPets', 'LeoHatch', 'MayaRolls',
    'HugoLuck', 'LaraHatch', 'TomPetGO', 'InesGacha', 'DanteRNG',
    'AliceRolls', 'VictorPet', 'RosaPets', 'OttoHatch', 'FreyaRNG',
];

export function getLeagueForChance(chance: number): LeagueConfig {
    for (let i = LEAGUES.length - 1; i >= 0; i--) {
        if (chance >= LEAGUES[i].minChance) return LEAGUES[i];
    }
    return LEAGUES[0];
}
