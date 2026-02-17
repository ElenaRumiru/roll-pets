import { PetDef, Grade } from '../types';
import { getGradeForChance, GRADE_ORDER } from '../core/config';

export const PETS: PetDef[] = [
    // ── Common [2, 100) — 28 pets, dense ──
    { id: 'cat',        name: 'Cat',        emoji: '🐱', imageKey: 'pet_Cat',        chance: 2 },
    { id: 'dog',        name: 'Dog',        emoji: '🐶', imageKey: 'pet_Dog',        chance: 3 },
    { id: 'bunny',      name: 'Bunny',      emoji: '🐰', imageKey: 'pet_Bunny',      chance: 4 },
    { id: 'chick',      name: 'Chick',      emoji: '🐤', imageKey: 'pet_Chick',      chance: 5 },
    { id: 'chicken',    name: 'Chicken',    emoji: '🐔', imageKey: 'pet_Chicken',    chance: 6 },
    { id: 'lamb',       name: 'Lamb',       emoji: '🐑', imageKey: 'pet_Lamb',       chance: 7 },
    { id: 'piggy',      name: 'Piggy',      emoji: '🐷', imageKey: 'pet_Piggy',      chance: 8 },
    { id: 'hamster',    name: 'Hamster',    emoji: '🐹', imageKey: 'pet_Squirrel',   chance: 9 },
    { id: 'squirrel',   name: 'Squirrel',   emoji: '🐿️', imageKey: 'pet_Squirrel',   chance: 10 },
    { id: 'duck',       name: 'Duck',       emoji: '🦆', imageKey: 'pet_Chick',      chance: 11 },
    { id: 'cow',        name: 'Cow',        emoji: '🐄', imageKey: 'pet_Cow',        chance: 12 },
    { id: 'snail',      name: 'Snail',      emoji: '🐌', imageKey: 'pet_Froggy',     chance: 14 },
    { id: 'froggy',     name: 'Froggy',     emoji: '🐸', imageKey: 'pet_Froggy',     chance: 16 },
    { id: 'mouse',      name: 'Mouse',      emoji: '🐭', imageKey: 'pet_Squirrel',   chance: 18 },
    { id: 'turkey',     name: 'Turkey',     emoji: '🦃', imageKey: 'pet_Turkey',     chance: 20 },
    { id: 'goldfish',   name: 'Goldfish',   emoji: '🐟', imageKey: 'pet_Goldfish',   chance: 22 },
    { id: 'turtle',     name: 'Turtle',     emoji: '🐢', imageKey: 'pet_Froggy',     chance: 25 },
    { id: 'crab',       name: 'Crab',       emoji: '🦀', imageKey: 'pet_Goldfish',   chance: 28 },
    { id: 'goat',       name: 'Goat',       emoji: '🐐', imageKey: 'pet_Cow',        chance: 32 },
    { id: 'donkey',     name: 'Donkey',     emoji: '🐴', imageKey: 'pet_Horse',      chance: 36 },
    { id: 'goose',      name: 'Goose',      emoji: '🪿', imageKey: 'pet_Turkey',     chance: 40 },
    { id: 'rooster',    name: 'Rooster',    emoji: '🐓', imageKey: 'pet_Chicken',    chance: 45 },
    { id: 'hedgehog',   name: 'Hedgehog',   emoji: '🦔', imageKey: 'pet_Hedgehog',   chance: 50 },
    { id: 'bee',        name: 'Bee',        emoji: '🐝', imageKey: 'pet_Bee',        chance: 55 },
    { id: 'parrot',     name: 'Parrot',     emoji: '🦜', imageKey: 'pet_Parrot',     chance: 60 },
    { id: 'penguin',    name: 'Penguin',    emoji: '🐧', imageKey: 'pet_Chick',      chance: 68 },
    { id: 'koala',      name: 'Koala',      emoji: '🐨', imageKey: 'pet_Raccoon',    chance: 76 },
    { id: 'otter',      name: 'Otter',      emoji: '🦦', imageKey: 'pet_Blue_Fish',  chance: 85 },

    // ── Uncommon [100, 1000) — 24 pets ──
    { id: 'fox',        name: 'Fox',        emoji: '🦊', imageKey: 'pet_Fox',        chance: 100 },
    { id: 'raccoon',    name: 'Raccoon',    emoji: '🦝', imageKey: 'pet_Raccoon',    chance: 120 },
    { id: 'monkey',     name: 'Monkey',     emoji: '🐒', imageKey: 'pet_Monkey',     chance: 145 },
    { id: 'owl',        name: 'Owl',        emoji: '🦉', imageKey: 'pet_Parrot',     chance: 170 },
    { id: 'green_fish', name: 'Green Fish', emoji: '🐟', imageKey: 'pet_Green_Fish', chance: 200 },
    { id: 'flamingo',   name: 'Flamingo',   emoji: '🦩', imageKey: 'pet_Parrot',     chance: 230 },
    { id: 'blue_fish',  name: 'Blue Fish',  emoji: '🐟', imageKey: 'pet_Blue_Fish',  chance: 265 },
    { id: 'bat',        name: 'Bat',        emoji: '🦇', imageKey: 'pet_Lemur',      chance: 300 },
    { id: 'chameleon',  name: 'Chameleon',  emoji: '🦎', imageKey: 'pet_Gecko',      chance: 340 },
    { id: 'deer',       name: 'Deer',       emoji: '🦌', imageKey: 'pet_Fawn',       chance: 380 },
    { id: 'scorpion',   name: 'Scorpion',   emoji: '🦂', imageKey: 'pet_Hedgehog',   chance: 420 },
    { id: 'jellyfish',  name: 'Jellyfish',  emoji: '🪼', imageKey: 'pet_Blobfish',   chance: 470 },
    { id: 'seahorse',   name: 'Seahorse',   emoji: '🐟', imageKey: 'pet_Green_Fish', chance: 520 },
    { id: 'starfish',   name: 'Starfish',   emoji: '⭐', imageKey: 'pet_Goldfish',   chance: 570 },
    { id: 'red_panda',  name: 'Red Panda',  emoji: '🦝', imageKey: 'pet_Raccoon',    chance: 620 },
    { id: 'arctic_fox', name: 'Arctic Fox', emoji: '🦊', imageKey: 'pet_Fox',        chance: 680 },
    { id: 'wolf',       name: 'Wolf',       emoji: '🐺', imageKey: 'pet_Dog',        chance: 740 },
    { id: 'panther',    name: 'Panther',    emoji: '🐈‍⬛', imageKey: 'pet_Cat',       chance: 800 },
    { id: 'fawn',       name: 'Fawn',       emoji: '🦌', imageKey: 'pet_Fawn',       chance: 850 },
    { id: 'pelican',    name: 'Pelican',    emoji: '🐦', imageKey: 'pet_Turkey',     chance: 930 },
    { id: 'eagle',      name: 'Eagle',      emoji: '🦅', imageKey: 'pet_Parrot',     chance: 950 },
    { id: 'mole',       name: 'Mole',       emoji: '🐾', imageKey: 'pet_Hedgehog',   chance: 970 },
    { id: 'badger',     name: 'Badger',     emoji: '🦡', imageKey: 'pet_Raccoon',    chance: 990 },

    // ── Improved [1000, 5000) — 14 pets, with gaps ──
    { id: 'horse',      name: 'Horse',         emoji: '🐴', imageKey: 'pet_Horse',       chance: 1_000 },
    { id: 'elephant',   name: 'Elephant',      emoji: '🐘', imageKey: 'pet_Elephant',    chance: 1_200 },
    { id: 'lion',       name: 'Lion',          emoji: '🦁', imageKey: 'pet_Cat',         chance: 1_500 },
    { id: 'tiger',      name: 'Tiger',         emoji: '🐯', imageKey: 'pet_Cat',         chance: 1_800 },
    { id: 'llama',      name: 'Llama',         emoji: '🦙', imageKey: 'pet_Llama',       chance: 2_000 },
    { id: 'bear',       name: 'Bear',          emoji: '🐻', imageKey: 'pet_Dog',         chance: 2_300 },
    { id: 'gecko',      name: 'Gecko',         emoji: '🦎', imageKey: 'pet_Gecko',       chance: 2_600 },
    { id: 'crocodile',  name: 'Crocodile',     emoji: '🐊', imageKey: 'pet_Green_Cobra', chance: 2_900 },
    { id: 'hawk',       name: 'Hawk',          emoji: '🦅', imageKey: 'pet_Parrot',      chance: 3_200 },
    { id: 'jaguar',     name: 'Jaguar',        emoji: '🐆', imageKey: 'pet_Cat',         chance: 3_500 },
    { id: 'bison',      name: 'Bison',         emoji: '🦬', imageKey: 'pet_Cow',         chance: 3_800 },
    { id: 'rhino',      name: 'Rhino',         emoji: '🦏', imageKey: 'pet_Elephant',    chance: 4_000 },
    { id: 'gorilla',    name: 'Gorilla',       emoji: '🦍', imageKey: 'pet_Monkey',      chance: 4_300 },
    { id: 'snow_leopard', name: 'Snow Leopard', emoji: '🐆', imageKey: 'pet_Cat',        chance: 4_700 },

    // ── Rare [5000, 50000) — 12 pets, with gaps ──
    { id: 'shark',       name: 'Shark',         emoji: '🦈', imageKey: 'pet_Shark',        chance: 5_000 },
    { id: 'green_cobra', name: 'Green Cobra',   emoji: '🐍', imageKey: 'pet_Green_Cobra',  chance: 6_500 },
    { id: 'polar_bear',  name: 'Polar Bear',    emoji: '🐻‍❄️', imageKey: 'pet_Dog',        chance: 8_000 },
    { id: 'lemur',       name: 'Lemur',         emoji: '🐒', imageKey: 'pet_Lemur',        chance: 10_000 },
    { id: 'octopus',     name: 'Octopus',       emoji: '🐙', imageKey: 'pet_Blobfish',     chance: 13_000 },
    { id: 'electric_eel', name: 'Electric Eel', emoji: '⚡', imageKey: 'pet_Green_Fish',   chance: 16_000 },
    { id: 'saber_tooth', name: 'Saber Tooth',   emoji: '🐯', imageKey: 'pet_Cat',          chance: 20_000 },
    { id: 'purple_cobra', name: 'Purple Cobra', emoji: '🐍', imageKey: 'pet_Purple_Cobra', chance: 25_000 },
    { id: 'dire_wolf',   name: 'Dire Wolf',     emoji: '🐺', imageKey: 'pet_Dog',          chance: 30_000 },
    { id: 'thunderbird', name: 'Thunderbird',   emoji: '🦅', imageKey: 'pet_Parrot',       chance: 35_000 },
    { id: 'basilisk',    name: 'Basilisk',      emoji: '🐍', imageKey: 'pet_Green_Cobra',  chance: 40_000 },
    { id: 'kraken',      name: 'Kraken',        emoji: '🐙', imageKey: 'pet_Blobfish',     chance: 45_000 },

    // ── Valuable [50000, 500000) — 8 pets, with gaps ──
    { id: 'blobfish',    name: 'Blobfish',      emoji: '🐡', imageKey: 'pet_Blobfish',     chance: 50_000 },
    { id: 'narwhal',     name: 'Narwhal',       emoji: '🐋', imageKey: 'pet_Blue_Fish',    chance: 75_000 },
    { id: 'yeti',        name: 'Yeti',          emoji: '🦍', imageKey: 'pet_Llama',        chance: 100_000 },
    { id: 'chimera',     name: 'Chimera',       emoji: '🦁', imageKey: 'pet_Lemur',        chance: 150_000 },
    { id: 'cerberus',    name: 'Cerberus',      emoji: '🐕', imageKey: 'pet_Dog',          chance: 200_000 },
    { id: 'wyvern',      name: 'Wyvern',        emoji: '🐉', imageKey: 'pet_Green_Cobra',  chance: 280_000 },
    { id: 'sphinx',      name: 'Sphinx',        emoji: '🐱', imageKey: 'pet_Cat',          chance: 350_000 },
    { id: 'unicorn',     name: 'Unicorn',       emoji: '🦄', imageKey: 'pet_Horse',        chance: 420_000 },

    // ── Elite [500000, 5000000) — 5 pets, with gaps ──
    { id: 'kitsune',     name: 'Kitsune',       emoji: '🦊', imageKey: 'pet_Fox',          chance: 500_000 },
    { id: 'vampire',     name: 'Vampire',       emoji: '🧛', imageKey: 'pet_Lemur',        chance: 1_000_000 },
    { id: 'pegasus',     name: 'Pegasus',       emoji: '🐴', imageKey: 'pet_Horse',        chance: 2_000_000 },
    { id: 'griffin',     name: 'Griffin',        emoji: '🦅', imageKey: 'pet_Parrot',       chance: 3_000_000 },
    { id: 'minotaur',    name: 'Minotaur',      emoji: '🐂', imageKey: 'pet_Cow',          chance: 4_500_000 },

    // ── Epic [5000000, 50000000) — 4 pets, with gaps ──
    { id: 'dragon',       name: 'Dragon',        emoji: '🐉', imageKey: 'pet_Gecko',       chance: 5_000_000 },
    { id: 'hydra',        name: 'Hydra',         emoji: '🐍', imageKey: 'pet_Green_Cobra', chance: 15_000_000 },
    { id: 'leviathan',    name: 'Leviathan',     emoji: '🐋', imageKey: 'pet_Shark',       chance: 30_000_000 },
    { id: 'thunder_dragon', name: 'Thunder Dragon', emoji: '⚡', imageKey: 'pet_Gecko',    chance: 45_000_000 },

    // ── Heroic [50M, 250M) — 2 pets ──
    { id: 'cosmic_whale', name: 'Cosmic Whale',  emoji: '🐋', imageKey: 'pet_Blue_Fish',   chance: 75_000_000 },
    { id: 'void_serpent', name: 'Void Serpent',   emoji: '🐍', imageKey: 'pet_Purple_Cobra', chance: 200_000_000 },

    // ── Mythic [250M, 500M) — 1 pet ──
    { id: 'celestial_fox', name: 'Celestial Fox', emoji: '🦊', imageKey: 'pet_Fox',        chance: 300_000_000 },

    // ── Ancient [500M, 750M) — 1 pet ──
    { id: 'chrono_drake', name: 'Chrono Drake',  emoji: '🐉', imageKey: 'pet_Gecko',       chance: 600_000_000 },

    // ── Legendary [750M, 1B) — 1 pet ──
    { id: 'infinity_dragon', name: 'Infinity Dragon', emoji: '🐉', imageKey: 'pet_Gecko',  chance: 800_000_000 },
];

export const TOTAL_PETS = PETS.length;

export function getPetsByGrade(grade: Grade): PetDef[] {
    return PETS.filter(p => getGradeForChance(p.chance) === grade);
}

/** Sort grade order index (higher = rarer) */
export function getGradeIndex(grade: Grade): number {
    return GRADE_ORDER.indexOf(grade);
}
