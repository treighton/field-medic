import type { TraumaInjuryType } from "../types/scenario";
import type { MoiTags } from "./moiTags";
import type { Rng } from "./dice";
import { weightedPick } from "./weightedPick";

export function injuryWeightsFromMoi(tags: MoiTags): Record<TraumaInjuryType, number> {
  const w: Record<TraumaInjuryType, number> = {
    "spinal instability": 2,
    "intracranial bleed": 1,
    "pelvic fracture": 2,
    "pneumothorax": 1,
    "internal bleeding": 1,
    "concussion": 2,
    "solid organ injury": 1,
    "femur fracture": 1,
    "rib fractures": 1,
    "multiple injuries": 1,
    "no serious injury": 3,
  };

  // Energy
  if (tags.energy === "high") {
    w["multiple injuries"] += 4;
    w["internal bleeding"] += 3;
    w["solid organ injury"] += 2;
    w["pneumothorax"] += 2;
    w["rib fractures"] += 2;
    w["no serious injury"] = Math.max(0, w["no serious injury"] - 1);
  } else if (tags.energy === "moderate") {
    w["pelvic fracture"] += 1;
    w["spinal instability"] += 1;
    w["concussion"] += 1;
  } else {
    w["no serious injury"] += 2;
    w["multiple injuries"] = Math.max(0, w["multiple injuries"] - 1);
  }

  // Landing patterns
  if (tags.landing === "butt" || tags.landing === "back") {
    w["pelvic fracture"] += 4;
    w["spinal instability"] += 4;
    w["internal bleeding"] += 2;
  }
  if (tags.landing === "head/face") {
    w["concussion"] += 5;
    w["intracranial bleed"] += 4;
    w["spinal instability"] += 1;
    w["no serious injury"] = Math.max(0, w["no serious injury"] - 1);
  }
  if (tags.landing === "multiple impacts") {
    w["multiple injuries"] += 4;
    w["rib fractures"] += 2;
    w["pneumothorax"] += 2;
    w["intracranial bleed"] += 1;
  }

  // Surface hardness
  if (tags.surface === "rock" || tags.surface === "pavement") {
    w["rib fractures"] += 1;
    w["intracranial bleed"] += 1;
    w["pelvic fracture"] += 1;
    w["no serious injury"] = Math.max(0, w["no serious injury"] - 1);
  }

  // Witnessed/helmet
  if (!tags.witnessed) {
    w["intracranial bleed"] += 2;
    w["multiple injuries"] += 1;
  }
  if (tags.helmet === false) {
    w["concussion"] += 2;
    w["intracranial bleed"] += 1;
  }

  // Keep weights >= 0
  for (const k of Object.keys(w) as TraumaInjuryType[]) {
    w[k] = Math.max(0, w[k]);
  }

  return w;
}

export function rollDistinctInjuriesWeighted(count: number, tags: MoiTags, rng: Rng): TraumaInjuryType[] {
  const out: TraumaInjuryType[] = [];
  const picked = new Set<TraumaInjuryType>();
  const weights = injuryWeightsFromMoi(tags);

  let safety = 0;
  while (out.length < count && safety < 120) {
    safety++;
    const { picked: inj } = weightedPick(weights, "Hidden Injury (weighted)", rng);
    if (picked.has(inj)) continue;
    picked.add(inj);
    out.push(inj);
  }

  return out;
}
