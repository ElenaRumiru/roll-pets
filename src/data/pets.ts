import { PetDef } from '../types';

export const PETS: PetDef[] = [
    // Common (12) — chance 2..20
    { id: 'cat',        name: 'Cat',        emoji: '🐱', imageKey: 'pet_Cat',        rarity: 'common', chance: 2 },
    { id: 'dog',        name: 'Dog',        emoji: '🐶', imageKey: 'pet_Dog',        rarity: 'common', chance: 3 },
    { id: 'bunny',      name: 'Bunny',      emoji: '🐰', imageKey: 'pet_Bunny',      rarity: 'common', chance: 4 },
    { id: 'chick',      name: 'Chick',      emoji: '🐤', imageKey: 'pet_Chick',      rarity: 'common', chance: 5 },
    { id: 'chicken',    name: 'Chicken',    emoji: '🐔', imageKey: 'pet_Chicken',    rarity: 'common', chance: 6 },
    { id: 'lamb',       name: 'Lamb',       emoji: '🐑', imageKey: 'pet_Lamb',       rarity: 'common', chance: 7 },
    { id: 'piggy',      name: 'Piggy',      emoji: '🐷', imageKey: 'pet_Piggy',      rarity: 'common', chance: 8 },
    { id: 'squirrel',   name: 'Squirrel',   emoji: '🐿️', imageKey: 'pet_Squirrel',   rarity: 'common', chance: 10 },
    { id: 'cow',        name: 'Cow',        emoji: '🐄', imageKey: 'pet_Cow',        rarity: 'common', chance: 12 },
    { id: 'froggy',     name: 'Froggy',     emoji: '🐸', imageKey: 'pet_Froggy',     rarity: 'common', chance: 15 },
    { id: 'turkey',     name: 'Turkey',     emoji: '🦃', imageKey: 'pet_Turkey',     rarity: 'common', chance: 18 },
    { id: 'goldfish',   name: 'Goldfish',   emoji: '🐟', imageKey: 'pet_Goldfish',   rarity: 'common', chance: 20 },

    // Uncommon (8) — chance 30..100
    { id: 'fox',        name: 'Fox',        emoji: '🦊', imageKey: 'pet_Fox',        rarity: 'uncommon', chance: 30 },
    { id: 'raccoon',    name: 'Raccoon',    emoji: '🦝', imageKey: 'pet_Raccoon',    rarity: 'uncommon', chance: 40 },
    { id: 'monkey',     name: 'Monkey',     emoji: '🐒', imageKey: 'pet_Monkey',     rarity: 'uncommon', chance: 50 },
    { id: 'parrot',     name: 'Parrot',     emoji: '🦜', imageKey: 'pet_Parrot',     rarity: 'uncommon', chance: 55 },
    { id: 'hedgehog',   name: 'Hedgehog',   emoji: '🦔', imageKey: 'pet_Hedgehog',   rarity: 'uncommon', chance: 65 },
    { id: 'bee',        name: 'Bee',        emoji: '🐝', imageKey: 'pet_Bee',        rarity: 'uncommon', chance: 75 },
    { id: 'green_fish', name: 'Green Fish', emoji: '🐟', imageKey: 'pet_Green_Fish', rarity: 'uncommon', chance: 85 },
    { id: 'blue_fish',  name: 'Blue Fish',  emoji: '🐟', imageKey: 'pet_Blue_Fish',  rarity: 'uncommon', chance: 100 },

    // Rare (5) — chance 200..1,000
    { id: 'horse',      name: 'Horse',      emoji: '🐴', imageKey: 'pet_Horse',      rarity: 'rare', chance: 200 },
    { id: 'elephant',   name: 'Elephant',   emoji: '🐘', imageKey: 'pet_Elephant',   rarity: 'rare', chance: 350 },
    { id: 'llama',      name: 'Llama',      emoji: '🦙', imageKey: 'pet_Llama',      rarity: 'rare', chance: 500 },
    { id: 'fawn',       name: 'Fawn',       emoji: '🦌', imageKey: 'pet_Fawn',       rarity: 'rare', chance: 750 },
    { id: 'gecko',      name: 'Gecko',      emoji: '🦎', imageKey: 'pet_Gecko',      rarity: 'rare', chance: 1_000 },

    // Epic (3) — chance 2,500..10,000
    { id: 'shark',      name: 'Shark',      emoji: '🦈', imageKey: 'pet_Shark',      rarity: 'epic', chance: 2_500 },
    { id: 'green_cobra',name: 'Green Cobra',emoji: '🐍', imageKey: 'pet_Green_Cobra',rarity: 'epic', chance: 5_000 },
    { id: 'lemur',      name: 'Lemur',      emoji: '🐒', imageKey: 'pet_Lemur',      rarity: 'epic', chance: 10_000 },

    // Legendary (2) — chance 25,000..50,000
    { id: 'purple_cobra',name: 'Purple Cobra',emoji: '🐍', imageKey: 'pet_Purple_Cobra',rarity: 'legendary', chance: 25_000 },
    { id: 'blobfish',   name: 'Blobfish',   emoji: '🐡', imageKey: 'pet_Blobfish',   rarity: 'legendary', chance: 50_000 },
];

export const TOTAL_PETS = PETS.length;

export function getPetsByRarity(rarity: string): PetDef[] {
    return PETS.filter(p => p.rarity === rarity);
}
