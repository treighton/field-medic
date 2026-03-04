import type { RollWithModifier, InjuryCountResult } from "../types/scenario";
import { roll2d6, type Rng } from "./dice";

export function rollHiddenInjuryCount(moiModifier: number, rng?: Rng): InjuryCountResult {
  const baseRoll = roll2d6("Hidden Injury Count (2d6)", rng);
  const total = baseRoll.total + moiModifier;

  const roll: RollWithModifier = {
    kind: "rollWithModifier",
    label: "Hidden Injury Count (2d6 + MOI modifier)",
    baseRoll,
    modifier: moiModifier,
    total,
  };

  let injuryCount: 0 | 1 | 2 | 3;
  if (total <= 4) injuryCount = 0;
  else if (total <= 7) injuryCount = 1;
  else if (total <= 10) injuryCount = 2;
  else injuryCount = 3;

  return {
    roll,
    injuryCount,
    mappingRule: "≤4 → 0, 5–7 → 1, 8–10 → 2, ≥11 → 3",
  };
}
