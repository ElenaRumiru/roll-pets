# Collections System — GDD

## Overview

Collections are fixed thematic sets of pets. Each collection has a permanent pet list that **never changes** after creation. When new pets are added to the game, they go into **new collections**, not existing ones. One pet can belong to multiple collections simultaneously.

Themed pets (Pirate Cat, Zombie Beagle, Space Mouse, etc.) are **separate full pets** in the general pool with their own `id`, `chance`, and `imageKey`. They drop from regular rolls like any other pet. No events, no special eggs, no time limits.

---

## Collection Structure

Each collection is defined as:

```typescript
interface CollectionDef {
  id: string;                        // unique key, e.g. 'forest'
  nameKey: string;                   // locale key for display name
  icon: string;                      // texture key for collection icon
  petIds: readonly string[];         // fixed list of pet ids from pets.ts — NEVER changes
  difficulty: 'easy' | 'medium' | 'hard';
  reward: CollectionReward;
}

interface CollectionReward {
  coins: number;
  buff?: { type: 'lucky' | 'super' | 'epic'; charges: number };
}
```

The `petIds` array uses the exact `id` field values from `pets.ts` (e.g. `'cat'`, `'red_panda'`, `'fennec_fox'`, `'teddy_bear'`, `'grim_reaper'`). Set once when the collection is created and never modified at runtime. This guarantees zero progress regression.

---

## Core Mechanic

Binary completion: collect **all** pets in the collection → claim the reward. No stars, no intermediate milestones, no partial rewards.

- **Not complete:** progress bar shows X/Y, reward shown greyed out with lock
- **Complete:** progress bar full (gold), CLAIM button appears
- **Claimed:** collection marked as COMPLETE with checkmark

Reward is claimed **once** per collection. After claiming, the collection stays visible with COMPLETE status.

---

## Rewards

One reward per collection, scaling by difficulty:

| Difficulty | Avg pet grade | Coin reward | Buff reward |
|------------|--------------|-------------|-------------|
| Easy | Common–Uncommon | 500–2,000 | 10–20x Lucky |
| Medium | Uncommon–Rare | 2,000–15,000 | 10–15x Super |
| Hard | Rare+ and above | 15,000–100,000 | 5–15x Epic |

Specific reward values are set manually per collection in the data file.

---

## Discovery (Visibility)

A collection **appears** in the UI when the player collects at least 1 pet from it. Until then — hidden.

- First time opening "Collections" tab with zero discovered collections → hint text: `t('col_hint_empty')`
- When a roll/purchase/hatch discovers a new collection (first pet from it) → toast: `t('col_discovered', { name })`
- When a roll/purchase/hatch completes a collection → toast: `t('col_complete', { name })`

---

## UI Integration

### CollectionScene Tabs

CollectionScene gets **two tabs** at the top (same pattern as ShopScene Pets/Eggs tabs):

```
┌──────────────────────────────────────────────┐
│  ← Back          COLLECTION        142/177   │
│                                              │
│  ┌──────────────┐  ┌─────────┐               │
│  │ Collections  │  │   All   │               │
│  └──────────────┘  └─────────┘               │
└──────────────────────────────────────────────┘
```

**Default tab: "Collections"** — opens first when entering CollectionScene.

**Tab "Collections"** — grid of collection cards.

**Tab "All"** — existing pet grid. Grade filters move from two rows of buttons into a **single dropdown** selector. This frees ~55px of vertical space for more pet rows.

### Tab "All" — Pet Grid with Dropdown

```
┌──────────────────────────────────────────────┐
│  ← Back          COLLECTION        142/177   │
│  [ Collections ]  [ All ]                    │
│                                              │
│  Grade: [ All ▾ ]                            │
│  ─────────────────────────────────────────── │
│                                              │
│  [🐱] [🐶] [🐭] [🐹] [🐰] [🐑] [🐐] [🐄] │
│  [🐷] [🐦] [🦆] [🐸] [🐝] [🐞] [🦗] [🐠] │
│  ...                                         │
└──────────────────────────────────────────────┘
```

**Dropdown component** (new `src/ui/components/Dropdown.ts`):
- Closed state: rounded rect pill showing selected value + "▾" chevron. Background `0x111122`, white outline `lineStyle(2, 0xffffff, 0.2)`.
- Open state: expands downward overlaying content (high depth). List of items, each showing grade color dot + name + count (e.g., "Common 28/28"). Tap item → select + close. Tap outside → close.
- Uses `addButtonFeedback()` for press animation.

Dropdown items: All / Common / Uncommon / Extra / Rare / Superior / Elite / Epic / Heroic / Mythic / Ancient / Legendary. Each item shows grade color dot + name + count (e.g., "Common 28/28").

### Tab "Collections" — Collection Cards Grid

```
┌──────────────────────────────────────────────┐
│  ← Back          COLLECTION        142/177   │
│  [ Collections ]  [ All ]                    │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  🌲      │ │  🌊      │ │  🐦      │     │
│  │[Forest  ]│ │[ Ocean  ]│ │[ Birds  ]│     │
│  │ ████100% │ │ ███░ 70% │ │ ██░░ 38% │     │
│  │ 11/11  ✅ │ │ 7/10     │ │ 5/13     │     │
│  └──────────┘ └──────────┘ └──────────┘     │
│  ...                                         │
└──────────────────────────────────────────────┘
```

**Collection card layout** (~160×120px, 3 per row):
- Collection icon (48×48) — top center of card
- Name banner — overlaps bottom edge of icon (like a ribbon). Styled to match the icon's gold/black ring: fill `#FEBF07` (yellow-gold), thick black outline (`strokeThickness: 3–4`), rounded rect. Width = 100% of icon width, height = 25% of icon height. Collection name text centered inside, white with black stroke, uses `fitText()` to auto-shrink if text doesn't fit.
- Mini progress bar — thin horizontal bar (filled portion colored by difficulty: green easy / blue medium / purple hard)
- Count — "7/10" text
- Complete state: gold border, checkmark badge, "COMPLETE" text
- Unclaimed reward: green pulsing "CLAIM" badge on card corner
- 0 pets collected: card slightly dimmed (alpha 0.6)

**Card background:** `0x111122` with `lineStyle(2, 0xffffff, 0.2)` — matches game-wide panel style.

**Card sorting order:**
1. Has unclaimed reward (CLAIM) — top
2. Partially collected — by completion % descending
3. Fully claimed (COMPLETE) — bottom

**Scroll:** vertical, same as current pet grid.

### Collection Detail View

Tapping a collection card replaces the cards grid with a detail view (within same scene, no new scene):

```
┌──────────────────────────────────────────────┐
│  ← Back          COLLECTION        142/177   │
│  [ Collections ]  [ All ]                    │
│                                              │
│  ◀    🌲 Forest   11/11    ▶                 │
│                                              │
│  ████████████████████████████████  COMPLETE   │
│                                              │
│  Reward: 5,000 🪙 + 10x Super       CLAIM    │
│  ─────────────────────────────────────────── │
│                                              │
│  [🐿️] [🦡] [🐾] [🦝] [🦉] [🐻]            │
│  [🐺] [🫎] [🦫] [🦔] [🐾]                  │
│                                              │
└──────────────────────────────────────────────┘
```

**Elements:**

**Navigation arrows (◀ ▶):**
- Two arrow buttons flanking the collection name. Shape: rounded chevrons `<` and `>`.
- Style: fill `#F8B901` (yellow), thick black outline (~3px), rounded corners/caps. Same visual language as icon gold ring.
- Size: ~32×32 tap target.
- Behavior: switch to previous/next collection in list (same order as grid sort). Wraps around (last → first, first → last).
- No swipe gesture — arrows only.

**Back button (← Back):** returns to MainScene (standard behavior, unchanged). Does NOT go to collections grid — consistent with all other scenes.

**Tab switching:** if player taps "All" tab while in detail view, they go to the All pet grid. Tapping "Collections" tab returns to the collections grid (not back into detail view). Detail view state is not preserved when leaving.

**Progress bar:** full-width, same ProgressBar component. Incomplete: `0x222244` bg, filled portion colored. Complete: entire bar golden `0xf5c842`.

**Reward line:** shows what the player gets. Before completion: greyed out with lock icon. After completion: full color with CLAIM button (green `0x78C828`). After claiming: "✅ Claimed" text.

**Pet grid:** only pets from this collection. Same layout/columns as "All" tab. Sorted by rarity (chance value ascending = common first, same as All tab). Uses same `PetCard` component. Collected: full color. Not collected: dark silhouette (`setTint(0x000000)`, alpha 0.3), name shows "???". Tapping a pet does nothing (no detail popup).

---

## EventBus Events

New events for collection system:

| Event | Payload | Emitted by | Listened by |
|-------|---------|-----------|-------------|
| `collection-discovered` | `{ collectionId: string, nameKey: string }` | CollectionTracker | MainScene (toast) |
| `collection-completed` | `{ collectionId: string, nameKey: string }` | CollectionTracker | MainScene (toast) |
| `collection-claimed` | `{ collectionId: string, reward: CollectionReward }` | CollectionTracker | MainScene (update coins/buffs), CollectionScene (update UI) |
| `collections-changed` | `void` | CollectionTracker | CollectionButton (badge update) |

---

## GameManager Integration

Collection progress must be checked after **every action that can add a pet to the player's collection**:

1. **After roll** — in `GameManager.roll()`, after `processRoll()` adds pet to collection
2. **After shop purchase** — in `GameManager.purchasePet()`, after pet is added
3. **After nest hatch** — in `GameManager.hatchNest()` (or equivalent), after hatched pet is added

All three call `CollectionTracker.onPetCollected(petId)` which:
- Checks all collections containing this petId
- If collection newly discovered (first pet) → emit `collection-discovered`
- If collection just completed (all pets) → emit `collection-completed`
- Always emits `collections-changed` so badges update

---

## Save Data

```typescript
// Added to SaveData interface:
collectionsClaimed: Record<string, boolean>;   // collectionId → true if reward claimed
collectionsSeenPets: Record<string, number>;   // collectionId → last seen collected count (for red badge)
```

**Save version:** bump to **v20** (current is v19).

**Migration defaults** for existing saves: `collectionsClaimed: {}`, `collectionsSeenPets: {}`. This means existing players will see red badges on all collections where they already have pets (first-time discovery burst — intentional, creates excitement).

Collection progress (how many pets collected) is **computed at runtime** from the existing `collection` array in save data. Not stored separately — no sync issues.

Red badge logic: if `computedCollectedCount > (collectionsSeenPets[id] ?? 0)` → show red badge. Opening detail view sets `collectionsSeenPets[id] = computedCollectedCount`.

---

## Notifications & Badges

Two badge types: **red** (new activity — needs viewing) and **green** (reward claimable).

### Red badge — "new pets added"

Triggers when a roll/purchase/hatch adds a new pet to any discovered collection. Means "there's something new to see".

- **CollectionButton (main screen):** red circle badge with "!" (exclamation mark, no number)
- **Collections tab label:** red "!" badge
- **Collection card (in grid):** small red "!" dot on card corner
- **Clears when:** player opens the detail view of that specific collection. Just entering the Collections tab is NOT enough — must open the actual collection to clear its red badge.
- **Save data:** `collectionsSeenPets: Record<string, number>` — stores how many pets the player has "seen" in each collection. When `collectedCount > seenCount`, red badge appears. Opening detail view sets `seenCount = collectedCount`.

### Green badge — "reward available"

Triggers when all pets in a collection are collected and reward is not yet claimed.

- **CollectionButton (main screen):** green circle badge (takes priority over red)
- **Collections tab label:** green dot
- **Collection card (in grid):** green pulsing "CLAIM" badge on card corner (takes priority over red)
- **Collection detail view:** CLAIM button on reward line
- **Clears when:** player taps CLAIM and reward is granted

### Badge priority on CollectionButton (main screen)

Green badge takes priority over red (reward is more actionable). If only red exists → show red "!". If green exists (with or without red) → show green badge.

### Toasts (MainScene)

- New collection discovered → toast (info): `t('col_discovered', { name })`
- Collection completed → toast (info): `t('col_complete', { name })`

---

## SFX

- **Claim reward:** reuse existing `sfx_click` on button press + coin add sound (if coins in reward)
- **Collection discovered/completed:** no special SFX — toast notification is sufficient
- No new audio assets needed.

---

## Locale Keys

### Collection names (en.ts) — 24 collections

```typescript
// Collection names — Easy
'col_house_pets': 'House Pets',
'col_farm': 'Farm',
'col_forest': 'Forest',
'col_birds': 'Birds',
'col_bugs': 'Bugs',
'col_scaled': 'Scaled',
'col_rodents': 'Rodents',
'col_river_pond': 'River & Pond',
'col_exotic': 'Exotic',
'col_latin_america': 'Latin America',
'col_desert': 'Desert',
// Collection names — Medium
'col_ocean': 'Ocean',
'col_savanna': 'Savanna',
'col_arctic': 'Arctic',
'col_felines': 'Felines',
'col_canine_pack': 'Canine Pack',
'col_venomous': 'Venomous',
'col_heavyweights': 'Heavyweights',
'col_asian': 'Asian',
// Collection names — Hard
'col_mythical': 'Mythical',
'col_undead': 'Undead',
'col_living_objects': 'Living Objects',
'col_dark_forces': 'Dark Forces',
'col_prehistoric': 'Prehistoric',
```

### UI strings (en.ts)

```typescript
// Collection UI
'col_tab_collections': 'Collections',
'col_tab_all': 'All',
'col_complete_label': 'COMPLETE',
'col_claim': 'CLAIM',
'col_claimed': 'Claimed',
'col_reward': 'Reward:',
'col_reward_coins': '{amount} coins',
'col_reward_buff': '{count}x {buff}',
'col_hint_empty': 'Collect pets to discover themed collections!',
'col_discovered': 'New collection: {name}!',
'col_complete': '{name} complete!',
'col_grade_filter': 'Grade',
```

---

## Data File

New file: `src/data/collections.ts`

Contains the full array of `CollectionDef` objects. Each collection's `petIds` is a frozen array using exact id values from `pets.ts`.

```typescript
export const COLLECTIONS: CollectionDef[] = [
  {
    id: 'house_pets',
    nameKey: 'col_house_pets',
    icon: 'col_home_pets',
    petIds: ['cat', 'beagle', 'mouse', 'hamster', 'hare', 'shiba', 'goldfish', 'turtle', 'ferret'],
    difficulty: 'easy',
    reward: { coins: 500, buff: { type: 'lucky', charges: 15 } },
  },
  // ... all 24 collections
];
```

---

## Adding New Content (Procedure)

### Rules

- **Never modify** `petIds` of existing collections — this prevents progress regression
- New pets go into **new** collections, not existing ones
- New collections may reference existing old pets (one pet can be in multiple collections)
- Every new pet should appear in at least one collection

---

### A. Adding a New Pet (Step-by-Step)

**1. Pet sprite**
- Place the sprite PNG in `public/assets/pets/` (e.g. `pet_0120.png`)
- Or reuse an existing `imageKey` if the sprite is shared (30 sprites are shared among 100+ pets)

**2. `src/data/pets.ts`** — add entry to the correct grade section:
```typescript
{ id: 'fox', name: 'Fox', emoji: '🦊', imageKey: 'pet_0120', chance: 250 },
```
- `id` — unique snake_case identifier, used everywhere (collections, saves, shop, etc.)
- `chance` — determines grade automatically: 2-99 Common, 100-999 Uncommon, 1K-5K Extra, 5K-50K Rare, 50K-500K Superior, 500K-5M Elite, 5M-50M Epic, 50M-250M Heroic, 250M-500M Mythic, 500M-750M Ancient, 750M-1B Legendary
- Keep the list sorted by `chance` within each grade section

**3. `src/scenes/BootScene.ts`** — if using a NEW sprite (not reusing existing `imageKey`):
- Find the pet loading loop (`for (let i = ...`) and ensure the range covers the new number
- Or add a manual load: `this.load.image('pet_0120', 'assets/pets/pet_0120.png');`

**4. Verify:** The pet will automatically appear in rolls, shop offers, and the "All" tab. No other changes needed for the pet itself.

---

### B. Adding a New Collection (Step-by-Step)

**1. Collection icon**
- Create a circular medallion icon with transparent background (match existing style: gold/black ring border)
- Place the source PNG in `public/assets/ui/collections/` (e.g. `foxes_pets.png`)

**2. `src/data/collections.ts`** — add to the appropriate difficulty array (EASY/MEDIUM/HARD):
```typescript
{
    id: 'foxes',                          // unique snake_case id
    nameKey: 'col_foxes',                 // locale key (must match en.ts/ru.ts)
    icon: 'col_foxes_pets',               // texture key = 'col_' + icon filename without .png
    petIds: ['fox', 'fennec_fox', 'kitsune', 'red_panda'],  // exact ids from pets.ts
    difficulty: 'easy',                   // easy | medium | hard
    reward: { coins: 1_000 },            // coin reward on completion
},
```

**3. `src/data/collections.ts`** — add icon name to `COL_ICON_NAMES` array:
```typescript
export const COL_ICON_NAMES = [
    // ... existing names ...
    'foxes_pets',   // ← add here (filename without .png)
] as const;
```
This array drives both BootScene loading and the `petToCollections` index.

**4. `src/scenes/BootScene.ts`** — NO changes needed! The icon loading loop iterates `COL_ICON_NAMES` automatically:
```typescript
for (const name of COL_ICON_NAMES) {
    this.load.image(`col_${name}_raw`, `assets/ui/collections/${name}.png`);
}
// ... and in create():
// Icons are copied at full resolution, GPU handles display scaling
```

**5. `src/data/locales/en.ts`** — add collection name:
```typescript
'col_foxes': 'Foxes',
```

**6. `src/data/locales/ru.ts`** — add Russian translation:
```typescript
'col_foxes': 'Лисы',
```

**7. Verify:**
- Collection auto-appears when player collects first pet from its `petIds`
- Progress bar tracks completion
- CLAIM button appears when all pets collected
- Difficulty stars show on card (1/2/3 based on difficulty)
- No save migration needed — new collections discovered at runtime

---

### C. Difficulty & Reward Guidelines

| Difficulty | Stars | Typical pets | Pet count | Coin reward range |
|------------|-------|-------------|-----------|-------------------|
| Easy | 1 | Common–Uncommon | 5–13 | 500–1,500 |
| Medium | 2 | Uncommon–Rare | 6–10 | 3,000–10,000 |
| Hard | 3 | Rare+ and above | 2–11 | 15,000–50,000 |

Difficulty is set manually based on the rarest pet in the collection, not computed.

---

### D. What NOT to Do

- **Don't change `petIds` of existing collections** — players who completed them would lose progress
- **Don't change a pet's `id`** — breaks saves, collections, shop history
- **Don't change a pet's `chance`** — shifts grade boundaries, affects all balance
- **Don't forget locale keys** — missing keys show raw key string in UI
- **Don't reuse collection `id`** — claimed state is stored by id in saves

---

## Collection List (Version 1.0)

Created with the starting 100 pets. Pet lists are fixed forever. All `petIds` use exact id values from `pets.ts`. Every pet appears in at least one collection. 24 collections total, defined by their icon assets in `collections/out/`.

### Easy (11 collections)

| # | Collection | Icon file | petIds | Count | Reward |
|---|-----------|-----------|--------|-------|--------|
| 1 | House Pets | `home_pets` | `cat, beagle, mouse, hamster, hare, shiba, goldfish, turtle, ferret` | 9 | 500 🪙 + 15x Lucky |
| 2 | Farm | `farm_pets` | `sheep, goat, cow, pig, duck, turkey, hare, beagle, ram` | 9 | 500 🪙 + 15x Lucky |
| 3 | Forest | `forest_pets` | `squirrel, badger, mole, raccoon, owl, bear, wolf, moose, beaver, porcupine, opossum, bat` | 12 | 1,000 🪙 + 20x Lucky |
| 4 | Birds | `birds_pets` | `pigeon, duck, turkey, owl, heron, kiwi, swan, pelican, toucan, falcon, raven, hummingbird, penguin` | 13 | 1,500 🪙 + 20x Lucky |
| 5 | Bugs | `bugs_pets` | `bee, ladybug, grasshopper, spider, scorpion` | 5 | 500 🪙 + 10x Lucky |
| 6 | Scaled | `squama_pets` | `turtle, snake, chameleon, crocodile, cobra, axolotl` | 6 | 1,000 🪙 + 10x Lucky |
| 7 | Rodents | `rodents_pets` | `mouse, hamster, squirrel, beaver, capybara, porcupine` | 6 | 500 🪙 + 10x Lucky |
| 8 | River & Pond | `lake_river_pets` | `frog, beaver, otter, axolotl, duck, hippo, crocodile, swan` | 8 | 1,000 🪙 + 15x Lucky |
| 9 | Exotic | `exotic_pets` | `axolotl, chameleon, capybara, red_panda, pallas_cat, fennec_fox, koala, kangaroo` | 8 | 1,000 🪙 + 15x Lucky |
| 10 | Latin America | `latin_pets` | `llama, toucan, capybara, jaguar, axolotl, anteater` | 6 | 1,000 🪙 + 10x Lucky |
| 11 | Desert | `desert_pets` | `camel, fennec_fox, scorpion, cobra, meerkat` | 5 | 1,000 🪙 + 10x Lucky |

### Medium (8 collections)

| # | Collection | Icon file | petIds | Count | Reward |
|---|-----------|-----------|--------|-------|--------|
| 12 | Ocean | `sea_pets` | `seahorse, dolphin, octopus, pufferfish, shark, whale, jellyfish, squid, anglerfish, seal` | 10 | 5,000 🪙 + 10x Super |
| 13 | Savanna | `savanne_pets` | `giraffe, zebra, lion, cheetah, hyena, hippo, rhino, gorilla, meerkat` | 9 | 5,000 🪙 + 10x Super |
| 14 | Arctic | `arctik_pets` | `penguin, seal, walrus, snowman, yeti, mammoth` | 6 | 5,000 🪙 + 10x Super |
| 15 | Felines | `cats_pets_feline` | `cat, pallas_cat, cheetah, jaguar, lion, cheshire_cat, sabertooth` | 7 | 8,000 🪙 + 12x Super |
| 16 | Canine Pack | `dogs_pets_canids` | `beagle, shiba, wolf, hyena, fennec_fox, cerberus` | 6 | 8,000 🪙 + 12x Super |
| 17 | Venomous | `acid_pets` | `snake, cobra, scorpion, spider, pufferfish, jellyfish` | 6 | 3,000 🪙 + 10x Super |
| 18 | Heavyweights | `big_pets` | `hippo, rhino, gorilla, bear, whale, mammoth, golem, walrus` | 8 | 8,000 🪙 + 12x Super |
| 19 | Asian | `asia_pets` | `panda, red_panda, kitsune, shiba, chinese_dragon, pallas_cat` | 6 | 10,000 🪙 + 15x Super |

### Hard (5 collections)

| # | Collection | Icon file | petIds | Count | Reward |
|---|-----------|-----------|--------|-------|--------|
| 20 | Mythical | `myph_pets` | `griffin, dragon, pegasus, phoenix, chinese_dragon, cerberus, minotaur, sphinx, djinn, kitsune, alien` | 11 | 50,000 🪙 + 10x Epic |
| 21 | Undead | `undead_pets` | `ghost, skeleton, zombie, vampire, grim_reaper` | 5 | 30,000 🪙 + 8x Epic |
| 22 | Living Objects | `items_pets` | `slime, robot, snowman, teddy_bear, gingerbread_man, mimic, astronaut` | 7 | 25,000 🪙 + 8x Epic |
| 23 | Dark Forces | `dark_pets` | `cerberus, nightmare, beholder, grim_reaper, ifrit` | 5 | 50,000 🪙 + 10x Epic |
| 24 | Prehistoric | `ancient_pets` | `mammoth, sabertooth` | 2 | 15,000 🪙 + 5x Epic |

### Orphan pet reassignments (v1.0)

Pets that were in removed collections (Fluffy, Tiny, Australia, Mountain, Nocturnal, Predators) or had no collection at all were reassigned:

| Pet | New collection | Reason |
|-----|---------------|--------|
| koala | Exotic | Unusual real animal |
| kangaroo | Exotic | Unusual real animal |
| ram | Farm | Livestock |
| anteater | Latin America | South American native |
| bat | Forest | Natural forest dweller |
| alien | Mythical | Fantastical creature |
| astronaut | Living Objects | Character/construct (like robot, snowman) |

Kitsune was removed from Canine Pack (it's a mythical fox spirit, not a canid). It remains in Mythical and Asian.

### Future (added with new pet batches)

Pirates (14), Zombies (13), Space (14), Dog Breeds (10), Fire (3+), Guardians (5), etc.

---

## BootScene — Icon Loading

Collection icons are loaded in BootScene alongside other UI assets:

```typescript
// In BootScene.preload():
// Load all 24 collection icons
const COL_ICONS = [
  'home_pets', 'farm_pets', 'forest_pets', 'birds_pets', 'bugs_pets',
  'squama_pets', 'rodents_pets', 'lake_river_pets', 'exotic_pets',
  'latin_pets', 'desert_pets',
  'sea_pets', 'savanne_pets', 'arctik_pets', 'cats_pets_feline',
  'dogs_pets_canids', 'acid_pets', 'big_pets', 'asia_pets',
  'myph_pets', 'undead_pets', 'items_pets', 'dark_pets', 'ancient_pets',
];
for (const name of COL_ICONS) {
  this.load.image(`col_${name}_raw`, `assets/ui/collections/${name}.png`);
}
```

In `BootScene.create()`, downscale via existing `trimToWidth` pipeline:
```typescript
for (const name of COL_ICONS) {
  trimToWidth(`col_${name}_raw`, `col_${name}`, 96); // 96px display width for cards
}
```

Icon files are copied from `collections/out/*.png` to `public/assets/ui/collections/` before build.

---

## Implementation Checklist

1. Copy icons from `collections/out/*.png` to `public/assets/ui/collections/`
2. Create `src/data/collections.ts` — all 24 CollectionDef objects with exact petIds
3. Create `src/systems/CollectionTracker.ts` — pure TS system: progress calc, claim logic, discovery detection, `onPetCollected(petId)` method
4. Update `types/index.ts` — add `CollectionDef`, `CollectionReward`, add `collectionsClaimed` and `collectionsSeenPets` to SaveData
5. Update `SaveSystem.ts` — bump to **v20**, migrate with defaults `collectionsClaimed: {}`, `collectionsSeenPets: {}`
6. Update `GameManager.ts` — create CollectionTracker, call `onPetCollected()` after roll, shop purchase, and nest hatch
7. Update `CollectionScene.ts` — add two tabs (Collections default / All), dropdown grade filter, collection cards grid, detail view with navigation arrows
8. Create `src/ui/CollectionCard.ts` — card component for collection grid (icon + name banner + progress bar + count + badges)
9. Create `src/ui/components/Dropdown.ts` — reusable dropdown selector for grade filter
10. Update `CollectionButton.ts` — add red "!" / green badge based on CollectionTracker state
11. Update `BootScene.ts` — load and downscale collection icon textures
12. Add all locale keys to `en.ts` and `ru.ts` (collection names + UI strings)

---

## Icon Assets

Ready-made collection icons with transparent backgrounds are located in `collections/out/*.png`. Source files (with white background) are in `collections/*.webp`.

Background removal script: `scripts/remove-bg-collections.mjs` (flood-fill + 2px hard erode). Re-run with `node scripts/remove-bg-collections.mjs` if new icons are added.

Icons are circular medallions with gold/black ring border. When displayed in-game, they will be downscaled via BootScene's `trimToWidth` pipeline to 96px display width for collection cards.
