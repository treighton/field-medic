import type { ChiefComplaint, Injury, InjuryType, PatientProfile } from "../types/scenario";
import type { Rng } from "./dice";
import { rollDice } from "./dice";
import { weightedPick } from "./weightedPick";
import type { MoiTags } from "./moiTags";

type CcId =
  | "backPain"
  | "pelvisPain"
  | "headacheNausea"
  | "dizzyOffBalance"
  | "dontRemember"
  | "sobOnExertion"
  | "chestPainBreathing"
  | "weakShaky"
  | "fineJustSore"
  | "tweakedSomething"
  | "wantToKeepGoing"
  | "coldShaky"
  | "handHurts";

const CC_LIBRARY: Record<
  CcId,
  Omit<ChiefComplaint, "reliability" | "isMisdirecting" | "roll" | "intendedToMask">
> = {
  backPain: { statement: "My lower back hurts when I try to move", category: "pain" },
  pelvisPain: { statement: "My hip or pelvis hurts a lot", category: "pain" },
  headacheNausea: { statement: "My head hurts and I feel nauseous", category: "neurologic" },
  dizzyOffBalance: { statement: "I feel really dizzy and off balance", category: "neurologic" },
  dontRemember: { statement: "I don’t remember exactly what happened", category: "neurologic" },
  sobOnExertion: { statement: "I’m short of breath when I move", category: "respiratory" },
  chestPainBreathing: { statement: "My chest hurts when I breathe deeply", category: "respiratory" },
  weakShaky: { statement: "I just feel weak and shaky", category: "general" },
  fineJustSore: { statement: "I’m fine — I’m just sore", category: "denial", notes: ["May be minimizing symptoms"] },
  tweakedSomething: { statement: "I just tweaked something — it’s not a big deal", category: "denial", notes: ["May be minimizing symptoms"] },
  wantToKeepGoing: { statement: "I’m okay — can we just keep going?", category: "denial", notes: ["May resist assessment or evacuation"] },
  coldShaky: { statement: "I’m just cold and kind of shaky", category: "general", notes: ["Could be exposure or early shock; reassess and trend vitals"] },
  handHurts: { statement: "My hand hurts — I think I scraped it", category: "pain", notes: ["Distracting minor complaint possible"] },
};

function baseReliability(patient: PatientProfile): ChiefComplaint["reliability"] {
  if (patient.cooperation === "altered") return "confused";
  if (patient.cooperation === "minimizes symptoms") return "minimizes";
  return "reliable";
}

function hasType(injuries: Injury[], type: InjuryType): boolean {
  return injuries.some((i) => i.type === type);
}

export function pickMaskedInjuryType(injuries: Injury[]): InjuryType | undefined {
  const priority: InjuryType[] = [
    "internal bleeding",
    "solid organ injury",
    "pelvic fracture",
    "intracranial bleed",
    "pneumothorax",
    "spinal instability",
    "multiple injuries",
    "concussion",
    "rib fractures",
    "femur fracture",
  ];
  for (const t of priority) if (hasType(injuries, t)) return t;
  return injuries[0]?.type;
}

export function computeMisdirectionChance(tags: MoiTags, injuries: Injury[]): number {
  let chance = 20;

  if (tags.cooperation === "minimizes symptoms") chance += 25;
  if (tags.cooperation === "altered") chance += 20;
  if (!tags.witnessed) chance += 15;
  if (tags.energy === "high") chance += 10;

  if (hasType(injuries, "internal bleeding") || hasType(injuries, "solid organ injury") || hasType(injuries, "pelvic fracture")) chance += 15;
  if (hasType(injuries, "intracranial bleed")) chance += 15;
  if (hasType(injuries, "pneumothorax")) chance += 10;

  return Math.max(0, Math.min(80, chance));
}

export function rollMisdirection(chancePercent: number, rng: Rng = Math.random) {
  const roll = rollDice(1, 100, "Chief Complaint Misdirection (1d100)", rng);
  const isMisdirecting = roll.total <= chancePercent;
  return { roll, isMisdirecting };
}

function trueCcWeights(tags: MoiTags, injuries: Injury[]): Record<CcId, number> {
  const w: Record<CcId, number> = {
    backPain: 1,
    pelvisPain: 1,
    headacheNausea: 1,
    dizzyOffBalance: 1,
    dontRemember: 1,
    sobOnExertion: 1,
    chestPainBreathing: 1,
    weakShaky: 1,
    fineJustSore: 0,
    tweakedSomething: 0,
    wantToKeepGoing: 0,
    coldShaky: 0,
    handHurts: 0,
  };

  // Tag-driven
  if (tags.landing === "butt" || tags.landing === "back") {
    w.backPain += 4;
    w.pelvisPain += 3;
  }
  if (tags.landing === "head/face" || tags.landing === "multiple impacts") {
    w.headacheNausea += 4;
    w.dizzyOffBalance += 3;
    w.dontRemember += 2;
  }
  if (tags.energy === "high") {
    w.weakShaky += 2;
  }
  if (!tags.witnessed) {
    w.dontRemember += 3;
    w.dizzyOffBalance += 1;
  }
  if (tags.surface === "rock" || tags.surface === "pavement") {
    w.backPain += 1;
    w.headacheNausea += 1;
  }
  if (tags.helmet === false) {
    w.headacheNausea += 2;
    w.dontRemember += 1;
  }

  // Injury-driven
  if (hasType(injuries, "pelvic fracture")) w.pelvisPain += 6;
  if (hasType(injuries, "spinal instability")) w.backPain += 5;
  if (hasType(injuries, "intracranial bleed") || hasType(injuries, "concussion")) {
    w.headacheNausea += 5;
    w.dizzyOffBalance += 3;
    w.dontRemember += 2;
  }
  if (hasType(injuries, "pneumothorax")) {
    w.sobOnExertion += 5;
    w.chestPainBreathing += 4;
  }
  if (hasType(injuries, "rib fractures")) {
    w.chestPainBreathing += 4;
  }
  if (hasType(injuries, "internal bleeding") || hasType(injuries, "solid organ injury")) {
    w.weakShaky += 4;
    w.coldShaky += 1;
  }

  return w;
}

function misdirectionCcWeights(tags: MoiTags): Record<CcId, number> {
  const w: Record<CcId, number> = {
    fineJustSore: 6,
    tweakedSomething: 5,
    wantToKeepGoing: 5,
    handHurts: 3,
    coldShaky: 2,
    weakShaky: 1,
    backPain: 0,
    pelvisPain: 0,
    headacheNausea: 0,
    dizzyOffBalance: 0,
    dontRemember: 0,
    sobOnExertion: 0,
    chestPainBreathing: 0,
  };

  if (tags.cooperation === "minimizes symptoms") {
    w.wantToKeepGoing += 3;
    w.fineJustSore += 2;
    w.tweakedSomething += 2;
  }
  if (tags.cooperation === "altered") {
    w.coldShaky += 3;
    w.weakShaky += 3;
    w.fineJustSore = Math.max(0, w.fineJustSore - 2);
    w.wantToKeepGoing = Math.max(0, w.wantToKeepGoing - 2);
  }
  if (tags.energy === "high") {
    w.wantToKeepGoing += 2;
  }

  return w;
}

export function generateChiefComplaint(args: {
  tags: MoiTags;
  patient: PatientProfile;
  injuries: Injury[];
  rng: Rng;
}) {
  const { tags, patient, injuries, rng } = args;

  const chance = computeMisdirectionChance(tags, injuries);
  const mis = rollMisdirection(chance, rng);

  const reliability = baseReliability(patient);
  const masked = mis.isMisdirecting ? pickMaskedInjuryType(injuries) : undefined;

  const truePick = weightedPick(trueCcWeights(tags, injuries), "Chief Complaint (true)", rng);
  const trueCc = CC_LIBRARY[truePick.picked];

  let finalCc = trueCc;
  let finalReliability: ChiefComplaint["reliability"] = reliability;
  const notes: string[] = [];

  if (mis.isMisdirecting) {
    const swapRoll = rng();
    if (swapRoll < 0.7) {
      const misPick = weightedPick(misdirectionCcWeights(tags), "Chief Complaint (misdirection)", rng);
      finalCc = CC_LIBRARY[misPick.picked];
      notes.push("Chief complaint may be minimizing or distracting relative to risk.");
      if (finalCc.category === "denial") finalReliability = "minimizes";
      if (tags.cooperation === "altered") finalReliability = "confused";
    } else {
      notes.push("Answers are vague or minimizing; trust objective findings and trends.");
      if (finalReliability === "reliable") finalReliability = tags.cooperation === "altered" ? "confused" : "minimizes";
    }
  }

  const roll = rollDice(1, 6, "Chief Complaint (summary roll 1d6)", rng);

  const chiefComplaint: ChiefComplaint = {
    ...finalCc,
    reliability: finalReliability,
    isMisdirecting: mis.isMisdirecting,
    intendedToMask: masked,
    roll,
    notes: (finalCc.notes ?? []).concat(notes),
  };

  return { chiefComplaint, misdirection: { chancePercent: chance, roll: mis.roll } };
}
