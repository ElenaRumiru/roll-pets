import { PETS } from '../data/pets';
import { TOTAL_EGGS } from '../data/eggs';
import { TOTAL_BACKGROUNDS, TOTAL_PORTRAIT_BACKGROUNDS } from '../data/backgrounds';
import { getVisualTier } from '../core/config';
import { GRADE_ORDER } from '../core/config';
import { COL_ICON_NAMES } from '../data/collections';

interface AssetEntry { key: string; path: string }

/** Luck icon suffixes needed at MainScene first frame */
const PHASE1_LUCK = ['empty', 'x2', 'x3', 'x5', 'x100'];

/** All luck icon suffixes */
const ALL_LUCK = [
    'empty','x2','x3','x4','x5','x6','x7','x8','x9','x10',
    'x15','x20','x25','x30','x50','x75','x100','x150','x200','x300',
    'x400','x500','x1000','x3000',
];

/** Luck suffixes that get post-processed in create phase */
export const PROCESSED_LUCK = [
    'empty','x2','x3','x4','x5','x6','x7','x8','x9','x10',
    'x15','x20','x30','x50','x100','x150','x300','x400','x500','x1000',
];

/** Get the top N pet imageKeys from a saved collection */
export function getTopPetKeys(collection: readonly string[], count = 3): string[] {
    const collSet = new Set(collection);
    return PETS
        .filter(p => collSet.has(p.id))
        .sort((a, b) => b.chance - a.chance)
        .slice(0, count)
        .map(p => p.imageKey);
}

/** Assets required for BootScene → MainScene first frame */
export function getPhase1Assets(level: number, topPetKeys: string[]): {
    images: AssetEntry[];
    audio: AssetEntry[];
} {
    const tier = getVisualTier(level);
    const pTier = Math.min(tier, TOTAL_PORTRAIT_BACKGROUNDS);

    const images: AssetEntry[] = [
        // Current background + portrait
        { key: `bg_${tier}`, path: `assets/backgrounds/location_${tier}.webp` },
        { key: `bg_p_${pTier}`, path: `assets/backgrounds/portrait/location_${pTier}.webp` },
        // Current egg + egg_1 (always needed — CenterStage constructor hardcodes it)
        { key: `egg_${tier}`, path: `assets/eggs/egg_${tier}.png` },
        ...(tier !== 1 ? [{ key: 'egg_1', path: 'assets/eggs/egg_1.png' }] : []),
        // Core UI
        { key: 'ui_roll', path: 'assets/ui/roll.png' },
        { key: 'ui_roll_portrait_raw', path: 'assets/ui/roll_mini_square.png' },
        { key: 'ui_collections', path: 'assets/ui/collections.png' },
        { key: 'ui_automod_on', path: 'assets/ui/automod_on.png' },
        { key: 'ui_automod_off', path: 'assets/ui/automod_off.png' },
        { key: 'ui_arrow', path: 'assets/ui/arrow.webp' },
        { key: 'ui_ad_film', path: 'assets/ui/ad_film.png' },
        { key: 'ui_ad_play', path: 'assets/ui/ad_play.png' },
        { key: 'ui_coin_raw', path: 'assets/ui/coin.png' },
        { key: 'ui_exp_raw', path: 'assets/ui/exp.png' },
        { key: 'ui_lvl_raw', path: 'assets/ui/lvl_icon.png' },
        { key: 'ui_shop', path: 'assets/ui/shop_icon.png' },
        { key: 'ui_rating', path: 'assets/ui/Rating_icon.png' },
        { key: 'ui_rating_2', path: 'assets/ui/Rating_icon_2.png' },
        { key: 'ui_rating_3', path: 'assets/ui/Rating_icon_3.png' },
        { key: 'ui_quest_icon', path: 'assets/ui/quests_icon.png' },
        { key: 'ui_gift_raw', path: 'assets/ui/gift_green2_icon.png' },
        { key: 'ui_star_active_raw', path: 'assets/ui/star_active.png' },
        { key: 'ui_star_inactive_raw', path: 'assets/ui/star_not_active.png' },
        { key: 'ui_ok_raw', path: 'assets/ui/ok_icon.png' },
        { key: 'ui_settings_raw', path: 'assets/ui/settings_icon.png' },
        { key: 'ui_daily_raw', path: 'assets/ui/daily_icon.png' },
        { key: 'ui_nests_raw', path: 'assets/ui/incubation_icon.png' },
        { key: 'ui_nest_raw', path: 'assets/ui/nest.png' },
        { key: 'ui_lock_raw', path: 'assets/ui/lock_icon.png' },
        { key: 'ui_shock_raw', path: 'assets/ui/shock_icon.png' },
        { key: 'ui_rebirth_raw', path: 'assets/ui/rebirth.png' },
        { key: 'ui_dialog_right_raw', path: 'assets/ui/dialog_icon.png' },
        { key: 'ui_dialog_left_raw', path: 'assets/ui/dialog_icon_2.png' },
        { key: 'ui_arrow_l_raw', path: 'assets/ui/arrow_l.png' },
        { key: 'ui_arrow_r_raw', path: 'assets/ui/arrow_r.png' },
    ];

    // Phase 1 luck icons
    for (const s of PHASE1_LUCK) {
        images.push({ key: `luck_${s}`, path: `assets/ui/Luck_${s}.png` });
    }

    // Top pet sprites from collection
    const addedPets = new Set<string>();
    for (const imgKey of topPetKeys) {
        if (addedPets.has(imgKey)) continue;
        addedPets.add(imgKey);
        const filename = imgKey.replace('pet_', '');
        images.push({ key: imgKey, path: `assets/pets/${filename}.webp` });
    }

    const audio: AssetEntry[] = [
        { key: 'bgm', path: 'assets/audio/bgm.mp3' },
        { key: 'sfx_click', path: 'assets/audio/sfx_click.mp3' },
        { key: 'sfx_wobble', path: 'assets/audio/sfx_wobble.mp3' },
        { key: 'sfx_reveal', path: 'assets/audio/sfx_reveal.mp3' },
        { key: 'sfx_new_pet', path: 'assets/audio/sfx_new_pet.mp3' },
        { key: 'sfx_levelup', path: 'assets/audio/sfx_levelup.mp3' },
    ];

    return { images, audio };
}

/** Phase 2 deferred assets, grouped by priority */
export function getPhase2Assets(level: number, phase1Keys: Set<string>): {
    pets: AssetEntry[];
    gradeSfx: AssetEntry[];
    eggs: AssetEntry[];
    backgrounds: AssetEntry[];
    luckIcons: AssetEntry[];
    collectionIcons: AssetEntry[];
} {
    // Remaining pets
    const pets: AssetEntry[] = [];
    const addedPets = new Set<string>();
    for (const pet of PETS) {
        if (addedPets.has(pet.imageKey) || phase1Keys.has(pet.imageKey)) continue;
        addedPets.add(pet.imageKey);
        const filename = pet.imageKey.replace('pet_', '');
        pets.push({ key: pet.imageKey, path: `assets/pets/${filename}.webp` });
    }

    // Grade SFX
    const gradeSfx: AssetEntry[] = [];
    for (const g of GRADE_ORDER) {
        if (g === 'common') continue;
        const key = `sfx_grade_${g}`;
        if (!phase1Keys.has(key)) {
            gradeSfx.push({ key, path: `assets/audio/${key}.mp3` });
        }
    }

    // Remaining eggs
    const tier = getVisualTier(level);
    const eggs: AssetEntry[] = [];
    for (let i = 1; i <= TOTAL_EGGS; i++) {
        const key = `egg_${i}`;
        if (i === tier || i === 1) continue; // already loaded in Phase 1
        eggs.push({ key, path: `assets/eggs/egg_${i}.png` });
    }

    // Remaining backgrounds
    const pTier = Math.min(tier, TOTAL_PORTRAIT_BACKGROUNDS);
    const backgrounds: AssetEntry[] = [];
    for (let i = 1; i <= TOTAL_BACKGROUNDS; i++) {
        if (i !== tier) backgrounds.push({ key: `bg_${i}`, path: `assets/backgrounds/location_${i}.webp` });
    }
    for (let i = 1; i <= TOTAL_PORTRAIT_BACKGROUNDS; i++) {
        if (i !== pTier) backgrounds.push({ key: `bg_p_${i}`, path: `assets/backgrounds/portrait/location_${i}.webp` });
    }

    // Remaining luck icons
    const luckIcons: AssetEntry[] = [];
    for (const s of ALL_LUCK) {
        const key = `luck_${s}`;
        if (!phase1Keys.has(key)) {
            luckIcons.push({ key, path: `assets/ui/Luck_${s}.png` });
        }
    }

    // Collection icons
    const collectionIcons: AssetEntry[] = [];
    for (const name of COL_ICON_NAMES) {
        collectionIcons.push({ key: `col_${name}_raw`, path: `assets/ui/collections/${name}.png` });
    }

    return { pets, gradeSfx, eggs, backgrounds, luckIcons, collectionIcons };
}
