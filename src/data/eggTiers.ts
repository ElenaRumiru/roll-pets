export interface EggTierConfig {
    tier: number;
    price: number;
    buffMultiplier: number;
    incubationMs: number;
}

const MS_MIN = 60_000;
const MS_HOUR = 3_600_000;

const EGG_TIERS: EggTierConfig[] = [
    { tier: 1,  price: 10,   buffMultiplier: 50,          incubationMs: 1 * MS_HOUR },
    { tier: 2,  price: 20,   buffMultiplier: 100,         incubationMs: 1 * MS_HOUR + 30 * MS_MIN },
    { tier: 3,  price: 35,   buffMultiplier: 200,         incubationMs: 2 * MS_HOUR },
    { tier: 4,  price: 55,   buffMultiplier: 500,         incubationMs: 2 * MS_HOUR + 30 * MS_MIN },
    { tier: 5,  price: 80,   buffMultiplier: 1_000,       incubationMs: 3 * MS_HOUR + 30 * MS_MIN },
    { tier: 6,  price: 110,  buffMultiplier: 2_500,       incubationMs: 4 * MS_HOUR },
    { tier: 7,  price: 150,  buffMultiplier: 5_000,       incubationMs: 5 * MS_HOUR },
    { tier: 8,  price: 200,  buffMultiplier: 10_000,      incubationMs: 6 * MS_HOUR },
    { tier: 9,  price: 270,  buffMultiplier: 25_000,      incubationMs: 8 * MS_HOUR },
    { tier: 10, price: 350,  buffMultiplier: 50_000,      incubationMs: 10 * MS_HOUR },
    { tier: 11, price: 450,  buffMultiplier: 150_000,     incubationMs: 12 * MS_HOUR },
    { tier: 12, price: 560,  buffMultiplier: 500_000,     incubationMs: 16 * MS_HOUR },
    { tier: 13, price: 680,  buffMultiplier: 2_500_000,   incubationMs: 20 * MS_HOUR },
    { tier: 14, price: 800,  buffMultiplier: 10_000_000,  incubationMs: 24 * MS_HOUR },
    { tier: 15, price: 880,  buffMultiplier: 50_000_000,  incubationMs: 24 * MS_HOUR },
    { tier: 16, price: 940,  buffMultiplier: 150_000_000, incubationMs: 24 * MS_HOUR },
    { tier: 17, price: 1000, buffMultiplier: 500_000_000, incubationMs: 24 * MS_HOUR },
];

export { EGG_TIERS };

export function getEggTierConfig(tier: number): EggTierConfig {
    return EGG_TIERS[tier - 1] ?? EGG_TIERS[0];
}

export function formatIncubationTime(ms: number): string {
    const totalMin = Math.round(ms / MS_MIN);
    if (totalMin < 60) return `${totalMin}m`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatBuffMultiplier(mult: number): string {
    if (mult >= 1_000_000_000) return `x${(mult / 1_000_000_000).toFixed(0)}B`;
    if (mult >= 1_000_000) return `x${(mult / 1_000_000).toFixed(mult % 1_000_000 === 0 ? 0 : 1)}M`;
    if (mult >= 1_000) return `x${(mult / 1_000).toFixed(mult % 1_000 === 0 ? 0 : 1)}K`;
    return `x${mult}`;
}
