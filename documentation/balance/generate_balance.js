/**
 * PETS GO Lite — Full Balance Calculator
 * Run: node documentation/balance/generate_balance.js
 * Outputs CSV files into documentation/balance/
 *
 * IMPORTANT: All values mirrored from src/ — keep in sync!
 * Coins per roll = pet.chance (always, regardless of new/dup)
 * XP per roll = flat 5 (XP_PER_ROLL, regardless of new/dup/grade)
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// DATA (mirrored from src/)
// ═══════════════════════════════════════════════════════════════

const PETS = [
  { id:'cat',chance:2 },{ id:'beagle',chance:3 },{ id:'mouse',chance:4 },
  { id:'hamster',chance:5 },{ id:'hare',chance:6 },{ id:'sheep',chance:7 },
  { id:'goat',chance:8 },{ id:'cow',chance:10 },{ id:'pig',chance:12 },
  { id:'pigeon',chance:14 },{ id:'duck',chance:16 },{ id:'frog',chance:18 },
  { id:'bee',chance:20 },{ id:'ladybug',chance:24 },{ id:'grasshopper',chance:28 },
  { id:'goldfish',chance:32 },{ id:'turkey',chance:36 },{ id:'squirrel',chance:40 },
  { id:'mole',chance:44 },{ id:'opossum',chance:48 },{ id:'porcupine',chance:52 },
  { id:'ferret',chance:57 },{ id:'badger',chance:62 },{ id:'beaver',chance:67 },
  { id:'raccoon',chance:72 },{ id:'shiba',chance:78 },{ id:'turtle',chance:85 },
  { id:'snake',chance:93 },
  { id:'penguin',chance:100 },{ id:'panda',chance:120 },{ id:'koala',chance:140 },
  { id:'owl',chance:160 },{ id:'capybara',chance:180 },{ id:'red_panda',chance:200 },
  { id:'otter',chance:230 },{ id:'meerkat',chance:260 },{ id:'llama',chance:290 },
  { id:'camel',chance:320 },{ id:'ram',chance:360 },{ id:'moose',chance:400 },
  { id:'anteater',chance:440 },{ id:'seal',chance:480 },{ id:'heron',chance:530 },
  { id:'kiwi',chance:580 },{ id:'swan',chance:630 },{ id:'pelican',chance:680 },
  { id:'toucan',chance:730 },{ id:'bat',chance:780 },{ id:'spider',chance:830 },
  { id:'giraffe',chance:870 },{ id:'zebra',chance:910 },{ id:'hyena',chance:950 },
  { id:'seahorse',chance:980 },
  { id:'dolphin',chance:1000 },{ id:'chameleon',chance:1200 },{ id:'octopus',chance:1400 },
  { id:'axolotl',chance:1700 },{ id:'crocodile',chance:2000 },{ id:'cobra',chance:2300 },
  { id:'kangaroo',chance:2500 },{ id:'falcon',chance:2800 },{ id:'raven',chance:3000 },
  { id:'hummingbird',chance:3200 },{ id:'scorpion',chance:3500 },{ id:'pufferfish',chance:3700 },
  { id:'fennec_fox',chance:4000 },{ id:'pallas_cat',chance:4200 },{ id:'gorilla',chance:4500 },
  { id:'rhino',chance:4800 },
  { id:'lion',chance:5000 },{ id:'cheetah',chance:7000 },{ id:'jaguar',chance:9000 },
  { id:'shark',chance:11000 },{ id:'bear',chance:14000 },{ id:'wolf',chance:17000 },
  { id:'whale',chance:20000 },{ id:'walrus',chance:24000 },{ id:'hippo',chance:28000 },
  { id:'jellyfish',chance:32000 },{ id:'squid',chance:36000 },{ id:'anglerfish',chance:40000 },
  { id:'mammoth',chance:44000 },{ id:'sabertooth',chance:48000 },
  { id:'slime',chance:50000 },{ id:'ghost',chance:75000 },{ id:'skeleton',chance:100000 },
  { id:'zombie',chance:140000 },{ id:'robot',chance:180000 },{ id:'snowman',chance:220000 },
  { id:'teddy_bear',chance:270000 },{ id:'gingerbread_man',chance:320000 },
  { id:'yeti',chance:400000 },{ id:'mimic',chance:480000 },
  { id:'griffin',chance:500000 },{ id:'kitsune',chance:800000 },{ id:'golem',chance:1200000 },
  { id:'vampire',chance:1800000 },{ id:'cerberus',chance:2500000 },{ id:'minotaur',chance:3500000 },
  { id:'nightmare',chance:4500000 },
  { id:'dragon',chance:5000000 },{ id:'pegasus',chance:8000000 },{ id:'alien',chance:15000000 },
  { id:'astronaut',chance:22000000 },{ id:'sphinx',chance:35000000 },{ id:'ifrit',chance:45000000 },
  { id:'phoenix',chance:50000000 },{ id:'djinn',chance:120000000 },{ id:'cheshire_cat',chance:200000000 },
  { id:'chinese_dragon',chance:350000000 },
  { id:'beholder',chance:600000000 },
  { id:'grim_reaper',chance:800000000 },
];

const GRADES = [
  { name:'Common',    min:2,         max:100 },
  { name:'Uncommon',  min:100,       max:1000 },
  { name:'Extra',     min:1000,      max:5000 },
  { name:'Rare',      min:5000,      max:50000 },
  { name:'Superior',  min:50000,     max:500000 },
  { name:'Elite',     min:500000,    max:5000000 },
  { name:'Epic',      min:5000000,   max:50000000 },
  { name:'Heroic',    min:50000000,  max:250000000 },
  { name:'Mythic',    min:250000000, max:500000000 },
  { name:'Ancient',   min:500000000, max:750000000 },
  { name:'Legendary', min:750000000, max:1000000000 },
];

const EGG_TIERS = [
  { tier:1,  price:10,  buffMult:50,        incMs:3600000 },
  { tier:2,  price:20,  buffMult:100,       incMs:5400000 },
  { tier:3,  price:35,  buffMult:200,       incMs:7200000 },
  { tier:4,  price:55,  buffMult:500,       incMs:9000000 },
  { tier:5,  price:80,  buffMult:1000,      incMs:12600000 },
  { tier:6,  price:110, buffMult:2500,      incMs:14400000 },
  { tier:7,  price:150, buffMult:5000,      incMs:18000000 },
  { tier:8,  price:200, buffMult:10000,     incMs:21600000 },
  { tier:9,  price:270, buffMult:25000,     incMs:28800000 },
  { tier:10, price:350, buffMult:50000,     incMs:36000000 },
  { tier:11, price:450, buffMult:150000,    incMs:43200000 },
  { tier:12, price:560, buffMult:500000,    incMs:57600000 },
  { tier:13, price:680, buffMult:2500000,   incMs:72000000 },
  { tier:14, price:800, buffMult:10000000,  incMs:86400000 },
  { tier:15, price:880, buffMult:50000000,  incMs:86400000 },
  { tier:16, price:940, buffMult:150000000, incMs:86400000 },
  { tier:17, price:1000,buffMult:500000000, incMs:86400000 },
];

const LEAGUES = [
  { tier:'Bronze',  min:2,         max:5000 },
  { tier:'Silver',  min:5000,      max:50000 },
  { tier:'Gold',    min:50000,     max:5000000 },
  { tier:'Diamond', min:5000000,   max:250000000 },
  { tier:'Master',  min:250000000, max:1000000000 },
];
const LEAGUE_REWARDS = { Silver:500, Gold:5000, Diamond:50000, Master:500000 };

// Collections (mirrored from COLLECTIONS_GDD.md)
const COLLECTIONS = [
  { id:'house_pets',     name:'House Pets',     petIds:['cat','beagle','mouse','hamster','hare','shiba','goldfish','turtle','ferret'] },
  { id:'farm',           name:'Farm',           petIds:['sheep','goat','cow','pig','duck','turkey','hare','beagle','ram'] },
  { id:'forest',         name:'Forest',         petIds:['squirrel','badger','mole','raccoon','owl','bear','wolf','moose','beaver','porcupine','opossum','bat'] },
  { id:'birds',          name:'Birds',          petIds:['pigeon','duck','turkey','owl','heron','kiwi','swan','pelican','toucan','falcon','raven','hummingbird','penguin'] },
  { id:'bugs',           name:'Bugs',           petIds:['bee','ladybug','grasshopper','spider','scorpion'] },
  { id:'scaled',         name:'Scaled',         petIds:['turtle','snake','chameleon','crocodile','cobra','axolotl'] },
  { id:'rodents',        name:'Rodents',        petIds:['mouse','hamster','squirrel','beaver','capybara','porcupine'] },
  { id:'river_pond',     name:'River & Pond',   petIds:['frog','beaver','otter','axolotl','duck','hippo','crocodile','swan'] },
  { id:'exotic',         name:'Exotic',         petIds:['axolotl','chameleon','capybara','red_panda','pallas_cat','fennec_fox','koala','kangaroo'] },
  { id:'latin_america',  name:'Latin America',  petIds:['llama','toucan','capybara','jaguar','axolotl','anteater'] },
  { id:'desert',         name:'Desert',         petIds:['camel','fennec_fox','scorpion','cobra','meerkat'] },
  { id:'ocean',          name:'Ocean',          petIds:['seahorse','dolphin','octopus','pufferfish','shark','whale','jellyfish','squid','anglerfish','seal'] },
  { id:'savanna',        name:'Savanna',        petIds:['giraffe','zebra','lion','cheetah','hyena','hippo','rhino','gorilla','meerkat'] },
  { id:'arctic',         name:'Arctic',         petIds:['penguin','seal','walrus','snowman','yeti','mammoth'] },
  { id:'felines',        name:'Felines',        petIds:['cat','pallas_cat','cheetah','jaguar','lion','cheshire_cat','sabertooth'] },
  { id:'canine_pack',    name:'Canine Pack',    petIds:['beagle','shiba','wolf','hyena','fennec_fox','cerberus'] },
  { id:'venomous',       name:'Venomous',       petIds:['snake','cobra','scorpion','spider','pufferfish','jellyfish'] },
  { id:'heavyweights',   name:'Heavyweights',   petIds:['hippo','rhino','gorilla','bear','whale','mammoth','golem','walrus'] },
  { id:'asian',          name:'Asian',          petIds:['panda','red_panda','kitsune','shiba','chinese_dragon','pallas_cat'] },
  { id:'mythical',       name:'Mythical',       petIds:['griffin','dragon','pegasus','phoenix','chinese_dragon','cerberus','minotaur','sphinx','djinn','kitsune','alien'] },
  { id:'undead',         name:'Undead',         petIds:['ghost','skeleton','zombie','vampire','grim_reaper'] },
  { id:'living_objects',  name:'Living Objects', petIds:['slime','robot','snowman','teddy_bear','gingerbread_man','mimic','astronaut'] },
  { id:'dark_forces',    name:'Dark Forces',    petIds:['cerberus','nightmare','beholder','grim_reaper','ifrit'] },
  { id:'prehistoric',    name:'Prehistoric',    petIds:['mammoth','sabertooth'] },
];

const PET_COLLECTIONS = {};
for (const col of COLLECTIONS) {
  for (const pid of col.petIds) {
    if (!PET_COLLECTIONS[pid]) PET_COLLECTIONS[pid] = [];
    PET_COLLECTIONS[pid].push(col.name);
  }
}

const VISUAL_TIERS = [1,15,35,60,90,125,170,225,290,365,450,545,640,735,830,910,975];
const AUTOROLL_MS = 500;
const XP_PER_ROLL = 5;
const BUFF = { lucky:2, super:3, epic:5 };

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getGrade(chance) {
  for (let i = GRADES.length - 1; i >= 0; i--) {
    if (chance >= GRADES[i].min) return GRADES[i];
  }
  return GRADES[0];
}

const XP_FLOOR = 20, XP_SCALE = 1030, XP_KNEE = 20;
function xpForLevel(lv) {
  const l2 = lv * lv;
  return Math.floor(XP_FLOOR + XP_SCALE * l2 / (l2 + XP_KNEE * XP_KNEE));
}

function coinRewardForLevel(lv) {
  const l2 = lv * lv;
  return Math.round((5 + 495 * l2 / (l2 + 10000)) / 5) * 5;
}

function getVisualTier(lv) {
  for (let i = VISUAL_TIERS.length - 1; i >= 0; i--) {
    if (lv >= VISUAL_TIERS[i]) return i + 1;
  }
  return 1;
}

function getEligiblePets(level) {
  const tier = getVisualTier(level);
  const removals = tier - 1;
  if (removals <= 0) return [...PETS];
  const sorted = [...PETS].sort((a, b) => a.chance - b.chance);
  const idx = Math.min(removals - 1, sorted.length - 2);
  const filterChance = sorted[idx].chance;
  return PETS.filter(p => p.chance > filterChance);
}

function oddsStr(chance) {
  if (chance >= 1e9) return `1/${(chance/1e9).toFixed(1)}B`;
  if (chance >= 1e6) return `1/${(chance/1e6).toFixed(1)}M`;
  if (chance >= 1e3) return `1/${(chance/1e3).toFixed(1)}K`;
  return `1/${chance}`;
}

function fmtNum(n) {
  if (Math.abs(n) >= 1e9) return (n/1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n/1e3).toFixed(2) + 'K';
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(6);
}

function fmtTime(sec) {
  if (sec >= 86400) return (sec / 86400).toFixed(1) + 'd';
  if (sec >= 3600) return (sec / 3600).toFixed(1) + 'h';
  if (sec >= 60) return (sec / 60).toFixed(1) + 'min';
  return sec.toFixed(0) + 's';
}

function fmtMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ═══════════════════════════════════════════════════════════════
// CORE: Roll Probability Engine
// ═══════════════════════════════════════════════════════════════

function computeProbabilities(pool, mult) {
  const sorted = [...pool].sort((a, b) => b.chance - a.chance);
  const probs = new Map();
  let passThrough = 1.0;
  for (const pet of sorted) {
    const check = Math.min(1.0, mult / pet.chance);
    probs.set(pet.id, passThrough * check);
    passThrough *= (1 - check);
  }
  const fallbackId = sorted[sorted.length - 1].id;
  probs.set(fallbackId, probs.get(fallbackId) + passThrough);
  return probs;
}

function gradeProbabilities(pool, mult) {
  const petProbs = computeProbabilities(pool, mult);
  const gradeProbs = {};
  for (const g of GRADES) gradeProbs[g.name] = 0;
  for (const pet of pool) {
    const g = getGrade(pet.chance);
    gradeProbs[g.name] += petProbs.get(pet.id) || 0;
  }
  return gradeProbs;
}

/** Expected coins per roll = sum(P(pet) * pet.chance) */
function expectedCoinsPerRoll(pool, mult) {
  const probs = computeProbabilities(pool, mult);
  let ev = 0;
  for (const pet of pool) {
    ev += (probs.get(pet.id) || 0) * pet.chance;
  }
  return ev;
}

// ═══════════════════════════════════════════════════════════════
// CSV WRITERS
// ═══════════════════════════════════════════════════════════════

const OUT = path.join(__dirname);

function writeCSV(filename, header, rows) {
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(row.map(v => {
      const s = String(v);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(','));
  }
  fs.writeFileSync(path.join(OUT, filename), '\ufeff' + lines.join('\n'), 'utf8');
  console.log(`  -> ${filename} (${rows.length} rows)`);
}

// ═══════════════════════════════════════════════════════════════
// 1. ALL PETS TABLE
// ═══════════════════════════════════════════════════════════════

function gen01_pets() {
  const header = ['#','ID','Grade','Chance','Odds','Coins/Roll','XP/Roll','ShopPrice','League','Collections'];
  const rows = [];
  const sorted = [...PETS].sort((a, b) => a.chance - b.chance);
  sorted.forEach((p, i) => {
    const g = getGrade(p.chance);
    const league = LEAGUES.find(l => p.chance >= l.min && p.chance < l.max) || LEAGUES[LEAGUES.length - 1];
    const cols = (PET_COLLECTIONS[p.id] || []).join(' | ');
    rows.push([
      i + 1, p.id, g.name, p.chance, oddsStr(p.chance),
      p.chance, XP_PER_ROLL, p.chance * 2, league.tier, cols,
    ]);
  });
  writeCSV('01_pets.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 2. GRADE SUMMARY
// ═══════════════════════════════════════════════════════════════

function gen02_grades() {
  const header = [
    'Grade','PetCount','ChanceRange','Odds Range',
    'Coins/Roll Range','ShopPrice Range','Total ShopPrice (all pets)',
  ];
  const rows = [];
  for (const g of GRADES) {
    const pets = PETS.filter(p => p.chance >= g.min && p.chance < g.max);
    const minC = pets.length ? Math.min(...pets.map(p => p.chance)) : 0;
    const maxC = pets.length ? Math.max(...pets.map(p => p.chance)) : 0;
    rows.push([
      g.name, pets.length,
      `${fmtNum(g.min)} - ${fmtNum(g.max)}`,
      `${oddsStr(minC)} - ${oddsStr(maxC)}`,
      `${fmtNum(minC)} - ${fmtNum(maxC)}`,
      `${fmtNum(minC * 2)} - ${fmtNum(maxC * 2)}`,
      fmtNum(pets.reduce((s, p) => s + p.chance * 2, 0)),
    ]);
  }
  writeCSV('02_grades_summary.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 3. XP PROGRESSION CURVE (levels 1-1000)
// ═══════════════════════════════════════════════════════════════

function gen03_xp() {
  const EGG_NAMES = [
    'White Egg','Green Egg','Blue Egg','Red Egg','Purple Egg','Frosty Egg',
    'Forest Egg','Dragon Egg','Sandy Egg','Pharaoh Egg','Sheriff Egg',
    'Pirate Egg','Ice Egg','Fire Egg','Space Egg','Lunar Egg','Toxic Egg',
  ];
  const header = [
    'Level','XP Needed','Rolls to Level Up','Time per Level (min)',
    'Cumulative Time (min)','Cumulative Time (hours)','Cumulative Time (days)',
    'Reward Type','Reward Detail','Coins (free)','Coins (ad x3)',
    'Pool Size','Removed Pets',
  ];
  const rows = [];
  let cumTimeMin = 0, prevTier = 0;

  for (let lv = 1; lv <= 1000; lv++) {
    const xp = xpForLevel(lv);
    const rollsNeeded = Math.ceil(xp / XP_PER_ROLL);
    const timeMin = rollsNeeded * AUTOROLL_MS / 1000 / 60;
    cumTimeMin += timeMin;

    const tier = getVisualTier(lv);
    const tierChanged = tier !== prevTier;
    const pool = getEligiblePets(lv);
    const coinsFree = coinRewardForLevel(lv);

    let rewardType = '', rewardDetail = '', coinsF = coinsFree, coinsA = coinsFree * 3;

    if (lv === 3) {
      rewardType = 'Feature'; rewardDetail = 'Auto Roll'; coinsF = 0; coinsA = 0;
    } else if (lv === 5) {
      rewardType = 'Feature'; rewardDetail = 'Incubation'; coinsF = 0; coinsA = 0;
    } else if (lv === 1000) {
      rewardType = 'Feature'; rewardDetail = 'Rebirth / Samsara'; coinsF = 0; coinsA = 0;
    } else if (tierChanged) {
      rewardType = 'Egg'; rewardDetail = EGG_NAMES[tier - 1] || ('Tier ' + tier);
      coinsF = 0; coinsA = 0;
    } else {
      rewardType = 'Coins'; rewardDetail = '+' + coinsFree;
    }

    rows.push([
      lv, xp, rollsNeeded, timeMin.toFixed(2),
      cumTimeMin.toFixed(1), (cumTimeMin / 60).toFixed(2), (cumTimeMin / 60 / 24).toFixed(3),
      rewardType, rewardDetail, coinsF, coinsA,
      pool.length, PETS.length - pool.length,
    ]);
    prevTier = tier;
  }

  writeCSV('03_xp_progression.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 4. EGG TIERS DETAIL (incl. shop prices + incubation)
// ═══════════════════════════════════════════════════════════════

function gen04_eggs() {
  const header = [
    'Tier','Unlock Level','Price','Buff Multiplier','Incubation',
    'Pets Removed','Pool Size',
    'Cheapest Pet','Min Chance','Min Odds',
    'Rarest Pet','Max Chance','Max Odds',
  ];
  const rows = [];
  for (let t = 1; t <= 17; t++) {
    const lv = VISUAL_TIERS[t - 1];
    const egg = EGG_TIERS[t - 1];
    const pool = getEligiblePets(lv);
    const poolSorted = [...pool].sort((a, b) => a.chance - b.chance);
    const cheapest = poolSorted[0];
    const rarest = poolSorted[poolSorted.length - 1];
    rows.push([
      t, lv, egg.price, 'x' + fmtNum(egg.buffMult), fmtMs(egg.incMs),
      t - 1, pool.length,
      cheapest.id, cheapest.chance, oddsStr(cheapest.chance),
      rarest.id, rarest.chance, oddsStr(rarest.chance),
    ]);
  }
  writeCSV('04_egg_tiers.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 5. ROLL PROBABILITIES BY GRADE (at different multipliers)
// ═══════════════════════════════════════════════════════════════

function gen05_probabilities() {
  const mults = [1, 2, 3, 5, 6, 10, 15, 30];
  const header = ['Grade', 'Pets', ...mults.map(m => `P(grade) x${m}`), ...mults.map(m => `Avg rolls x${m}`)];
  const rows = [];
  const pool = getEligiblePets(1);

  for (const g of GRADES) {
    const pets = pool.filter(p => p.chance >= g.min && p.chance < g.max);
    if (pets.length === 0) continue;
    const row = [g.name, pets.length];
    for (const m of mults) {
      const gp = gradeProbabilities(pool, m);
      const p = gp[g.name] || 0;
      row.push(p > 0.001 ? (p * 100).toFixed(4) + '%' : p.toExponential(4));
    }
    for (const m of mults) {
      const gp = gradeProbabilities(pool, m);
      const p = gp[g.name] || 0;
      row.push(p > 0 ? fmtNum(Math.round(1 / p)) : 'inf');
    }
    rows.push(row);
  }
  writeCSV('05_roll_probabilities.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 6. ECONOMY: Expected Coins Per Roll
// ═══════════════════════════════════════════════════════════════

function gen06_economy() {
  const mults = [1, 2, 3, 5, 6, 10, 15, 30];
  const header = ['Pool (level)', ...mults.map(m => `E[coins/roll] x${m}`)];
  const rows = [];

  const levels = [1, 15, 60, 125, 290, 545, 975];
  for (const lv of levels) {
    const pool = getEligiblePets(lv);
    const tier = getVisualTier(lv);
    const row = [`Tier ${tier} (lv${lv}, ${pool.length} pets)`];
    for (const m of mults) {
      row.push(expectedCoinsPerRoll(pool, m).toFixed(2));
    }
    rows.push(row);
  }
  writeCSV('06_economy_ev_per_roll.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 7. BUFF VALUE ANALYSIS
// ═══════════════════════════════════════════════════════════════

function gen07_buffs() {
  const pool = getEligiblePets(1);
  const combos = [
    { name: 'No buff',                mult: 1  },
    { name: 'Lucky (x2)',             mult: 2  },
    { name: 'Super (x3)',             mult: 3  },
    { name: 'Epic (x5)',              mult: 5  },
    { name: 'Lucky+Super (x6)',       mult: 6  },
    { name: 'Lucky+Epic (x10)',       mult: 10 },
    { name: 'Super+Epic (x15)',       mult: 15 },
    { name: 'Lucky+Super+Epic (x30)', mult: 30 },
  ];

  const header = [
    'Buff Combo', 'Multiplier',
    'E[coins/roll]', 'Coin uplift vs base',
    'P(Rare+)', 'P(Epic+)', 'P(Legendary)',
  ];
  const rows = [];
  const baseCoins = expectedCoinsPerRoll(pool, 1);

  for (const c of combos) {
    const coins = expectedCoinsPerRoll(pool, c.mult);
    const gp = gradeProbabilities(pool, c.mult);
    const pRare = ['Rare','Superior','Elite','Epic','Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
    const pEpic = ['Epic','Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
    const pLeg = gp['Legendary'] || 0;
    const uplift = ((coins / baseCoins - 1) * 100);

    rows.push([
      c.name, 'x' + c.mult,
      coins.toFixed(2), '+' + uplift.toFixed(1) + '%',
      (pRare*100).toFixed(4) + '%',
      pEpic > 1e-6 ? pEpic.toExponential(4) : pEpic.toExponential(3),
      pLeg.toExponential(4),
    ]);
  }
  writeCSV('07_buff_analysis.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 8. AUTOROLL vs BUFF HUNTING STRATEGIES
// ═══════════════════════════════════════════════════════════════

function gen08_strategies() {
  const pool = getEligiblePets(1);
  const rollsPerHourAutoroll = 3600000 / AUTOROLL_MS;
  const adWatchSec = 30;
  const offerCycleSec = 15 + 10; // visible + cooldown

  const coinsBase = expectedCoinsPerRoll(pool, 1);
  const coinsX2 = expectedCoinsPerRoll(pool, 2);
  const coinsX30 = expectedCoinsPerRoll(pool, 30);

  const fullBuffCycleSec = 3 * (15 + adWatchSec + 10) - 10;

  const hours = [1, 4, 8, 12, 24];
  const header = [
    'Strategy', 'Mult', 'Rolls/hour', 'Coins/hour',
    ...hours.map(h => `Coins in ${h}h`),
    'P(Rare+)/roll',
  ];

  const gp1 = gradeProbabilities(pool, 1);
  const gp30 = gradeProbabilities(pool, 30);
  function pRarePlus(gp) {
    return ['Rare','Superior','Elite','Epic','Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
  }

  const strategies = [
    { name:'Autoroll (AFK)',        mult:1,  rph:rollsPerHourAutoroll, cpr:coinsBase, gp:gp1 },
    { name:'Manual (1/sec)',        mult:1,  rph:3600,                 cpr:coinsBase, gp:gp1 },
    { name:'Full buff stack (x30)', mult:30, rph:3600/fullBuffCycleSec,cpr:coinsX30,  gp:gp30 },
  ];

  const rows = [];
  for (const s of strategies) {
    const row = [s.name, 'x'+s.mult, s.rph.toFixed(1), fmtNum(Math.round(s.rph * s.cpr))];
    for (const h of hours) row.push(fmtNum(Math.round(h * s.rph * s.cpr)));
    row.push((pRarePlus(s.gp)*100).toFixed(4) + '%');
    rows.push(row);
  }
  writeCSV('08_strategies_comparison.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 9. GOLDEN PATH — Player Journey Simulation
// ═══════════════════════════════════════════════════════════════

function gen09_goldenPath() {
  const header = [
    'Level','XP Needed','Egg Tier','Pool Size',
    'Rolls to level up','Cumulative Rolls',
    'Time (autoroll)','Time (manual 1/s)',
    'E[coins/roll]','Coins this level','Cumulative Coins',
    'Level-up Reward (coins)','Milestone',
  ];
  const rows = [];
  let cumRolls = 0, cumCoins = 0;

  for (let lv = 1; lv <= 150; lv++) {
    const xpNeeded = xpForLevel(lv);
    const rollsToLevel = Math.ceil(xpNeeded / XP_PER_ROLL);
    const pool = getEligiblePets(lv);
    const tier = getVisualTier(lv);
    const tierChanged = lv > 1 && getVisualTier(lv) !== getVisualTier(lv - 1);

    const coinsPerRoll = expectedCoinsPerRoll(pool, 1);
    cumRolls += rollsToLevel;
    const coinsThisLevel = Math.round(rollsToLevel * coinsPerRoll);
    cumCoins += coinsThisLevel;

    const coinReward = tierChanged || lv === 3 || lv === 5 || lv === 1000 ? 0 : coinRewardForLevel(lv);
    cumCoins += coinReward;

    let milestone = '';
    if (lv === 1) milestone = 'Game start';
    if (lv === 3) milestone = 'Auto Roll unlock';
    if (lv === 5) milestone = 'Incubation unlock';
    if (tierChanged) milestone = `New egg (tier ${tier})`;

    rows.push([
      lv, xpNeeded, tier, pool.length,
      rollsToLevel, cumRolls,
      fmtTime(cumRolls * AUTOROLL_MS / 1000), fmtTime(cumRolls),
      coinsPerRoll.toFixed(2), coinsThisLevel, fmtNum(cumCoins),
      coinReward, milestone,
    ]);
  }
  writeCSV('09_golden_path.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 10. PER-PET PROBABILITY TABLE
// ═══════════════════════════════════════════════════════════════

function gen10_petProbabilities() {
  const mults = [1, 2, 6, 30];
  const pool = getEligiblePets(1);
  const header = ['#', 'Pet', 'Grade', 'Chance',
    ...mults.map(m => `P(pet) x${m}`),
    ...mults.map(m => `Avg rolls x${m}`),
  ];
  const rows = [];
  const sorted = [...pool].sort((a, b) => a.chance - b.chance);
  const probMaps = mults.map(m => computeProbabilities(pool, m));

  sorted.forEach((pet, i) => {
    const g = getGrade(pet.chance);
    const row = [i + 1, pet.id, g.name, oddsStr(pet.chance)];
    for (const pm of probMaps) {
      const p = pm.get(pet.id) || 0;
      row.push(p > 0.001 ? (p * 100).toFixed(4) + '%' : p.toExponential(4));
    }
    for (const pm of probMaps) {
      const p = pm.get(pet.id) || 0;
      row.push(p > 0 ? fmtNum(Math.round(1 / p)) : 'inf');
    }
    rows.push(row);
  });
  writeCSV('10_pet_probabilities.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 11. SHOP ECONOMY
// ═══════════════════════════════════════════════════════════════

function gen11_shop() {
  const pool = getEligiblePets(1);
  const coinsPerRoll = expectedCoinsPerRoll(pool, 1);
  const autorollsPerHour = 3600000 / AUTOROLL_MS;

  const header = ['Pet','Grade','Chance','Shop Price','Rolls to afford','Hours to afford','vs RNG rolls'];
  const rows = [];
  const sorted = [...PETS].sort((a, b) => a.chance - b.chance);

  for (const pet of sorted) {
    const g = getGrade(pet.chance);
    const price = pet.chance * 2;
    const rollsToAfford = Math.ceil(price / coinsPerRoll);
    const hoursToAfford = rollsToAfford / autorollsPerHour;

    const probs = computeProbabilities(pool, 1);
    const pPet = probs.get(pet.id) || 0;
    const rollsToGet = pPet > 0 ? Math.round(1 / pPet) : Infinity;

    const verdict = rollsToAfford < rollsToGet
      ? `Shop faster (${fmtNum(rollsToAfford)} vs ${fmtNum(rollsToGet)})`
      : `RNG faster (${fmtNum(rollsToGet)} vs ${fmtNum(rollsToAfford)})`;

    rows.push([
      pet.id, g.name, oddsStr(pet.chance), fmtNum(price),
      fmtNum(rollsToAfford),
      hoursToAfford >= 1 ? hoursToAfford.toFixed(1) + 'h' : (hoursToAfford * 60).toFixed(1) + 'min',
      verdict,
    ]);
  }
  writeCSV('11_shop_economy.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 12. OVERNIGHT AUTOROLL ANALYSIS
// ═══════════════════════════════════════════════════════════════

function gen12_overnight() {
  const pool = getEligiblePets(1);
  const durations = [1, 2, 4, 8, 12, 24];

  const header = [
    'Duration', 'Total Rolls', 'Coins earned',
    'XP earned', 'Levels gained (from lv10)', 'Levels gained (from lv50)',
    'Expected Rare+ hits', 'Expected Elite+ hits',
    'Expected Epic+ hits', 'P(at least 1 Legendary)',
  ];

  const gp = gradeProbabilities(pool, 1);
  const pRare = ['Rare','Superior','Elite','Epic','Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
  const pElite = ['Elite','Epic','Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
  const pEpic = ['Epic','Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
  const pLeg = gp['Legendary'] || 0;
  const coinsPerRoll = expectedCoinsPerRoll(pool, 1);

  function levelsGained(startLv, totalXp) {
    let remaining = totalXp, lv = startLv, levels = 0;
    while (remaining >= xpForLevel(lv)) { remaining -= xpForLevel(lv); lv++; levels++; }
    return levels;
  }

  const rows = [];
  for (const h of durations) {
    const rolls = h * 3600000 / AUTOROLL_MS;
    const totalXp = rolls * XP_PER_ROLL;
    rows.push([
      h + 'h', fmtNum(Math.round(rolls)),
      fmtNum(Math.round(rolls * coinsPerRoll)),
      fmtNum(totalXp),
      levelsGained(10, totalXp),
      levelsGained(50, totalXp),
      fmtNum(Math.round(rolls * pRare)),
      fmtNum(Math.round(rolls * pElite)),
      (rolls * pEpic).toFixed(2),
      (1 - Math.pow(1 - pLeg, rolls)).toExponential(4),
    ]);
  }
  writeCSV('12_overnight_autoroll.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 13. COIN SINKS vs SOURCES
// ═══════════════════════════════════════════════════════════════

function gen13_coinBalance() {
  const pool = getEligiblePets(1);
  const coinsPerRoll = expectedCoinsPerRoll(pool, 1);
  const rollsPerHour = 3600000 / AUTOROLL_MS;

  const header = ['Source/Sink', 'Type', 'Amount', 'Frequency', 'Coins/hour (autoroll)', 'Notes'];
  const rows = [
    ['Roll coins', 'SOURCE', coinsPerRoll.toFixed(2) + '/roll', rollsPerHour.toFixed(0) + '/h',
     fmtNum(Math.round(coinsPerRoll * rollsPerHour)), 'Coins = pet.chance value'],
    ['Level-up coins', 'SOURCE', coinRewardForLevel(50) + ' (at lv50)', 'Per level',
     'Variable', 'Formula: sigmoid 5-500 range'],
    ['League promotion', 'SOURCE', '500-500K', 'One-time per league',
     'One-time', 'Silver 500, Gold 5K, Diamond 50K, Master 500K'],
    ['Quest milestones', 'SOURCE', '100-15K', 'At 3/6/9/12/15 quests',
     'One-time', 'Total: 22,600 coins'],
    ['Shop purchase', 'SINK', 'chance*2', 'Manual',
     'Variable', 'Price = pet.chance * 2'],
    ['Egg purchase', 'SINK', '10-1000', 'Manual',
     'Variable', 'Tier 1: 10, Tier 17: 1000'],
    ['Nest slot unlock', 'SINK', '5K / 50K', 'One-time',
     'One-time', 'Slot 2: 5K, Slot 3: 50K'],
  ];
  writeCSV('13_coin_sources_sinks.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 14. QUEST VALUE ANALYSIS
// ═══════════════════════════════════════════════════════════════

function gen14_quests() {
  const header = [
    'Quest', 'Step', 'Target', 'Reward (free)', 'Reward (ad)',
    'Buff type', 'Buff mult', 'Notes',
  ];
  const rollSteps = [
    { target:3,  free:3,  ad:5 },  { target:5,  free:5,  ad:10 },
    { target:10, free:10, ad:20 }, { target:20, free:25, ad:50 },
    { target:50, free:25, ad:50 },
  ];
  const gradeSteps = [
    { grade:'Uncommon', target:1, free:3,  ad:8 },
    { grade:'Uncommon', target:2, free:5,  ad:12 },
    { grade:'Uncommon', target:3, free:5,  ad:12 },
    { grade:'Extra',    target:1, free:8,  ad:20 },
    { grade:'Extra',    target:2, free:10, ad:25 },
    { grade:'Extra',    target:3, free:12, ad:30 },
  ];
  const onlineSteps = [
    { target:1,  free:3,  ad:6 },  { target:3,  free:5,  ad:10 },
    { target:5,  free:8,  ad:15 }, { target:10, free:15, ad:30 },
    { target:30, free:30, ad:60 }, { target:60, free:50, ad:100 },
  ];

  const rows = [];
  rollSteps.forEach((s, i) => {
    rows.push(['Roll', i+1, `${s.target} rolls`, `${s.free}x Lucky`, `${s.ad}x Lucky`, 'Lucky', 'x2', i === 4 ? 'loops' : '']);
  });
  gradeSteps.forEach((s, i) => {
    rows.push(['Grade', i+1, `${s.target}x ${s.grade}+`, `${s.free}x Super`, `${s.ad}x Super`, 'Super', 'x3', i === 5 ? 'loops' : '']);
  });
  onlineSteps.forEach((s, i) => {
    rows.push(['Online', i+1, `${s.target} min`, `${s.free}x Epic`, `${s.ad}x Epic`, 'Epic', 'x5', i === 5 ? 'loops' : '']);
  });
  rows.push([]);
  rows.push(['MILESTONES','At quest #','Coin reward','','','','','']);
  [3,6,9,12,15].forEach((at, i) => {
    rows.push(['Milestone', at, [100,500,2000,5000,15000][i] + ' coins','','','','','']);
  });
  writeCSV('14_quest_analysis.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 15. COLLECTION COMPLETION ESTIMATE
// ═══════════════════════════════════════════════════════════════

function gen15_collection() {
  const header = [
    'Collection %', 'Pets collected', 'Hardest uncollected grade',
    'Est. rolls needed (from 0)', 'Est. autoroll time',
    'Est. rolls for last pet', 'Notes',
  ];
  const pool = getEligiblePets(1);
  const sorted = [...pool].sort((a, b) => a.chance - b.chance);
  const probs = computeProbabilities(pool, 1);
  const milestones = [10, 20, 28, 30, 40, 50, 52, 60, 68, 70, 80, 82, 90, 96, 99, 100];
  const rows = [];

  for (const target of milestones) {
    const petsNeeded = sorted.slice(0, target);
    const hardestPet = petsNeeded[petsNeeded.length - 1];
    const hardestGrade = getGrade(hardestPet.chance);
    const pHardest = probs.get(hardestPet.id) || 0;
    const rollsForLastPet = pHardest > 0 ? Math.round(1 / pHardest) : Infinity;
    let totalEst = 0;
    for (const p of petsNeeded) {
      const pp = probs.get(p.id) || 0;
      if (pp > 0) totalEst += 1 / pp;
    }
    totalEst = Math.round(totalEst);
    const autorollHours = totalEst * AUTOROLL_MS / 1000 / 3600;

    let note = '';
    if (target === 28) note = 'All Commons';
    if (target === 52) note = 'All Commons + Uncommons';
    if (target === 68) note = '+ All Extra';
    if (target === 82) note = '+ All Rare';
    if (target === 96) note = 'Everything except top 4';
    if (target === 100) note = 'Full collection';

    rows.push([
      target + '%', target, hardestGrade.name,
      fmtNum(totalEst),
      autorollHours >= 24 ? (autorollHours/24).toFixed(1) + ' days' :
        autorollHours >= 1 ? autorollHours.toFixed(1) + 'h' :
        (autorollHours * 60).toFixed(0) + 'min',
      fmtNum(rollsForLastPet), note,
    ]);
  }
  writeCSV('15_collection_completion.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// RUN ALL
// ═══════════════════════════════════════════════════════════════

console.log('PETS GO Lite — Balance Calculator\n');
console.log(`Total pets: ${PETS.length}`);
console.log(`Grades: ${GRADES.length}`);
console.log(`Egg tiers: ${VISUAL_TIERS.length}`);
console.log(`Leagues: ${LEAGUES.length}\n`);

console.log('Generating CSV files...\n');
gen01_pets();
gen02_grades();
gen03_xp();
gen04_eggs();
gen05_probabilities();
gen06_economy();
gen07_buffs();
gen08_strategies();
gen09_goldenPath();
gen10_petProbabilities();
gen11_shop();
gen12_overnight();
gen13_coinBalance();
gen14_quests();
gen15_collection();
console.log('\nDone! All CSV files saved to documentation/balance/');
