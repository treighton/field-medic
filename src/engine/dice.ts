export type Rng = () => number;

export type DiceRoll = {
  kind: "dice";
  label: string;
  sides: number;
  count: number;
  values: number[];
  total: number;
};

// Mulberry32 PRNG for deterministic runs
export function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedToNumber(seed: string): number {
  // Simple string hash -> 32-bit int
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rollDie(sides: number, rng: Rng = Math.random): number {
  return Math.floor(rng() * sides) + 1;
}

export function rollDice(count: number, sides: number, label: string, rng: Rng = Math.random): DiceRoll {
  const values: number[] = [];
  for (let i = 0; i < count; i++) values.push(rollDie(sides, rng));
  const total = values.reduce((a, b) => a + b, 0);
  return { kind: "dice", label, sides, count, values, total };
}

export function roll1d6(label: string, rng?: Rng): DiceRoll {
  return rollDice(1, 6, label, rng);
}

export function roll2d6(label: string, rng?: Rng): DiceRoll {
  return rollDice(2, 6, label, rng);
}
