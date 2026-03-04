import type { Rng } from "./dice";

export function weightedPick<T extends string>(
  weights: Record<T, number>,
  label: string,
  rng: Rng = Math.random
): { picked: T; roll: number; max: number } {
  const entries = Object.entries(weights).filter(([, w]) => typeof w === "number" && w > 0) as Array<[T, number]>;
  if (!entries.length) {
    throw new Error(`weightedPick: no positive weights for ${label}`);
  }
  const max = entries.reduce((a, [, w]) => a + w, 0);
  const roll = Math.floor(rng() * max) + 1; // 1..max
  let cursor = 0;
  for (const [k, w] of entries) {
    cursor += w;
    if (roll <= cursor) return { picked: k, roll, max };
  }
  return { picked: entries[entries.length - 1][0], roll, max };
}
