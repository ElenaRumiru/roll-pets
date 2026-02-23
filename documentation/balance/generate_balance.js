/**
 * PETS GO Lite — Full Balance Calculator
 * Run: node documentation/balance/generate_balance.js
 * Outputs CSV files into documentation/balance/
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
  { name:'Common',    min:2,         max:100,        coinsNew:5,    coinsDup:1,    xpNew:25, xpDup:0.5  },
  { name:'Uncommon',  min:100,       max:1000,       coinsNew:10,   coinsDup:2,    xpNew:25, xpDup:1    },
  { name:'Improved',  min:1000,      max:5000,       coinsNew:25,   coinsDup:3,    xpNew:25, xpDup:1.5  },
  { name:'Rare',      min:5000,      max:50000,      coinsNew:50,   coinsDup:5,    xpNew:25, xpDup:2    },
  { name:'Valuable',  min:50000,     max:500000,     coinsNew:100,  coinsDup:10,   xpNew:25, xpDup:3    },
  { name:'Elite',     min:500000,    max:5000000,    coinsNew:250,  coinsDup:25,   xpNew:25, xpDup:4    },
  { name:'Epic',      min:5000000,   max:50000000,   coinsNew:500,  coinsDup:50,   xpNew:25, xpDup:5    },
  { name:'Heroic',    min:50000000,  max:250000000,  coinsNew:1000, coinsDup:100,  xpNew:25, xpDup:6    },
  { name:'Mythic',    min:250000000, max:500000000,  coinsNew:2500, coinsDup:250,  xpNew:25, xpDup:7    },
  { name:'Ancient',   min:500000000, max:750000000,  coinsNew:5000, coinsDup:500,  xpNew:25, xpDup:8    },
  { name:'Legendary', min:750000000, max:1000000000, coinsNew:10000,coinsDup:1000, xpNew:25, xpDup:10   },
];

const XP_BASE = 100;
const XP_MULT = 1.15;
const VISUAL_TIERS = [1,6,12,18,25,36,52,72,102,144,205,282,385,513,718,1026,1538];
const AUTOROLL_MS = 500;
const BUFF = { lucky:2, super:3, epic:5 };
const OFFER_DURATION_S = 15;
const OFFER_COOLDOWN_S = 5;

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getGrade(chance) {
  for (let i = GRADES.length - 1; i >= 0; i--) {
    if (chance >= GRADES[i].min) return GRADES[i];
  }
  return GRADES[0];
}

function xpForLevel(lv) { return Math.floor(XP_BASE * Math.pow(XP_MULT, lv - 1)); }

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

// ═══════════════════════════════════════════════════════════════
// CORE: Roll Probability Engine
// ═══════════════════════════════════════════════════════════════

/**
 * Compute exact P(each pet) for a given pool + luck multiplier.
 * Returns Map<petId, probability>
 */
function computeProbabilities(pool, mult) {
  const sorted = [...pool].sort((a, b) => b.chance - a.chance); // rarest first
  const probs = new Map();
  let passThrough = 1.0;

  for (const pet of sorted) {
    const check = Math.min(1.0, mult / pet.chance);
    probs.set(pet.id, passThrough * check);
    passThrough *= (1 - check);
  }

  // Fallback goes to most common (last in sorted)
  const fallbackId = sorted[sorted.length - 1].id;
  probs.set(fallbackId, probs.get(fallbackId) + passThrough);

  return probs;
}

/**
 * Compute P(grade) by summing pet probabilities
 */
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

/**
 * Expected coins per roll (for a given collection state)
 * collectedSet = Set of pet ids already collected
 */
function expectedCoinsPerRoll(pool, mult, collectedSet) {
  const probs = computeProbabilities(pool, mult);
  let ev = 0;
  for (const pet of pool) {
    const p = probs.get(pet.id) || 0;
    const g = getGrade(pet.chance);
    const isNew = !collectedSet.has(pet.id);
    const coins = isNew ? g.coinsNew : g.coinsDup;
    ev += p * coins;
  }
  return ev;
}

/**
 * Expected XP% per roll (as fraction of current level's XP bar)
 */
function expectedXpPercentPerRoll(pool, mult, collectedSet) {
  const probs = computeProbabilities(pool, mult);
  let ev = 0;
  for (const pet of pool) {
    const p = probs.get(pet.id) || 0;
    const g = getGrade(pet.chance);
    const isNew = !collectedSet.has(pet.id);
    const xpPct = isNew ? g.xpNew : g.xpDup;
    ev += p * xpPct;
  }
  return ev; // in percent
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
  const header = ['#','ID','Grade','Chance','Odds','Coins(New)','Coins(Dup)','XP%(New)','XP%(Dup)','ShopPrice'];
  const rows = [];
  const sorted = [...PETS].sort((a, b) => a.chance - b.chance);
  sorted.forEach((p, i) => {
    const g = getGrade(p.chance);
    rows.push([
      i + 1, p.id, g.name, p.chance, oddsStr(p.chance),
      g.coinsNew, g.coinsDup, g.xpNew + '%', g.xpDup + '%', p.chance * 2,
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
    'Coins(New)','Coins(Dup)','XP%(New)','XP%(Dup)',
    'ShopPrice Range','Total ShopPrice (all pets)',
  ];
  const rows = [];
  for (const g of GRADES) {
    const pets = PETS.filter(p => p.chance >= g.min && p.chance < g.max);
    const minC = pets.length ? Math.min(...pets.map(p => p.chance)) : 0;
    const maxC = pets.length ? Math.max(...pets.map(p => p.chance)) : 0;
    const shopMin = minC * 2;
    const shopMax = maxC * 2;
    const totalShop = pets.reduce((s, p) => s + p.chance * 2, 0);
    rows.push([
      g.name, pets.length,
      `${fmtNum(g.min)} - ${fmtNum(g.max)}`,
      `${oddsStr(minC)} - ${oddsStr(maxC)}`,
      g.coinsNew, g.coinsDup,
      g.xpNew + '%', g.xpDup + '%',
      `${fmtNum(shopMin)} - ${fmtNum(shopMax)}`,
      fmtNum(totalShop),
    ]);
  }
  writeCSV('02_grades_summary.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 3. XP PROGRESSION CURVE (levels 1-200)
// ═══════════════════════════════════════════════════════════════

function gen03_xp() {
  const header = [
    'Level','XP Needed','Cumulative XP','EggTier','EggTierChange',
    'Coin Reward (free)','Coin Reward (ad x3)','Pool Size','Removed Pets',
  ];
  const rows = [];
  let cumXp = 0;
  let prevTier = 0;
  for (let lv = 1; lv <= 200; lv++) {
    const xp = xpForLevel(lv);
    cumXp += xp;
    const tier = getVisualTier(lv);
    const tierChanged = tier !== prevTier;
    const pool = getEligiblePets(lv);
    const coinsFree = lv * 10;
    const coinsAd = coinsFree * 3;
    rows.push([
      lv, xp, cumXp, tier, tierChanged ? 'YES' : '',
      tierChanged ? 0 : coinsFree, tierChanged ? 0 : coinsAd,
      pool.length, 100 - pool.length,
    ]);
    prevTier = tier;
  }
  writeCSV('03_xp_progression.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 4. EGG TIERS DETAIL
// ═══════════════════════════════════════════════════════════════

function gen04_eggs() {
  const header = [
    'Tier','Unlock Level','Pets Removed','Pool Size',
    'Cheapest Pet','Min Chance','Min Odds',
    'Rarest Pet','Max Chance','Max Odds',
  ];
  const rows = [];
  const sortedAsc = [...PETS].sort((a, b) => a.chance - b.chance);
  for (let t = 1; t <= 17; t++) {
    const lv = VISUAL_TIERS[t - 1];
    const pool = getEligiblePets(lv);
    const poolSorted = [...pool].sort((a, b) => a.chance - b.chance);
    const cheapest = poolSorted[0];
    const rarest = poolSorted[poolSorted.length - 1];
    rows.push([
      t, lv, t - 1, pool.length,
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
  const header = ['Grade', 'Pets', ...mults.map(m => `P(grade) x${m}`), ...mults.map(m => `Avg rolls to hit x${m}`)];
  const rows = [];

  // Full pool (level 1)
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
// 6. ECONOMY: Expected Value Per Roll
// ═══════════════════════════════════════════════════════════════

function gen06_economy() {
  const mults = [1, 2, 3, 5, 6, 10, 15, 30];

  // Scenario A: New player (0 collected)
  // Scenario B: 50% collected (50 cheapest)
  // Scenario C: All common collected (28 common)
  // Scenario D: Veteran (all 100 collected)

  const pool = getEligiblePets(1); // full pool
  const sortedAsc = [...pool].sort((a, b) => a.chance - b.chance);

  const scenarioNone = new Set();
  const scenario28 = new Set(sortedAsc.slice(0, 28).map(p => p.id));
  const scenario50 = new Set(sortedAsc.slice(0, 50).map(p => p.id));
  const scenarioAll = new Set(pool.map(p => p.id));

  const scenarios = [
    { name: 'New player (0 collected)', set: scenarioNone },
    { name: 'All commons collected (28)', set: scenario28 },
    { name: 'Half collected (50)', set: scenario50 },
    { name: 'Veteran (all 100)', set: scenarioAll },
  ];

  const header = ['Scenario', ...mults.map(m => `E[coins] x${m}`), ...mults.map(m => `E[XP%] x${m}`)];
  const rows = [];

  for (const sc of scenarios) {
    const row = [sc.name];
    for (const m of mults) {
      row.push(expectedCoinsPerRoll(pool, m, sc.set).toFixed(4));
    }
    for (const m of mults) {
      row.push(expectedXpPercentPerRoll(pool, m, sc.set).toFixed(4) + '%');
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

  // For each buff combo, compute E[coins] for veteran (all dup) and new player
  const combos = [
    { name: 'No buff',                mult: 1,                   desc: 'Baseline' },
    { name: 'Lucky (x2)',             mult: 2,                   desc: '1 ad (Lucky offer)' },
    { name: 'Super (x3)',             mult: 3,                   desc: '1 ad (Super offer)' },
    { name: 'Epic (x5)',              mult: 5,                   desc: '1 ad (Epic offer)' },
    { name: 'Lucky+Super (x6)',       mult: 6,                   desc: '2 ads' },
    { name: 'Lucky+Epic (x10)',       mult: 10,                  desc: '2 ads' },
    { name: 'Super+Epic (x15)',       mult: 15,                  desc: '2 ads' },
    { name: 'Lucky+Super+Epic (x30)', mult: 30,                  desc: '3 ads (maximum)' },
  ];

  const scenarioVet = new Set(pool.map(p => p.id));
  const scenarioNew = new Set();

  const header = [
    'Buff Combo', 'Multiplier', 'How to get',
    'E[coins/roll] (new)', 'E[coins/roll] (veteran)',
    'E[XP%/roll] (new)', 'E[XP%/roll] (veteran)',
    'Coin uplift vs base (vet)', 'Coin value of 1 buffed roll (vet)',
    'P(Rare+)', 'P(Epic+)', 'P(Legendary)',
  ];
  const rows = [];

  const baseCoinsVet = expectedCoinsPerRoll(pool, 1, scenarioVet);
  const baseCoinsNew = expectedCoinsPerRoll(pool, 1, scenarioNew);

  for (const c of combos) {
    const coinsNew = expectedCoinsPerRoll(pool, c.mult, scenarioNew);
    const coinsVet = expectedCoinsPerRoll(pool, c.mult, scenarioVet);
    const xpNew = expectedXpPercentPerRoll(pool, c.mult, scenarioNew);
    const xpVet = expectedXpPercentPerRoll(pool, c.mult, scenarioVet);

    const gp = gradeProbabilities(pool, c.mult);
    const pRarePlus = (gp['Rare']||0)+(gp['Valuable']||0)+(gp['Elite']||0)+(gp['Epic']||0)+(gp['Heroic']||0)+(gp['Mythic']||0)+(gp['Ancient']||0)+(gp['Legendary']||0);
    const pEpicPlus = (gp['Epic']||0)+(gp['Heroic']||0)+(gp['Mythic']||0)+(gp['Ancient']||0)+(gp['Legendary']||0);
    const pLeg = gp['Legendary'] || 0;

    const uplift = ((coinsVet / baseCoinsVet - 1) * 100);
    const valuePerRoll = coinsVet - baseCoinsVet;

    rows.push([
      c.name, 'x' + c.mult, c.desc,
      coinsNew.toFixed(4), coinsVet.toFixed(4),
      xpNew.toFixed(4) + '%', xpVet.toFixed(4) + '%',
      '+' + uplift.toFixed(1) + '%', valuePerRoll.toFixed(4),
      pRarePlus > 0.001 ? (pRarePlus*100).toFixed(4)+'%' : pRarePlus.toExponential(3),
      pEpicPlus > 1e-6 ? pEpicPlus.toExponential(4) : pEpicPlus.toExponential(3),
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
  const vetSet = new Set(pool.map(p => p.id));

  // Constants
  const rollMs = AUTOROLL_MS; // 500ms
  const adWatchSec = 30; // assume 30s per ad
  const offerCycleSec = OFFER_DURATION_S + OFFER_COOLDOWN_S; // 20s

  // Strategy 1: Pure autoroll (no buffs) overnight (8 hours)
  const hoursOvernight = 8;
  const rollsOvernight = (hoursOvernight * 3600 * 1000) / rollMs;
  const coinsBase = expectedCoinsPerRoll(pool, 1, vetSet);
  const xpBase = expectedXpPercentPerRoll(pool, 1, vetSet);

  // Strategy 2: Active buff hunting — stack all 3, roll once, repeat
  // Time per cycle: 3 ads × (offerCycle + adWatch) + 1 roll
  // Offer cycle: lucky offer shows (15s) → watch ad (30s) → cooldown (5s) → super offer (15s) → watch ad (30s) → cooldown (5s) → epic offer (15s) → watch ad (30s)
  // Total: 15 + 30 + 5 + 15 + 30 + 5 + 15 + 30 = 145 seconds for 1 x30 roll
  const fullBuffCycleSec = 3 * (OFFER_DURATION_S + adWatchSec + OFFER_COOLDOWN_S) - OFFER_COOLDOWN_S;
  const coinsX30 = expectedCoinsPerRoll(pool, 30, vetSet);
  const xpX30 = expectedXpPercentPerRoll(pool, 30, vetSet);

  // Strategy 3: Lucky only — watch 1 ad, roll with x2, repeat
  const luckyOnlyCycleSec = OFFER_DURATION_S + adWatchSec + OFFER_COOLDOWN_S;
  const coinsX2 = expectedCoinsPerRoll(pool, 2, vetSet);
  const xpX2 = expectedXpPercentPerRoll(pool, 2, vetSet);

  // Strategy 4: Active manual rolling (no autoroll, ~1 roll/sec)
  const manualRollSec = 1;
  const coinsManual = coinsBase;

  // Strategy 5: Autoroll + occasionally grab free quest buffs
  // Quest gives 1 lucky per 3/5/10 rolls (free). Assume every 10 rolls = 1 lucky buff.
  // So effectively 1/10 rolls has x2 mult, rest x1
  const questBuffedFraction = 1 / 10;
  const coinsQuestMix = coinsBase * (1 - questBuffedFraction) + coinsX2 * questBuffedFraction;

  // Time frames
  const hours = [1, 4, 8, 12, 24];

  const header = [
    'Strategy', 'Mult', 'Rolls/hour', 'Coins/hour (vet)', 'XP%/hour (vet)',
    ...hours.map(h => `Coins in ${h}h`),
    ...hours.map(h => `Rolls in ${h}h`),
    'P(Rare+)/roll', 'P(Epic+)/roll', 'Rare+ hits in 8h',
  ];

  const gp1 = gradeProbabilities(pool, 1);
  const gp2 = gradeProbabilities(pool, 2);
  const gp30 = gradeProbabilities(pool, 30);

  function pRarePlus(gp) {
    return (gp['Rare']||0)+(gp['Valuable']||0)+(gp['Elite']||0)+(gp['Epic']||0)+(gp['Heroic']||0)+(gp['Mythic']||0)+(gp['Ancient']||0)+(gp['Legendary']||0);
  }
  function pEpicPlus(gp) {
    return (gp['Epic']||0)+(gp['Heroic']||0)+(gp['Mythic']||0)+(gp['Ancient']||0)+(gp['Legendary']||0);
  }

  const strategies = [
    {
      name: 'Autoroll (overnight/AFK)',
      mult: 1,
      rollsPerHour: 3600000 / rollMs,
      coinsPerRoll: coinsBase,
      xpPerRoll: xpBase,
      gp: gp1,
    },
    {
      name: 'Manual rolling (1/sec)',
      mult: 1,
      rollsPerHour: 3600,
      coinsPerRoll: coinsBase,
      xpPerRoll: xpBase,
      gp: gp1,
    },
    {
      name: 'Autoroll + quest buffs',
      mult: '1-2',
      rollsPerHour: 3600000 / rollMs,
      coinsPerRoll: coinsQuestMix,
      xpPerRoll: xpBase * 0.9 + xpX2 * 0.1,
      gp: gp1, // approximate
    },
    {
      name: 'Lucky-only hunting (x2)',
      mult: 2,
      rollsPerHour: 3600 / luckyOnlyCycleSec,
      coinsPerRoll: coinsX2,
      xpPerRoll: xpX2,
      gp: gp2,
    },
    {
      name: 'Full buff stack (x30)',
      mult: 30,
      rollsPerHour: 3600 / fullBuffCycleSec,
      coinsPerRoll: coinsX30,
      xpPerRoll: xpX30,
      gp: gp30,
    },
  ];

  const rows = [];
  for (const s of strategies) {
    const row = [
      s.name,
      s.mult,
      s.rollsPerHour.toFixed(1),
      (s.rollsPerHour * s.coinsPerRoll).toFixed(2),
      (s.rollsPerHour * s.xpPerRoll).toFixed(4) + '%',
    ];
    for (const h of hours) {
      row.push(fmtNum(Math.round(h * s.rollsPerHour * s.coinsPerRoll)));
    }
    for (const h of hours) {
      row.push(fmtNum(Math.round(h * s.rollsPerHour)));
    }
    row.push((pRarePlus(s.gp)*100).toFixed(4) + '%');
    row.push(pEpicPlus(s.gp).toExponential(3));
    row.push(fmtNum(Math.round(8 * s.rollsPerHour * pRarePlus(s.gp))));
    rows.push(row);
  }

  writeCSV('08_strategies_comparison.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 9. GOLDEN PATH — Player Journey Simulation
// ═══════════════════════════════════════════════════════════════

function gen09_goldenPath() {
  // Simulate a player from level 1 to level 100
  // Using expected values (not random), track:
  // - Rolls needed per level
  // - Cumulative rolls
  // - Time at autoroll speed
  // - Collection % estimate
  // - Total coins earned
  // - "Wow moments" (milestone events)

  const header = [
    'Level','XP Needed','Egg Tier','Pool Size',
    'E[XP%/roll]','E[rolls to level up]','Cumulative Rolls',
    'Time (autoroll)','Time (manual 1/s)',
    'E[coins/roll]','Coins this level','Cumulative Coins',
    'Approx Collection %','New pets this level (est)',
    'Level-up Reward (coins)','Milestone',
  ];

  const rows = [];
  let cumRolls = 0;
  let cumCoins = 0;
  let collectedCount = 0;
  const collected = new Set();

  // For collection estimation, track expected new pets
  // P(new) for a roll = sum of P(pet) for all uncollected pets
  // This is complex to simulate exactly, so we approximate:
  // After N rolls in a pool of K uncollected pets, expected new ≈ K * (1 - (1 - avg_p)^N)

  for (let lv = 1; lv <= 150; lv++) {
    const xpNeeded = xpForLevel(lv);
    const pool = getEligiblePets(lv);
    const tier = getVisualTier(lv);
    const tierChanged = lv > 1 && getVisualTier(lv) !== getVisualTier(lv - 1);

    // Estimate XP% per roll based on current collection state
    // For simplicity, use a mix: some new (25%) + mostly dup
    // More accurate: estimate fraction of rolls that give new pets
    const uncollectedInPool = pool.filter(p => !collected.has(p.id));
    const probs = computeProbabilities(pool, 1);

    let pNewRoll = 0; // probability of getting ANY new pet
    for (const p of uncollectedInPool) {
      pNewRoll += probs.get(p.id) || 0;
    }
    pNewRoll = Math.min(pNewRoll, 1);

    // Expected XP% per roll
    // New pet: 25% XP bar, Dup: weighted average of dup XP%
    let avgDupXp = 0;
    let totalDupP = 0;
    for (const p of pool) {
      if (collected.has(p.id)) {
        const prob = probs.get(p.id) || 0;
        avgDupXp += prob * getGrade(p.chance).xpDup;
        totalDupP += prob;
      }
    }
    if (totalDupP > 0) avgDupXp /= totalDupP;
    else avgDupXp = 0.5;

    const xpPctPerRoll = pNewRoll * 25 + (1 - pNewRoll) * avgDupXp;
    const rollsToLevel = xpPctPerRoll > 0 ? Math.ceil(100 / xpPctPerRoll) : 999999;

    // Expected coins per roll
    const coinsPerRoll = expectedCoinsPerRoll(pool, 1, collected);

    // Estimate new pets gained during this level
    // Simple model: each roll has pNewRoll chance of new, diminishing
    const newPetsThisLevel = Math.min(
      uncollectedInPool.length,
      Math.round(uncollectedInPool.length * (1 - Math.pow(1 - pNewRoll / Math.max(uncollectedInPool.length, 1), rollsToLevel)))
    );

    // Add estimated new pets to collection (add the most common uncollected)
    const sortedUncollected = [...uncollectedInPool].sort((a, b) => a.chance - b.chance);
    for (let i = 0; i < Math.min(newPetsThisLevel, sortedUncollected.length); i++) {
      collected.add(sortedUncollected[i].id);
    }

    collectedCount = collected.size;

    cumRolls += rollsToLevel;
    const coinsThisLevel = Math.round(rollsToLevel * coinsPerRoll);
    cumCoins += coinsThisLevel;

    // Level-up reward
    const coinReward = tierChanged ? 0 : lv * 10;
    cumCoins += coinReward;

    // Time
    const autorollTimeSec = cumRolls * AUTOROLL_MS / 1000;
    const manualTimeSec = cumRolls;

    function fmtTime(sec) {
      if (sec >= 3600) return (sec / 3600).toFixed(1) + 'h';
      if (sec >= 60) return (sec / 60).toFixed(1) + 'min';
      return sec.toFixed(0) + 's';
    }

    let milestone = '';
    if (tierChanged) milestone = `New egg (tier ${tier})`;
    if (lv === 1) milestone = 'Game start';
    if (collectedCount >= 28 && !rows.some(r => r[13] === 'All Commons')) {
      milestone += (milestone ? ' + ' : '') + 'All Commons';
    }
    if (collectedCount >= 52 && !rows.some(r => r[13] === 'All Uncommons')) {
      milestone += (milestone ? ' + ' : '') + 'All Uncommons';
    }

    rows.push([
      lv, xpNeeded, tier, pool.length,
      xpPctPerRoll.toFixed(2) + '%', rollsToLevel, cumRolls,
      fmtTime(autorollTimeSec), fmtTime(manualTimeSec),
      coinsPerRoll.toFixed(2), coinsThisLevel, cumCoins,
      (collectedCount / 100 * 100).toFixed(1) + '%', newPetsThisLevel,
      coinReward, milestone,
    ]);
  }

  writeCSV('09_golden_path.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 10. PER-PET PROBABILITY TABLE (detailed, for each mult)
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
  const vetSet = new Set(pool.map(p => p.id));
  const coinsPerRoll = expectedCoinsPerRoll(pool, 1, vetSet);
  const autorollsPerHour = 3600000 / AUTOROLL_MS;
  const coinsPerHour = autorollsPerHour * coinsPerRoll;

  const header = ['Pet','Grade','Chance','Shop Price','Rolls to afford (vet autoroll)','Hours to afford (autoroll)','Worth buying? (vs rolling for it)'];
  const rows = [];
  const sorted = [...PETS].sort((a, b) => a.chance - b.chance);

  for (const pet of sorted) {
    const g = getGrade(pet.chance);
    const price = pet.chance * 2;
    const rollsToAfford = Math.ceil(price / coinsPerRoll);
    const hoursToAfford = rollsToAfford / autorollsPerHour;

    // Compare: rolls to afford shop price vs expected rolls to get pet from RNG
    const probs = computeProbabilities(pool, 1);
    const pPet = probs.get(pet.id) || 0;
    const rollsToGet = pPet > 0 ? Math.round(1 / pPet) : Infinity;

    let verdict;
    if (rollsToAfford < rollsToGet) {
      verdict = `YES — shop ${fmtNum(rollsToAfford)} rolls vs RNG ${fmtNum(rollsToGet)} rolls`;
    } else {
      verdict = `NO — shop ${fmtNum(rollsToAfford)} rolls vs RNG ${fmtNum(rollsToGet)} rolls`;
    }

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
// 12. OVERNIGHT AUTOROLL DEEP ANALYSIS
// ═══════════════════════════════════════════════════════════════

function gen12_overnight() {
  const pool = getEligiblePets(1);
  const vetSet = new Set(pool.map(p => p.id));
  const newSet = new Set();

  const durations = [1, 2, 4, 8, 12, 24]; // hours
  const mults = [1]; // autoroll = no buff

  const header = [
    'Duration', 'Total Rolls',
    'Coins (new player)', 'Coins (veteran)',
    'XP levels gained (vet, lv10)', 'XP levels gained (vet, lv50)', 'XP levels gained (vet, lv100)',
    'Expected Rare+ hits', 'Expected Valuable+ hits', 'Expected Elite+ hits',
    'Expected Epic+ hits', 'Expected Heroic+ hits',
    'P(at least 1 Legendary)',
  ];

  const gp = gradeProbabilities(pool, 1);
  const pRarePlus = ['Rare','Valuable','Elite','Epic','Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
  const pValPlus = ['Valuable','Elite','Epic','Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
  const pElitePlus = ['Elite','Epic','Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
  const pEpicPlus = ['Epic','Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
  const pHeroicPlus = ['Heroic','Mythic','Ancient','Legendary'].reduce((s,g) => s + (gp[g]||0), 0);
  const pLeg = gp['Legendary'] || 0;

  const coinsNew = expectedCoinsPerRoll(pool, 1, newSet);
  const coinsVet = expectedCoinsPerRoll(pool, 1, vetSet);
  const xpVet = expectedXpPercentPerRoll(pool, 1, vetSet);

  const rows = [];
  for (const h of durations) {
    const rolls = h * 3600000 / AUTOROLL_MS;
    const xpLv10 = (rolls * xpVet / 100) * xpForLevel(10);
    const xpLv50 = (rolls * xpVet / 100) * xpForLevel(50);
    const xpLv100 = (rolls * xpVet / 100) * xpForLevel(100);

    // Levels gained = approximate: divide total XP by XP per level
    // More accurate: iterate levels
    function levelsGained(startLv, totalXpPct) {
      let xp = 0;
      let levels = 0;
      const totalXpGained = totalXpPct / 100 * xpForLevel(startLv) * rolls;
      // Actually XP gained per roll = xpPct/100 * xpForLevel(currentLevel)
      // This changes as you level up... approximate with starting level
      let remainingXp = totalXpGained;
      let lv = startLv;
      while (remainingXp > 0) {
        const needed = xpForLevel(lv);
        if (remainingXp >= needed) {
          remainingXp -= needed;
          lv++;
          levels++;
        } else {
          break;
        }
      }
      return levels;
    }

    // Simpler: each roll gives xpVet% of current level bar
    // So rolls per level = 100 / xpVet
    // At level 10, rollsPerLevel = 100 / xpVet ≈ 100 / 0.5 = 200
    // But xpVet is just the % of bar, it changes with level via xpForLevel()
    // Actually xpPctPerRoll is independent of level - it's a % of the bar
    const rollsPerLevel = 100 / xpVet; // same for all levels since it's % based

    rows.push([
      h + 'h',
      fmtNum(Math.round(rolls)),
      fmtNum(Math.round(rolls * coinsNew)),
      fmtNum(Math.round(rolls * coinsVet)),
      Math.floor(rolls / rollsPerLevel),
      Math.floor(rolls / rollsPerLevel),
      Math.floor(rolls / rollsPerLevel),
      fmtNum(Math.round(rolls * pRarePlus)),
      fmtNum(Math.round(rolls * pValPlus)),
      fmtNum(Math.round(rolls * pElitePlus)),
      (rolls * pEpicPlus).toFixed(2),
      (rolls * pHeroicPlus).toFixed(4),
      (1 - Math.pow(1 - pLeg, rolls)).toExponential(4),
    ]);
  }

  writeCSV('12_overnight_autoroll.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 13. COIN SINKS vs SOURCES BALANCE
// ═══════════════════════════════════════════════════════════════

function gen13_coinBalance() {
  const header = [
    'Source/Sink', 'Type', 'Amount per event', 'Frequency',
    'Coins per hour (autoroll vet)', 'Notes',
  ];

  const pool = getEligiblePets(1);
  const vetSet = new Set(pool.map(p => p.id));
  const coinsPerRoll = expectedCoinsPerRoll(pool, 1, vetSet);
  const rollsPerHour = 3600000 / AUTOROLL_MS;

  // Level up rewards: roughly every 100/xpDupAvg rolls
  const xpVet = expectedXpPercentPerRoll(pool, 1, vetSet);
  const rollsPerLevel = 100 / xpVet;

  // Average level-up reward (assuming ~level 50 average)
  const avgLevelReward = 50 * 10; // level * 10

  const rows = [
    ['Roll coins (duplicate)', 'SOURCE', coinsPerRoll.toFixed(2) + '/roll', rollsPerHour.toFixed(0) + ' rolls/h',
     (coinsPerRoll * rollsPerHour).toFixed(0), 'Main income for veterans'],
    ['Level-up coins (free)', 'SOURCE', avgLevelReward + ' (at lv50)', '1 per ' + Math.round(rollsPerLevel) + ' rolls',
     (avgLevelReward / rollsPerLevel * rollsPerHour).toFixed(0), 'level * 10 coins; 0 if egg changes'],
    ['Level-up coins (ad x3)', 'SOURCE', avgLevelReward * 3 + ' (at lv50)', '1 per ' + Math.round(rollsPerLevel) + ' rolls',
     (avgLevelReward * 3 / rollsPerLevel * rollsPerHour).toFixed(0), 'Requires watching ad'],
    ['Quest reward (Lucky buff)', 'SOURCE (indirect)', '0 coins', 'Every 10 rolls', '0',
     'Lucky buff increases rare pet chance but not direct coins'],
    ['Shop purchase (Common)', 'SINK', '4-186 coins', 'Manual', 'Variable',
     'Price = chance * 2; cheapest: Cat = 4 coins'],
    ['Shop purchase (Uncommon)', 'SINK', '200-1960 coins', 'Manual', 'Variable', ''],
    ['Shop purchase (Improved)', 'SINK', '2K-9.6K coins', 'Manual', 'Variable', ''],
    ['Shop purchase (Rare)', 'SINK', '10K-96K coins', 'Manual', 'Variable', ''],
    ['Shop purchase (Valuable)', 'SINK', '100K-960K coins', 'Manual', 'Variable', ''],
    ['Shop purchase (Elite)', 'SINK', '1M-9M coins', 'Manual', 'Variable',
     'Extremely expensive — months of autoroll'],
    ['Shop purchase (Epic+)', 'SINK', '10M+ coins', 'Manual', 'Variable',
     'Practically unaffordable through normal play'],
  ];

  writeCSV('13_coin_sources_sinks.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 14. QUEST VALUE ANALYSIS
// ═══════════════════════════════════════════════════════════════

function gen14_quests() {
  const header = [
    'Quest', 'Target', 'Reward (free)', 'Reward (ad)',
    'Buff mult', 'E[coins uplift per buff use] (vet)',
    'Value: free vs ad', 'Optimal choice',
  ];

  const pool = getEligiblePets(1);
  const vetSet = new Set(pool.map(p => p.id));
  const coinsBase = expectedCoinsPerRoll(pool, 1, vetSet);
  const coinsX2 = expectedCoinsPerRoll(pool, 2, vetSet);
  const coinsX3 = expectedCoinsPerRoll(pool, 3, vetSet);

  const luckyUplift = coinsX2 - coinsBase;
  const superUplift = coinsX3 - coinsBase;

  const rows = [
    ['Roll Quest (cycle 1)', '3 rolls', '1x Lucky', '5x Lucky',
     'x2', luckyUplift.toFixed(4),
     `Free: ${luckyUplift.toFixed(4)} coins uplift / Ad: ${(5*luckyUplift).toFixed(4)} coins uplift`,
     'Ad gives 5x value for ~30s investment'],
    ['Roll Quest (cycle 2)', '5 rolls', '1x Lucky', '5x Lucky',
     'x2', luckyUplift.toFixed(4),
     `Free: ${luckyUplift.toFixed(4)} / Ad: ${(5*luckyUplift).toFixed(4)}`,
     'Ad if you want rare pets; Free if impatient'],
    ['Roll Quest (cycle 3+)', '10 rolls', '1x Lucky', '5x Lucky',
     'x2', luckyUplift.toFixed(4),
     `Free: ${luckyUplift.toFixed(4)} / Ad: ${(5*luckyUplift).toFixed(4)}`,
     'Loops at 10; always claim for buffs'],
    ['Grade Quest (cycle 1)', '1x Uncommon+', '1x Super', '3x Super',
     'x3', superUplift.toFixed(4),
     `Free: ${superUplift.toFixed(4)} / Ad: ${(3*superUplift).toFixed(4)}`,
     'Very easy to complete; Ad is great value'],
    ['Grade Quest (cycle 2+)', '1x Improved+', '1x Super', '3x Super',
     'x3', superUplift.toFixed(4),
     `Free: ${superUplift.toFixed(4)} / Ad: ${(3*superUplift).toFixed(4)}`,
     'Harder; may take many rolls at low level'],
  ];

  writeCSV('14_quest_analysis.csv', header, rows);
}

// ═══════════════════════════════════════════════════════════════
// 15. COLLECTION COMPLETION ESTIMATE
// ═══════════════════════════════════════════════════════════════

function gen15_collection() {
  const header = [
    'Collection %', 'Pets collected', 'Hardest uncollected grade',
    'Est. rolls needed (from 0)', 'Est. autoroll time',
    'Est. rolls for next pet', 'Notes',
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

    // Expected rolls to collect exactly these N pets (coupon collector variant)
    // Approximate: for the Nth pet, expected rolls ≈ 1 / P(any uncollected)
    // Total ≈ sum from k=1 to N of 1/P(uncollected_k)
    // Where uncollected_k has P ≈ P(pet_k) when it's the hardest remaining

    // Simpler: for the last pet in the set, expected rolls = 1/P(that pet)
    const pHardest = probs.get(hardestPet.id) || 0;
    const rollsForLastPet = pHardest > 0 ? Math.round(1 / pHardest) : Infinity;

    // Total rolls estimate (rough: sum of 1/P for each pet)
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
    if (target === 68) note = '+ All Improved';
    if (target === 82) note = '+ All Rare';
    if (target === 100) note = 'Full collection (incl. Legendary)';
    if (target === 96) note = 'Everything except top 4 (Heroic+)';

    rows.push([
      (target) + '%', target, hardestGrade.name,
      fmtNum(totalEst),
      autorollHours >= 24 ? (autorollHours/24).toFixed(1) + ' days' :
        autorollHours >= 1 ? autorollHours.toFixed(1) + 'h' :
        (autorollHours * 60).toFixed(0) + 'min',
      fmtNum(rollsForLastPet),
      note,
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
console.log(`Egg tiers: ${VISUAL_TIERS.length}\n`);

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
