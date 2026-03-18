import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const SRC_DIR = 'NewPets/pets2';
const DEST_DIR = 'public/assets/pets';

const FILE_MAP = [
    ['Chicken 1.png', '0115'],
    ['Donkey 1.png', '0116'],
    ['Guinea Pig 1.png', '0117'],
    ['Hedgehog 1.png', '0118'],
    ['Ant 1.png', '0119'],
    ['Snail 1.png', '0120'],
    ['Chipmunk 1.png', '0121'],
    ['Crab 1.png', '0122'],
    ['Lobster 1.png', '0123'],
    ['Starfish 1.png', '0124'],
    ['Chihuahua 1.png', '0125'],
    ['Gecko 1.png', '0126'],
    ['Pug 1.png', '0127'],
    ['Dachshund 1.png', '0128'],
    ['Bulldog 1.png', '0129'],
    ['Corgi 1.png', '0130'],
    ['Golden Retriever 1.png', '0131'],
    ['Dalmatian 1.png', '0132'],
    ['Fox 1.png', '0133'],
    ['Chinchilla 1.png', '0134'],
    ['Poodle 1.png', '0135'],
    ['Deer 1.png', '0136'],
    ['Monkey 1.png', '0137'],
    ['Sloth 1.png', '0138'],
    ['Iguana 1.png', '0139'],
    ['Husky 1.png', '0140'],
    ['Salamander 1.png', '0141'],
    ['Armadillo 1.png', '0142'],
    ['Parrot 1 1.png', '0143'],
    ['Lemur 1.png', '0144'],
    ['Samoyed 1.png', '0145'],
    ['Bison 1.png', '0146'],
    ['Warthog 1.png', '0147'],
    ['Dragonfly 1.png', '0148'],
    ['Tapir 1.png', '0149'],
    ['Manatee 1.png', '0150'],
    ['Flamingo 1.png', '0151'],
    ['Horse 1.png', '0152'],
    ['Ostrich 1.png', '0153'],
    ['Mantis 1.png', '0154'],
    ['Magpie 1.png', '0155'],
    ['Stork 1.png', '0156'],
    ['Peacock 1.png', '0157'],
    ['Platypus 1.png', '0158'],
    ['Piranha 1.png', '0159'],
    ['Pangolin 1.png', '0160'],
    ['Elephant 1.png', '0161'],
    ['Eagle 1.png', '0162'],
    ['Vulture 1.png', '0163'],
    ['Tiger 1.png', '0164'],
    ['Lynx 1.png', '0165'],
    ['Panther 1.png', '0166'],
    ['Polar Bear 1 1.png', '0167'],
    ['Wolverine 1 1.png', '0168'],
    ['Stingray 1.png', '0169'],
    ['Narwhal 1.png', '0170'],
    ['Imp 1.png', '0171'],
    ['Werewolf 1.png', '0172'],
    ['Gargoyle 1.png', '0173'],
    ['Banshee 1.png', '0174'],
    ['Wraith 1.png', '0175'],
    ['Fairy 1.png', '0176'],
    ['Dragon Green 1.png', '0177'],
    ['Treant 1.png', '0178'],
    ['Dragon Red 1.png', '0179'],
    ['Unicorn 1.png', '0180'],
    ['Dragon Ice 1.png', '0181'],
    ['Hydra 1.png', '0182'],
    ['Thunderbird 1.png', '0183'],
    ['Fenrir 1.png', '0184'],
    ['Kraken 1.png', '0185'],
    ['Dragon Gold 1.png', '0186'],
    ['Dragon Silver 1.png', '0187'],
    ['Lich 1.png', '0188'],
    ['Wendigo 1.png', '0189'],
];

async function convert() {
    let ok = 0;
    let fail = 0;
    for (const [src, id] of FILE_MAP) {
        const inPath = join(SRC_DIR, src);
        const outPath = join(DEST_DIR, `${id}.webp`);
        try {
            await sharp(inPath)
                .trim()
                .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 85 })
                .toFile(outPath);
            ok++;
            console.log(`✓ ${src} → ${id}.webp`);
        } catch (e) {
            fail++;
            console.error(`✗ ${src}: ${e.message}`);
        }
    }
    console.log(`\nDone: ${ok} converted, ${fail} failed`);
}

convert();
