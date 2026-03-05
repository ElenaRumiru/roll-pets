export interface CollectionReward {
    coins: number;
    buff?: { type: 'lucky' | 'super' | 'epic'; charges: number };
}

export interface CollectionDef {
    id: string;
    nameKey: string;
    icon: string;
    petIds: readonly string[];
    difficulty: 'easy' | 'medium' | 'hard';
    reward: CollectionReward;
}

// ── Easy (11) ──
const EASY: CollectionDef[] = [
    {
        id: 'house_pets', nameKey: 'col_house_pets', icon: 'col_home_pets',
        petIds: ['cat', 'beagle', 'mouse', 'hamster', 'hare', 'shiba', 'goldfish', 'turtle', 'ferret', 'guinea_pig', 'hedgehog', 'chinchilla'],
        difficulty: 'easy', reward: { coins: 500 },
    },
    {
        id: 'farm', nameKey: 'col_farm', icon: 'col_farm_pets',
        petIds: ['sheep', 'goat', 'cow', 'pig', 'duck', 'turkey', 'hare', 'beagle', 'ram', 'chicken', 'donkey', 'horse'],
        difficulty: 'easy', reward: { coins: 500 },
    },
    {
        id: 'forest', nameKey: 'col_forest', icon: 'col_forest_pets',
        petIds: ['squirrel', 'badger', 'mole', 'raccoon', 'owl', 'bear', 'wolf', 'moose', 'beaver', 'porcupine', 'opossum', 'bat', 'fox', 'deer', 'wolverine'],
        difficulty: 'easy', reward: { coins: 1_000 },
    },
    {
        id: 'birds', nameKey: 'col_birds', icon: 'col_birds_pets',
        petIds: ['pigeon', 'duck', 'turkey', 'owl', 'heron', 'kiwi', 'swan', 'pelican', 'toucan', 'falcon', 'raven', 'hummingbird', 'penguin', 'flamingo', 'eagle', 'ostrich', 'stork', 'magpie', 'vulture', 'peacock', 'parrot'],
        difficulty: 'easy', reward: { coins: 1_500 },
    },
    {
        id: 'bugs', nameKey: 'col_bugs', icon: 'col_bugs_pets',
        petIds: ['bee', 'ladybug', 'grasshopper', 'spider', 'scorpion', 'ant', 'dragonfly', 'mantis'],
        difficulty: 'easy', reward: { coins: 500 },
    },
    {
        id: 'scaled', nameKey: 'col_scaled', icon: 'col_squama_pets',
        petIds: ['turtle', 'snake', 'chameleon', 'crocodile', 'cobra', 'axolotl', 'gecko', 'iguana', 'salamander'],
        difficulty: 'easy', reward: { coins: 1_000 },
    },
    {
        id: 'rodents', nameKey: 'col_rodents', icon: 'col_rodents_pets',
        petIds: ['mouse', 'hamster', 'squirrel', 'beaver', 'capybara', 'porcupine', 'chipmunk', 'guinea_pig', 'chinchilla'],
        difficulty: 'easy', reward: { coins: 500 },
    },
    {
        id: 'river_pond', nameKey: 'col_river_pond', icon: 'col_lake_river_pets',
        petIds: ['frog', 'beaver', 'otter', 'axolotl', 'duck', 'hippo', 'crocodile', 'swan', 'piranha', 'platypus', 'snail'],
        difficulty: 'easy', reward: { coins: 1_000 },
    },
    {
        id: 'exotic', nameKey: 'col_exotic', icon: 'col_exotic_pets',
        petIds: ['axolotl', 'chameleon', 'capybara', 'red_panda', 'pallas_cat', 'fennec_fox', 'koala', 'kangaroo', 'pangolin', 'platypus', 'sloth', 'armadillo', 'tapir', 'lemur', 'monkey'],
        difficulty: 'easy', reward: { coins: 1_000 },
    },
    {
        id: 'latin_america', nameKey: 'col_latin_america', icon: 'col_latin_pets',
        petIds: ['llama', 'toucan', 'capybara', 'jaguar', 'axolotl', 'anteater'],
        difficulty: 'easy', reward: { coins: 1_000 },
    },
    {
        id: 'desert', nameKey: 'col_desert', icon: 'col_desert_pets',
        petIds: ['camel', 'fennec_fox', 'scorpion', 'cobra', 'meerkat'],
        difficulty: 'easy', reward: { coins: 1_000 },
    },
];

// ── Medium (9) ──
const MEDIUM: CollectionDef[] = [
    {
        id: 'ocean', nameKey: 'col_ocean', icon: 'col_sea_pets',
        petIds: ['seahorse', 'dolphin', 'octopus', 'pufferfish', 'shark', 'whale', 'jellyfish', 'squid', 'anglerfish', 'seal', 'crab', 'lobster', 'starfish', 'stingray', 'narwhal', 'kraken'],
        difficulty: 'medium', reward: { coins: 5_000 },
    },
    {
        id: 'savanna', nameKey: 'col_savanna', icon: 'col_savanne_pets',
        petIds: ['giraffe', 'zebra', 'lion', 'cheetah', 'hyena', 'hippo', 'rhino', 'gorilla', 'meerkat', 'elephant', 'warthog'],
        difficulty: 'medium', reward: { coins: 5_000 },
    },
    {
        id: 'arctic', nameKey: 'col_arctic', icon: 'col_arctik_pets',
        petIds: ['penguin', 'seal', 'walrus', 'snowman', 'yeti', 'mammoth', 'polar_bear'],
        difficulty: 'medium', reward: { coins: 5_000 },
    },
    {
        id: 'felines', nameKey: 'col_felines', icon: 'col_cats_pets_feline',
        petIds: ['cat', 'pallas_cat', 'cheetah', 'jaguar', 'lion', 'cheshire_cat', 'sabertooth', 'lynx', 'panther', 'tiger'],
        difficulty: 'medium', reward: { coins: 8_000 },
    },
    {
        id: 'canine_pack', nameKey: 'col_canine_pack', icon: 'col_dogs_pets_canids',
        petIds: ['beagle', 'shiba', 'wolf', 'hyena', 'fennec_fox', 'cerberus', 'fox', 'husky'],
        difficulty: 'medium', reward: { coins: 8_000 },
    },
    {
        id: 'venomous', nameKey: 'col_venomous', icon: 'col_acid_pets',
        petIds: ['snake', 'cobra', 'scorpion', 'spider', 'pufferfish', 'jellyfish'],
        difficulty: 'medium', reward: { coins: 3_000 },
    },
    {
        id: 'heavyweights', nameKey: 'col_heavyweights', icon: 'col_big_pets',
        petIds: ['hippo', 'rhino', 'gorilla', 'bear', 'whale', 'mammoth', 'golem', 'walrus', 'elephant', 'bison', 'polar_bear'],
        difficulty: 'medium', reward: { coins: 8_000 },
    },
    {
        id: 'asian', nameKey: 'col_asian', icon: 'col_asia_pets',
        petIds: ['panda', 'red_panda', 'kitsune', 'shiba', 'chinese_dragon', 'pallas_cat', 'tiger'],
        difficulty: 'medium', reward: { coins: 10_000 },
    },
    {
        id: 'equines', nameKey: 'col_equines', icon: 'col_farm_pets',
        petIds: ['donkey', 'horse', 'pegasus', 'nightmare', 'unicorn'],
        difficulty: 'medium', reward: { coins: 8_000 },
    },
];

// ── Hard (6) ──
const HARD: CollectionDef[] = [
    {
        id: 'mythical', nameKey: 'col_mythical', icon: 'col_myph_pets',
        petIds: ['griffin', 'dragon', 'pegasus', 'phoenix', 'chinese_dragon', 'cerberus', 'minotaur', 'sphinx', 'djinn', 'kitsune', 'alien', 'unicorn', 'hydra', 'fenrir', 'thunderbird', 'fairy', 'kraken'],
        difficulty: 'hard', reward: { coins: 50_000 },
    },
    {
        id: 'undead', nameKey: 'col_undead', icon: 'col_undead_pets',
        petIds: ['ghost', 'skeleton', 'zombie', 'vampire', 'grim_reaper', 'lich', 'banshee', 'wraith', 'wendigo'],
        difficulty: 'hard', reward: { coins: 30_000 },
    },
    {
        id: 'living_objects', nameKey: 'col_living_objects', icon: 'col_items_pets',
        petIds: ['slime', 'robot', 'snowman', 'teddy_bear', 'gingerbread_man', 'mimic'],
        difficulty: 'hard', reward: { coins: 25_000 },
    },
    {
        id: 'dark_forces', nameKey: 'col_dark_forces', icon: 'col_dark_pets',
        petIds: ['cerberus', 'nightmare', 'beholder', 'grim_reaper', 'ifrit', 'werewolf', 'gargoyle', 'imp', 'fenrir', 'lich'],
        difficulty: 'hard', reward: { coins: 50_000 },
    },
    {
        id: 'prehistoric', nameKey: 'col_prehistoric', icon: 'col_ancient_pets',
        petIds: ['mammoth', 'sabertooth'],
        difficulty: 'hard', reward: { coins: 15_000 },
    },
    {
        id: 'dragons', nameKey: 'col_dragons', icon: 'col_dark_pets',
        petIds: ['dragon', 'chinese_dragon', 'dragon_green', 'dragon_red', 'dragon_ice', 'dragon_gold', 'dragon_silver'],
        difficulty: 'hard', reward: { coins: 100_000 },
    },
];

export const COLLECTIONS: readonly CollectionDef[] = [...EASY, ...MEDIUM, ...HARD];

/** Icon asset names for BootScene loading (without col_ prefix and _raw suffix) */
export const COL_ICON_NAMES = [
    'home_pets', 'farm_pets', 'forest_pets', 'birds_pets', 'bugs_pets',
    'squama_pets', 'rodents_pets', 'lake_river_pets', 'exotic_pets',
    'latin_pets', 'desert_pets',
    'sea_pets', 'savanne_pets', 'arctik_pets', 'cats_pets_feline',
    'dogs_pets_canids', 'acid_pets', 'big_pets', 'asia_pets',
    'myph_pets', 'undead_pets', 'items_pets', 'dark_pets', 'ancient_pets',
] as const;

/** Precomputed pet→collection index for fast lookup */
const petToCollections = new Map<string, CollectionDef[]>();
for (const c of COLLECTIONS) {
    for (const pid of c.petIds) {
        const arr = petToCollections.get(pid) ?? [];
        arr.push(c);
        petToCollections.set(pid, arr);
    }
}

export function getCollectionsByPetId(petId: string): readonly CollectionDef[] {
    return petToCollections.get(petId) ?? [];
}
