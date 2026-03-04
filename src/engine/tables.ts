import { roll1d6, roll2d6, type DiceRoll, type Rng } from "./dice";
import type { InjuryType } from "../types/scenario";

export type TableEntry<T> = {
  range: number | [number, number];
  value: T;
};

export function pickFrom2d6Table<T>(label: string, table: TableEntry<T>[], rng?: Rng): { roll: DiceRoll; value: T } {
  const roll = roll2d6(label, rng);
  const r = roll.total;
  const match = table.find((e) =>
    typeof e.range === "number" ? e.range === r : r >= e.range[0] && r <= e.range[1]
  );
  if (!match) throw new Error(`No table entry for roll ${r} in ${label}`);
  return { roll, value: match.value };
}

export function pickFrom1d6Table<T>(label: string, table: TableEntry<T>[], rng?: Rng): { roll: DiceRoll; value: T } {
  const roll = roll1d6(label, rng);
  const r = roll.total;
  const match = table.find((e) =>
    typeof e.range === "number" ? e.range === r : r >= e.range[0] && r <= e.range[1]
  );
  if (!match) throw new Error(`No table entry for roll ${r} in ${label}`);
  return { roll, value: match.value };
}

export const SETTING_TABLE: TableEntry<{ name: string; notes?: string[]; modifiers?: Record<string, number | string> }>[] = [
  { range: 2, value: { name: "Alpine / Rock Field", notes: ["Cold risk", "Uneven ground"] } },
  { range: 3, value: { name: "Forest Trail", notes: ["Limited visibility", "Roots/rocks"] } },
  { range: 4, value: { name: "Desert / Exposed", notes: ["Heat risk", "Dehydration"] } },
  { range: 5, value: { name: "Riverside / Canyon", notes: ["Water hazard", "Slippery rocks"] } },
  { range: [6, 8], value: { name: "Crag / Bouldering Area", notes: ["Rockfall risk", "Pads/spotters present"] } },
  { range: 9, value: { name: "Roadside", notes: ["Traffic hazard"] } },
  { range: 10, value: { name: "Urban Alley", notes: ["Bystanders", "Limited space"] } },
  { range: 11, value: { name: "Structure Interior", notes: ["Tight space", "Low light possible"] } },
  { range: 12, value: { name: "Remote Wilderness", notes: ["Delayed evacuation"], modifiers: { evacuationDelay: 2 } } },
];

export const HAZARD_TABLE: TableEntry<{ name: string; notes?: string[] }>[] = [
  { range: 1, value: { name: "Loose rock / overhead danger", notes: ["Risk of secondary injury"] } },
  { range: 2, value: { name: "Weather worsening", notes: ["Wind/rain/cold increasing"] } },
  { range: 3, value: { name: "Poor lighting", notes: ["Harder exam and movement"] } },
  { range: 4, value: { name: "Aggressive bystanders", notes: ["Scene control needed"] } },
  { range: 5, value: { name: "Environmental exposure", notes: ["Hypothermia/heat illness risk"] } },
  { range: 6, value: { name: "None obvious" } },
];

export const PATIENT_TABLE: TableEntry<{ type: string; cooperation: "cooperative" | "anxious" | "altered" | "minimizes symptoms"; notes?: string[] }>[] = [
  { range: 2, value: { type: "Pediatric", cooperation: "anxious", notes: ["Caregiver present (maybe)"] } },
  { range: 3, value: { type: "Elderly", cooperation: "cooperative", notes: ["Higher injury risk with falls"] } },
  { range: [4, 5], value: { type: "Adult", cooperation: "anxious", notes: ["Worried, lots of questions"] } },
  { range: [6, 8], value: { type: "Adult", cooperation: "cooperative", notes: ["Answers clearly"] } },
  { range: 9, value: { type: "Adult", cooperation: "altered", notes: ["Confused or intoxicated"] } },
  { range: 10, value: { type: "Pregnant adult", cooperation: "anxious", notes: ["Consider fetal risk and evacuation threshold"] } },
  { range: 11, value: { type: "Athletic adult", cooperation: "minimizes symptoms", notes: ["Downplays pain", "Wants to keep moving"] } },
  { range: 12, value: { type: "Adult with significant history", cooperation: "cooperative", notes: ["Meds/allergies likely relevant"] } },
];

export const MOI_TABLE: TableEntry<{ label: string; modifierForInjuryCount: number; notes?: string[] }>[] = [
  { range: 2, value: { label: "Fall >10 ft", modifierForInjuryCount: 2, notes: ["High-risk MOI"] } },
  { range: 3, value: { label: "Fall 6–10 ft", modifierForInjuryCount: 1, notes: ["Moderate-risk MOI"] } },
  { range: 4, value: { label: "Fall <6 ft", modifierForInjuryCount: 0 } },
  { range: 5, value: { label: "Blunt trauma", modifierForInjuryCount: 1 } },
  { range: 6, value: { label: "Twisting injury", modifierForInjuryCount: -1 } },
  { range: 7, value: { label: "Trip / slip", modifierForInjuryCount: -1 } },
  { range: 8, value: { label: "Struck by object", modifierForInjuryCount: 1 } },
  { range: 9, value: { label: "Compression", modifierForInjuryCount: 2 } },
  { range: 10, value: { label: "High-speed mechanism", modifierForInjuryCount: 2 } },
  { range: 11, value: { label: "Multiple impacts", modifierForInjuryCount: 2 } },
  { range: 12, value: { label: "Unknown / unwitnessed", modifierForInjuryCount: 1, notes: ["Treat as higher risk until ruled out"] } },
];

export const MOI_DETAIL_SURFACE_TABLE: TableEntry<
  "rock" | "packed dirt" | "sand" | "snow" | "pavement" | "water" | "unknown"
>[] = [
  { range: 1, value: "rock" },
  { range: 2, value: "packed dirt" },
  { range: 3, value: "sand" },
  { range: 4, value: "snow" },
  { range: 5, value: "pavement" },
  { range: 6, value: "unknown" },
];

export const MOI_DETAIL_LANDING_TABLE: TableEntry<
  "feet" | "butt" | "back" | "side" | "head/face" | "multiple impacts" | "unknown"
>[] = [
  { range: 1, value: "feet" },
  { range: 2, value: "butt" },
  { range: 3, value: "back" },
  { range: 4, value: "side" },
  { range: 5, value: "head/face" },
  { range: 6, value: "multiple impacts" },
];

export const MOI_DETAIL_WITNESSED_TABLE: TableEntry<boolean>[] = [
  { range: 1, value: true },
  { range: 2, value: true },
  { range: 3, value: true },
  { range: 4, value: true },
  { range: 5, value: false },
  { range: 6, value: false },
];

export const MOI_DETAIL_HELMET_TABLE: TableEntry<boolean>[] = [
  { range: 1, value: true },
  { range: 2, value: true },
  { range: 3, value: true },
  { range: 4, value: false },
  { range: 5, value: false },
  { range: 6, value: false },
];

export const MOI_DETAIL_FALL_BAND_TABLE: TableEntry<{ min: number; max: number }>[] = [
  { range: 1, value: { min: 3, max: 5 } },
  { range: 2, value: { min: 4, max: 6 } },
  { range: 3, value: { min: 6, max: 8 } },
  { range: 4, value: { min: 8, max: 10 } },
  { range: 5, value: { min: 10, max: 15 } },
  { range: 6, value: { min: 15, max: 25 } },
];

export const MOI_DETAIL_SPEED_BAND_TABLE: TableEntry<{ min: number; max: number }>[] = [
  { range: 1, value: { min: 10, max: 15 } },
  { range: 2, value: { min: 15, max: 25 } },
  { range: 3, value: { min: 25, max: 35 } },
  { range: 4, value: { min: 35, max: 50 } },
  { range: 5, value: { min: 50, max: 70 } },
  { range: 6, value: { min: 0, max: 0 } }, // unknown
];

export const HIDDEN_INJURY_TABLE: TableEntry<InjuryType>[] = [
  { range: 2, value: "spinal instability" },
  { range: 3, value: "intracranial bleed" },
  { range: 4, value: "pelvic fracture" },
  { range: 5, value: "pneumothorax" },
  { range: 6, value: "internal bleeding" },
  { range: 7, value: "concussion" },
  { range: 8, value: "solid organ injury" },
  { range: 9, value: "femur fracture" },
  { range: 10, value: "rib fractures" },
  { range: 11, value: "multiple injuries" },
  { range: 12, value: "no serious injury" },
];

export function rollSetting(rng?: Rng) {
  return pickFrom2d6Table("Setting (2d6)", SETTING_TABLE, rng);
}
export function rollHazard(rng?: Rng) {
  return pickFrom1d6Table("Scene Hazard (1d6)", HAZARD_TABLE, rng);
}
export function rollPatient(rng?: Rng) {
  return pickFrom2d6Table("Patient Profile (2d6)", PATIENT_TABLE, rng);
}
export function rollMOI(rng?: Rng) {
  return pickFrom2d6Table("Mechanism of Injury (2d6)", MOI_TABLE, rng);
}
export function rollHiddenInjury(rng?: Rng) {
  return pickFrom2d6Table("Hidden Injury (2d6)", HIDDEN_INJURY_TABLE, rng);
}

export function rollMoiDetails(args: { moiLabel: string; moiModifier: number }, rng?: Rng) {
  const surface = pickFrom1d6Table("MOI Surface (1d6)", MOI_DETAIL_SURFACE_TABLE, rng);
  const landing = pickFrom1d6Table("MOI Landing (1d6)", MOI_DETAIL_LANDING_TABLE, rng);
  const witnessed = pickFrom1d6Table("MOI Witnessed? (1d6)", MOI_DETAIL_WITNESSED_TABLE, rng);
  const helmet = pickFrom1d6Table("Helmet? (1d6)", MOI_DETAIL_HELMET_TABLE, rng);

  let heightFt: number | undefined;
  let speedMph: number | undefined;

  const isFall = args.moiLabel.startsWith("Fall");
  const isHighSpeed = args.moiLabel.includes("High-speed");

  if (isFall) {
    // Use a band roll but nudge based on MOI label
    const band = pickFrom1d6Table("Fall Height Band (1d6)", MOI_DETAIL_FALL_BAND_TABLE, rng);
    let minFt = band.value.min;
    let maxFt = band.value.max;

    if (args.moiLabel.includes("<6")) {
      minFt = 3;
      maxFt = 6;
    } else if (args.moiLabel.includes("6–10")) {
      minFt = 6;
      maxFt = 10;
    } else if (args.moiLabel.includes(">10")) {
      minFt = 10;
      maxFt = 25;
    }

    const r = rng ? rng() : Math.random();
    heightFt = Math.round(minFt + (maxFt - minFt) * r);
  }

  if (isHighSpeed) {
    const band = pickFrom1d6Table("Speed Band (1d6)", MOI_DETAIL_SPEED_BAND_TABLE, rng);
    if (!(band.value.min === 0 && band.value.max === 0)) {
      const r = rng ? rng() : Math.random();
      speedMph = Math.round(band.value.min + (band.value.max - band.value.min) * r);
    }
  }

  // Base energy from MOI modifier, then bump based on landing/surface
  let energy: "low" | "moderate" | "high" =
    args.moiModifier >= 2 ? "high" : args.moiModifier === 1 ? "moderate" : "low";

  const bump = () => {
    if (energy === "low") energy = "moderate";
    else if (energy === "moderate") energy = "high";
  };

  if (landing.value === "head/face" || landing.value === "multiple impacts") bump();
  if (surface.value === "rock" || surface.value === "pavement") bump();

  const parts: string[] = [];
  if (isFall && heightFt) parts.push(`Fell ~${heightFt} ft`);
  else parts.push(args.moiLabel);

  parts.push(`onto ${surface.value}`);
  parts.push(`landed on ${landing.value}`);
  parts.push(witnessed.value ? "witnessed" : "unwitnessed");

  const narrative = parts.join(", ");

  return {
    details: {
      narrative,
      heightFt,
      speedMph,
      surface: surface.value,
      landing: landing.value,
      witnessed: witnessed.value,
      protectiveGear: { helmet: helmet.value },
      energy,
    },
    rolls: {
      surface: surface.roll,
      landing: landing.roll,
      witnessed: witnessed.roll,
      helmet: helmet.roll,
    },
  };
}

