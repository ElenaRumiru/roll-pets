import { PetDef } from '../types';

export const PETS: PetDef[] = [
    // Common (12)
    { id: 'cat',        name: 'Cat',        emoji: '🐱', imageKey: 'pet_Cat',        rarity: 'common' },
    { id: 'dog',        name: 'Dog',        emoji: '🐶', imageKey: 'pet_Dog',        rarity: 'common' },
    { id: 'bunny',      name: 'Bunny',      emoji: '🐰', imageKey: 'pet_Bunny',      rarity: 'common' },
    { id: 'chick',      name: 'Chick',      emoji: '🐤', imageKey: 'pet_Chick',      rarity: 'common' },
    { id: 'chicken',    name: 'Chicken',    emoji: '🐔', imageKey: 'pet_Chicken',    rarity: 'common' },
    { id: 'lamb',       name: 'Lamb',       emoji: '🐑', imageKey: 'pet_Lamb',       rarity: 'common' },
    { id: 'piggy',      name: 'Piggy',      emoji: '🐷', imageKey: 'pet_Piggy',      rarity: 'common' },
    { id: 'squirrel',   name: 'Squirrel',   emoji: '🐿️', imageKey: 'pet_Squirrel',   rarity: 'common' },
    { id: 'cow',        name: 'Cow',        emoji: '🐄', imageKey: 'pet_Cow',        rarity: 'common' },
    { id: 'froggy',     name: 'Froggy',     emoji: '🐸', imageKey: 'pet_Froggy',     rarity: 'common' },
    { id: 'turkey',     name: 'Turkey',     emoji: '🦃', imageKey: 'pet_Turkey',     rarity: 'common' },
    { id: 'goldfish',   name: 'Goldfish',   emoji: '🐟', imageKey: 'pet_Goldfish',   rarity: 'common' },

    // Uncommon (8)
    { id: 'fox',        name: 'Fox',        emoji: '🦊', imageKey: 'pet_Fox',        rarity: 'uncommon' },
    { id: 'raccoon',    name: 'Raccoon',    emoji: '🦝', imageKey: 'pet_Raccoon',    rarity: 'uncommon' },
    { id: 'monkey',     name: 'Monkey',     emoji: '🐒', imageKey: 'pet_Monkey',     rarity: 'uncommon' },
    { id: 'parrot',     name: 'Parrot',     emoji: '🦜', imageKey: 'pet_Parrot',     rarity: 'uncommon' },
    { id: 'hedgehog',   name: 'Hedgehog',   emoji: '🦔', imageKey: 'pet_Hedgehog',   rarity: 'uncommon' },
    { id: 'bee',        name: 'Bee',        emoji: '🐝', imageKey: 'pet_Bee',        rarity: 'uncommon' },
    { id: 'green_fish', name: 'Green Fish', emoji: '🐟', imageKey: 'pet_Green_Fish', rarity: 'uncommon' },
    { id: 'blue_fish',  name: 'Blue Fish',  emoji: '🐟', imageKey: 'pet_Blue_Fish',  rarity: 'uncommon' },

    // Rare (5)
    { id: 'horse',      name: 'Horse',      emoji: '🐴', imageKey: 'pet_Horse',      rarity: 'rare' },
    { id: 'elephant',   name: 'Elephant',   emoji: '🐘', imageKey: 'pet_Elephant',   rarity: 'rare' },
    { id: 'llama',      name: 'Llama',      emoji: '🦙', imageKey: 'pet_Llama',      rarity: 'rare' },
    { id: 'fawn',       name: 'Fawn',       emoji: '🦌', imageKey: 'pet_Fawn',       rarity: 'rare' },
    { id: 'gecko',      name: 'Gecko',      emoji: '🦎', imageKey: 'pet_Gecko',      rarity: 'rare' },

    // Epic (3)
    { id: 'shark',      name: 'Shark',      emoji: '🦈', imageKey: 'pet_Shark',      rarity: 'epic' },
    { id: 'green_cobra',name: 'Green Cobra',emoji: '🐍', imageKey: 'pet_Green_Cobra',rarity: 'epic' },
    { id: 'lemur',      name: 'Lemur',      emoji: '🐒', imageKey: 'pet_Lemur',      rarity: 'epic' },

    // Legendary (2)
    { id: 'purple_cobra',name: 'Purple Cobra',emoji: '🐍', imageKey: 'pet_Purple_Cobra',rarity: 'legendary' },
    { id: 'blobfish',   name: 'Blobfish',   emoji: '🐡', imageKey: 'pet_Blobfish',   rarity: 'legendary' },
];

export const TOTAL_PETS = PETS.length;

export function getPetsByRarity(rarity: string): PetDef[] {
    return PETS.filter(p => p.rarity === rarity);
}
