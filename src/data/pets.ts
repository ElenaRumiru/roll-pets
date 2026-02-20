import { PetDef, Grade } from '../types';
import { getGradeForChance, GRADE_ORDER } from '../core/config';

export const PETS: PetDef[] = [
    // ── Common [2, 100) — 28 pets ──
    // Domestic & farm
    { id: 'cat',        name: 'Cat',        emoji: '🐱', imageKey: 'pet_0037', chance: 2 },
    { id: 'beagle',     name: 'Beagle',     emoji: '🐶', imageKey: 'pet_0029', chance: 3 },
    { id: 'mouse',      name: 'Mouse',      emoji: '🐭', imageKey: 'pet_0045', chance: 4 },
    { id: 'hamster',    name: 'Hamster',    emoji: '🐹', imageKey: 'pet_0020', chance: 5 },
    { id: 'hare',       name: 'Hare',       emoji: '🐰', imageKey: 'pet_0041', chance: 6 },
    { id: 'sheep',      name: 'Sheep',      emoji: '🐑', imageKey: 'pet_0028', chance: 7 },
    { id: 'goat',       name: 'Goat',       emoji: '🐐', imageKey: 'pet_0063', chance: 8 },
    { id: 'cow',        name: 'Cow',        emoji: '🐄', imageKey: 'pet_0035', chance: 10 },
    { id: 'pig',        name: 'Pig',        emoji: '🐷', imageKey: 'pet_0044', chance: 12 },
    // Yard birds, pond, simple insects
    { id: 'pigeon',     name: 'Pigeon',     emoji: '🐦', imageKey: 'pet_0074', chance: 14 },
    { id: 'duck',       name: 'Duck',       emoji: '🦆', imageKey: 'pet_0032', chance: 16 },
    { id: 'frog',       name: 'Frog',       emoji: '🐸', imageKey: 'pet_0030', chance: 18 },
    { id: 'bee',        name: 'Bee',        emoji: '🐝', imageKey: 'pet_0024', chance: 20 },
    { id: 'ladybug',    name: 'Ladybug',    emoji: '🐞', imageKey: 'pet_0025', chance: 24 },
    { id: 'grasshopper', name: 'Grasshopper', emoji: '🦗', imageKey: 'pet_0086', chance: 28 },
    // Rest of Common
    { id: 'goldfish',   name: 'Goldfish',   emoji: '🐠', imageKey: 'pet_0027', chance: 32 },
    { id: 'turkey',     name: 'Turkey',     emoji: '🦃', imageKey: 'pet_0008', chance: 36 },
    { id: 'squirrel',   name: 'Squirrel',   emoji: '🐿️', imageKey: 'pet_0021', chance: 40 },
    { id: 'mole',       name: 'Mole',       emoji: '🐾', imageKey: 'pet_0060', chance: 44 },
    { id: 'opossum',    name: 'Opossum',    emoji: '🐾', imageKey: 'pet_0057', chance: 48 },
    { id: 'porcupine',  name: 'Porcupine',  emoji: '🦔', imageKey: 'pet_0055', chance: 52 },
    { id: 'ferret',     name: 'Ferret',     emoji: '🐾', imageKey: 'pet_0067', chance: 57 },
    { id: 'badger',     name: 'Badger',     emoji: '🦡', imageKey: 'pet_0058', chance: 62 },
    { id: 'beaver',     name: 'Beaver',     emoji: '🦫', imageKey: 'pet_0053', chance: 67 },
    { id: 'raccoon',    name: 'Raccoon',    emoji: '🦝', imageKey: 'pet_0023', chance: 72 },
    { id: 'shiba',      name: 'Shiba',      emoji: '🐕', imageKey: 'pet_0007', chance: 78 },
    { id: 'turtle',     name: 'Turtle',     emoji: '🐢', imageKey: 'pet_0012', chance: 85 },
    { id: 'snake',      name: 'Snake',      emoji: '🐍', imageKey: 'pet_0038', chance: 93 },

    // ── Uncommon [100, 1000) — 25 pets ──
    { id: 'penguin',    name: 'Penguin',    emoji: '🐧', imageKey: 'pet_0031', chance: 100 },
    { id: 'panda',      name: 'Panda',      emoji: '🐼', imageKey: 'pet_0011', chance: 120 },
    { id: 'koala',      name: 'Koala',      emoji: '🐨', imageKey: 'pet_0039', chance: 140 },
    { id: 'owl',        name: 'Owl',        emoji: '🦉', imageKey: 'pet_0036', chance: 160 },
    { id: 'capybara',   name: 'Capybara',   emoji: '🐾', imageKey: 'pet_0019', chance: 180 },
    { id: 'red_panda',  name: 'Red Panda',  emoji: '🦊', imageKey: 'pet_0059', chance: 200 },
    { id: 'otter',      name: 'Otter',      emoji: '🦦', imageKey: 'pet_0068', chance: 230 },
    { id: 'meerkat',    name: 'Meerkat',    emoji: '🐾', imageKey: 'pet_0050', chance: 260 },
    { id: 'llama',      name: 'Llama',      emoji: '🦙', imageKey: 'pet_0061', chance: 290 },
    { id: 'camel',      name: 'Camel',      emoji: '🐫', imageKey: 'pet_0062', chance: 320 },
    { id: 'ram',        name: 'Ram',        emoji: '🐏', imageKey: 'pet_0064', chance: 360 },
    { id: 'moose',      name: 'Moose',      emoji: '🫎', imageKey: 'pet_0054', chance: 400 },
    { id: 'anteater',   name: 'Anteater',   emoji: '🐾', imageKey: 'pet_0056', chance: 440 },
    { id: 'seal',       name: 'Seal',       emoji: '🦭', imageKey: 'pet_0006', chance: 480 },
    { id: 'heron',      name: 'Heron',      emoji: '🦩', imageKey: 'pet_0072', chance: 530 },
    { id: 'kiwi',       name: 'Kiwi',       emoji: '🐦', imageKey: 'pet_0073', chance: 580 },
    { id: 'swan',       name: 'Swan',       emoji: '🦢', imageKey: 'pet_0077', chance: 630 },
    { id: 'pelican',    name: 'Pelican',    emoji: '🐦', imageKey: 'pet_0070', chance: 680 },
    { id: 'toucan',     name: 'Toucan',     emoji: '🐦', imageKey: 'pet_0071', chance: 730 },
    { id: 'bat',        name: 'Bat',        emoji: '🦇', imageKey: 'pet_0018', chance: 780 },
    { id: 'spider',     name: 'Spider',     emoji: '🕷️', imageKey: 'pet_0026', chance: 830 },
    { id: 'giraffe',    name: 'Giraffe',    emoji: '🦒', imageKey: 'pet_0040', chance: 870 },
    { id: 'zebra',      name: 'Zebra',      emoji: '🦓', imageKey: 'pet_0042', chance: 910 },
    { id: 'hyena',      name: 'Hyena',      emoji: '🐺', imageKey: 'pet_0065', chance: 950 },
    { id: 'seahorse',   name: 'Seahorse',   emoji: '🐾', imageKey: 'pet_0081', chance: 980 },

    // ── Improved [1000, 5000) — 16 pets ──
    { id: 'dolphin',    name: 'Dolphin',    emoji: '🐬', imageKey: 'pet_0014', chance: 1_000 },
    { id: 'chameleon',  name: 'Chameleon',  emoji: '🦎', imageKey: 'pet_0015', chance: 1_200 },
    { id: 'octopus',    name: 'Octopus',    emoji: '🐙', imageKey: 'pet_0033', chance: 1_400 },
    { id: 'axolotl',    name: 'Axolotl',    emoji: '🦎', imageKey: 'pet_0034', chance: 1_700 },
    { id: 'crocodile',  name: 'Crocodile',  emoji: '🐊', imageKey: 'pet_0079', chance: 2_000 },
    { id: 'cobra',      name: 'Cobra',      emoji: '🐍', imageKey: 'pet_0080', chance: 2_300 },
    { id: 'kangaroo',   name: 'Kangaroo',   emoji: '🦘', imageKey: 'pet_0022', chance: 2_500 },
    { id: 'falcon',     name: 'Falcon',     emoji: '🦅', imageKey: 'pet_0076', chance: 2_800 },
    { id: 'raven',      name: 'Raven',      emoji: '🐦‍⬛', imageKey: 'pet_0075', chance: 3_000 },
    { id: 'hummingbird', name: 'Hummingbird', emoji: '🐦', imageKey: 'pet_0078', chance: 3_200 },
    { id: 'scorpion',   name: 'Scorpion',   emoji: '🦂', imageKey: 'pet_0087', chance: 3_500 },
    { id: 'pufferfish', name: 'Pufferfish', emoji: '🐡', imageKey: 'pet_0082', chance: 3_700 },
    { id: 'fennec_fox', name: 'Fennec Fox', emoji: '🦊', imageKey: 'pet_0090', chance: 4_000 },
    { id: 'pallas_cat', name: 'Pallas Cat', emoji: '🐱', imageKey: 'pet_0107', chance: 4_200 },
    { id: 'gorilla',    name: 'Gorilla',    emoji: '🦍', imageKey: 'pet_0069', chance: 4_500 },
    { id: 'rhino',      name: 'Rhino',      emoji: '🦏', imageKey: 'pet_0052', chance: 4_800 },

    // ── Rare [5000, 50000) — 14 pets ──
    { id: 'lion',       name: 'Lion',       emoji: '🦁', imageKey: 'pet_0005', chance: 5_000 },
    { id: 'cheetah',    name: 'Cheetah',    emoji: '🐆', imageKey: 'pet_0002', chance: 7_000 },
    { id: 'jaguar',     name: 'Jaguar',     emoji: '🐆', imageKey: 'pet_0004', chance: 9_000 },
    { id: 'shark',      name: 'Shark',      emoji: '🦈', imageKey: 'pet_0013', chance: 11_000 },
    { id: 'bear',       name: 'Bear',       emoji: '🐻', imageKey: 'pet_0046', chance: 14_000 },
    { id: 'wolf',       name: 'Wolf',       emoji: '🐺', imageKey: 'pet_0048', chance: 17_000 },
    { id: 'whale',      name: 'Whale',      emoji: '🐋', imageKey: 'pet_0010', chance: 20_000 },
    { id: 'walrus',     name: 'Walrus',     emoji: '🦭', imageKey: 'pet_0009', chance: 24_000 },
    { id: 'hippo',      name: 'Hippo',      emoji: '🦛', imageKey: 'pet_0001', chance: 28_000 },
    { id: 'jellyfish',  name: 'Jellyfish',  emoji: '🪼', imageKey: 'pet_0084', chance: 32_000 },
    { id: 'squid',      name: 'Squid',      emoji: '🦑', imageKey: 'pet_0085', chance: 36_000 },
    { id: 'anglerfish', name: 'Anglerfish', emoji: '🐟', imageKey: 'pet_0083', chance: 40_000 },
    { id: 'mammoth',    name: 'Mammoth',    emoji: '🦣', imageKey: 'pet_0043', chance: 44_000 },
    { id: 'sabertooth', name: 'Sabertooth', emoji: '🐯', imageKey: 'pet_0105', chance: 48_000 },

    // ── Valuable [50000, 500000) — 10 pets ──
    { id: 'slime',       name: 'Slime',           emoji: '🟢', imageKey: 'pet_0047', chance: 50_000 },
    { id: 'ghost',       name: 'Ghost',           emoji: '👻', imageKey: 'pet_0093', chance: 75_000 },
    { id: 'skeleton',    name: 'Skeleton',        emoji: '💀', imageKey: 'pet_0094', chance: 100_000 },
    { id: 'zombie',      name: 'Zombie',          emoji: '🧟', imageKey: 'pet_0095', chance: 140_000 },
    { id: 'robot',       name: 'Robot',           emoji: '🤖', imageKey: 'pet_0097', chance: 180_000 },
    { id: 'snowman',     name: 'Snowman',         emoji: '⛄', imageKey: 'pet_0100', chance: 220_000 },
    { id: 'teddy_bear',  name: 'Teddy Bear',      emoji: '🧸', imageKey: 'pet_0114', chance: 270_000 },
    { id: 'gingerbread_man', name: 'Gingerbread Man', emoji: '🍪', imageKey: 'pet_0109', chance: 320_000 },
    { id: 'yeti',        name: 'Yeti',            emoji: '❄️', imageKey: 'pet_0108', chance: 400_000 },
    { id: 'mimic',       name: 'Mimic',           emoji: '📦', imageKey: 'pet_0049', chance: 480_000 },

    // ── Elite [500000, 5000000) — 7 pets ──
    { id: 'griffin',     name: 'Griffin',     emoji: '🦅', imageKey: 'pet_0003', chance: 500_000 },
    { id: 'kitsune',     name: 'Kitsune',     emoji: '🦊', imageKey: 'pet_0091', chance: 800_000 },
    { id: 'golem',       name: 'Golem',       emoji: '🗿', imageKey: 'pet_0092', chance: 1_200_000 },
    { id: 'vampire',     name: 'Vampire',     emoji: '🧛', imageKey: 'pet_0096', chance: 1_800_000 },
    { id: 'cerberus',    name: 'Cerberus',    emoji: '🐕', imageKey: 'pet_0088', chance: 2_500_000 },
    { id: 'minotaur',    name: 'Minotaur',    emoji: '🐂', imageKey: 'pet_0101', chance: 3_500_000 },
    { id: 'nightmare',   name: 'Nightmare',   emoji: '🐴', imageKey: 'pet_0106', chance: 4_500_000 },

    // ── Epic [5000000, 50000000) — 6 pets ──
    { id: 'dragon',     name: 'Dragon',     emoji: '🐉', imageKey: 'pet_0016', chance: 5_000_000 },
    { id: 'pegasus',    name: 'Pegasus',    emoji: '🦄', imageKey: 'pet_0089', chance: 8_000_000 },
    { id: 'alien',      name: 'Alien',      emoji: '👽', imageKey: 'pet_0098', chance: 15_000_000 },
    { id: 'astronaut',  name: 'Astronaut',  emoji: '🧑‍🚀', imageKey: 'pet_0099', chance: 22_000_000 },
    { id: 'sphinx',     name: 'Sphinx',     emoji: '🗿', imageKey: 'pet_0102', chance: 35_000_000 },
    { id: 'ifrit',      name: 'Ifrit',      emoji: '🔥', imageKey: 'pet_0051', chance: 45_000_000 },

    // ── Heroic [50M, 250M) — 3 pets ──
    { id: 'phoenix',       name: 'Phoenix',       emoji: '🔥', imageKey: 'pet_0017', chance: 50_000_000 },
    { id: 'djinn',         name: 'Djinn',         emoji: '🧞', imageKey: 'pet_0103', chance: 120_000_000 },
    { id: 'cheshire_cat',  name: 'Cheshire Cat',  emoji: '😸', imageKey: 'pet_0112', chance: 200_000_000 },

    // ── Mythic [250M, 500M) — 1 pet ──
    { id: 'chinese_dragon', name: 'Chinese Dragon', emoji: '🐲', imageKey: 'pet_0110', chance: 350_000_000 },

    // ── Ancient [500M, 750M) — 1 pet ──
    { id: 'beholder',   name: 'Beholder',   emoji: '👁️', imageKey: 'pet_0104', chance: 600_000_000 },

    // ── Legendary [750M, 1B) — 1 pet ──
    { id: 'grim_reaper', name: 'Grim Reaper', emoji: '💀', imageKey: 'pet_0113', chance: 800_000_000 },
];

export const TOTAL_PETS = PETS.length;

export function getPetsByGrade(grade: Grade): PetDef[] {
    return PETS.filter(p => getGradeForChance(p.chance) === grade);
}

/** Sort grade order index (higher = rarer) */
export function getGradeIndex(grade: Grade): number {
    return GRADE_ORDER.indexOf(grade);
}
