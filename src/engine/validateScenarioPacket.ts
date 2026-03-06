import type { ScenarioPacket } from "../types/scenario";
import { LLMError } from "./llm";

const TRAUMA_INJURY_TYPES = new Set([
  "spinal instability", "intracranial bleed", "pelvic fracture", "pneumothorax",
  "internal bleeding", "concussion", "solid organ injury", "femur fracture",
  "rib fractures", "multiple injuries", "no serious injury",
]);

const MEDICAL_CONDITION_TYPES = new Set([
  "acute coronary syndrome", "stroke", "sepsis", "diabetic emergency",
  "severe dehydration", "asthma exacerbation", "anaphylaxis", "heat illness",
  "hypothermia", "acute abdomen", "no serious condition",
]);

const COOPERATION_VALUES = new Set(["cooperative", "anxious", "altered", "minimizes symptoms"]);
const CC_CATEGORY_VALUES = new Set(["pain", "neurologic", "respiratory", "general", "denial"]);
const CC_RELIABILITY_VALUES = new Set(["reliable", "minimizes", "confused"]);
const SURFACE_VALUES = new Set(["rock", "packed dirt", "sand", "snow", "pavement", "water", "unknown"]);
const LANDING_VALUES = new Set(["feet", "butt", "back", "side", "head/face", "multiple impacts", "unknown"]);
const ENERGY_VALUES = new Set(["low", "moderate", "high"]);
const PUPILS_VALUES = new Set(["PERRL", "unequal", "sluggish", "fixed/dilated", "not assessed"]);
const SKIN_VALUES = new Set(["warm/dry", "cool/clammy", "pale", "diaphoretic", "mottled", "not assessed"]);
const LOR_VALUES = new Set(["A&Ox4", "A&Ox3", "anxious", "confused", "lethargic", "unresponsive"]);
const SEVERITY_VALUES = new Set(["low", "medium", "high"]);
const VITALS_MINUTES = [0, 10, 20, 30];

export function validateScenarioPacket(data: unknown): ScenarioPacket {
  if (typeof data !== "object" || data === null) {
    throw new LLMError("Response is not a JSON object");
  }
  const d = data as Record<string, unknown>;
  const errors: string[] = [];

  // meta
  const meta = d.meta as Record<string, unknown> | undefined;
  if (!meta) errors.push("missing meta");
  else {
    if (!meta.id) errors.push("meta.id missing");
    if (!meta.createdAt) errors.push("meta.createdAt missing");
    if (meta.scenarioType !== "trauma" && meta.scenarioType !== "medical") errors.push("meta.scenarioType invalid");
  }

  // setting
  if (!d.setting || typeof (d.setting as any).name !== "string") errors.push("setting.name missing");

  // hazards
  if (!Array.isArray(d.hazards) || d.hazards.length === 0) errors.push("hazards must be non-empty array");

  // patient
  const patient = d.patient as Record<string, unknown> | undefined;
  if (!patient) errors.push("patient missing");
  else {
    if (typeof patient.age !== "number") errors.push("patient.age must be number");
    // Coerce common LLM hallucinations for cooperation
    if (patient.cooperation === "confused") patient.cooperation = "altered";
    if (patient.cooperation === "uncooperative") patient.cooperation = "altered";
    if (patient.cooperation === "combative") patient.cooperation = "altered";
    if (patient.cooperation === "minimizing") patient.cooperation = "minimizes symptoms";
    if (patient.cooperation === "minimizing symptoms") patient.cooperation = "minimizes symptoms";
    if (!COOPERATION_VALUES.has(patient.cooperation as string)) errors.push(`patient.cooperation invalid: ${patient.cooperation}`);
  }

  // chiefComplaint
  const cc = d.chiefComplaint as Record<string, unknown> | undefined;
  if (!cc) errors.push("chiefComplaint missing");
  else {
    if (typeof cc.statement !== "string") errors.push("chiefComplaint.statement missing");
    if (!CC_CATEGORY_VALUES.has(cc.category as string)) errors.push(`chiefComplaint.category invalid: ${cc.category}`);
    if (!CC_RELIABILITY_VALUES.has(cc.reliability as string)) errors.push(`chiefComplaint.reliability invalid: ${cc.reliability}`);
    if (typeof cc.isMisdirecting !== "boolean") errors.push("chiefComplaint.isMisdirecting must be boolean");
  }

  // moi
  const moi = d.moi as Record<string, unknown> | undefined;
  if (!moi) errors.push("moi missing");
  else {
    if (typeof moi.label !== "string") errors.push("moi.label missing");
    const details = moi.details as Record<string, unknown> | undefined;
    if (!details) errors.push("moi.details missing");
    else {
      if (!SURFACE_VALUES.has(details.surface as string)) errors.push(`moi.details.surface invalid: ${details.surface}`);
      if (!LANDING_VALUES.has(details.landing as string)) errors.push(`moi.details.landing invalid: ${details.landing}`);
      if (!ENERGY_VALUES.has(details.energy as string)) errors.push(`moi.details.energy invalid: ${details.energy}`);
      if (typeof details.witnessed !== "boolean") errors.push("moi.details.witnessed must be boolean");
    }
  }

  // injuryCount
  const injuryCount = d.injuryCount as Record<string, unknown> | undefined;
  if (!injuryCount) errors.push("injuryCount missing");
  else {
    const count = injuryCount.injuryCount;
    if (count !== 0 && count !== 1 && count !== 2 && count !== 3) errors.push(`injuryCount.injuryCount must be 0-3, got: ${count}`);
  }

  // hiddenInjuries
  const hiddenInjuries = d.hiddenInjuries as unknown[] | undefined;
  if (!Array.isArray(hiddenInjuries)) {
    errors.push("hiddenInjuries must be array");
  } else {
    const scenarioType = meta?.scenarioType as string;
    for (let i = 0; i < hiddenInjuries.length; i++) {
      const inj = hiddenInjuries[i] as Record<string, unknown>;
      const validType = scenarioType === "medical"
        ? MEDICAL_CONDITION_TYPES.has(inj.type as string)
        : TRAUMA_INJURY_TYPES.has(inj.type as string);
      if (!validType) errors.push(`hiddenInjuries[${i}].type invalid: "${inj.type}"`);
    }
    const injCount = (injuryCount as any)?.injuryCount;
    if (typeof injCount === "number" && injCount !== hiddenInjuries.length) {
      errors.push(`injuryCount.injuryCount (${injCount}) does not match hiddenInjuries.length (${hiddenInjuries.length})`);
    }
  }

  // vitalsTimeline
  const vitalsTimeline = d.vitalsTimeline as unknown[] | undefined;
  if (!Array.isArray(vitalsTimeline) || vitalsTimeline.length !== 4) {
    errors.push(`vitalsTimeline must have exactly 4 entries, got ${Array.isArray(vitalsTimeline) ? vitalsTimeline.length : "non-array"}`);
  } else {
    for (let i = 0; i < vitalsTimeline.length; i++) {
      const tp = vitalsTimeline[i] as Record<string, unknown>;
      if (tp.minutes !== VITALS_MINUTES[i]) errors.push(`vitalsTimeline[${i}].minutes must be ${VITALS_MINUTES[i]}, got ${tp.minutes}`);
      const v = tp.vitals as Record<string, unknown> | undefined;
      if (!v) { errors.push(`vitalsTimeline[${i}].vitals missing`); continue; }
      if (typeof v.hr !== "number" || v.hr < 30 || v.hr > 200) errors.push(`vitalsTimeline[${i}].vitals.hr out of range: ${v.hr}`);
      if (typeof v.rr !== "number" || v.rr < 4 || v.rr > 50) errors.push(`vitalsTimeline[${i}].vitals.rr out of range: ${v.rr}`);
      if (!PUPILS_VALUES.has(v.pupils as string)) errors.push(`vitalsTimeline[${i}].vitals.pupils invalid: ${v.pupils}`);
      if (!SKIN_VALUES.has(v.skin as string)) errors.push(`vitalsTimeline[${i}].vitals.skin invalid: ${v.skin}`);
      if (!LOR_VALUES.has(v.lor as string)) errors.push(`vitalsTimeline[${i}].vitals.lor invalid: ${v.lor}`);
      const bp = v.bp as Record<string, unknown> | undefined;
      if (!bp || (bp.kind !== "bp" && bp.kind !== "radialPulse")) errors.push(`vitalsTimeline[${i}].vitals.bp invalid`);
    }
  }

  // expectedActions
  const actions = d.expectedActions as unknown[] | undefined;
  if (!Array.isArray(actions) || actions.length < 4) errors.push("expectedActions must be array with at least 4 items");

  // escalationLogic
  const escalation = d.escalationLogic as unknown[] | undefined;
  if (!Array.isArray(escalation) || escalation.length === 0) errors.push("escalationLogic must be non-empty array");
  else {
    for (let i = 0; i < escalation.length; i++) {
      const t = escalation[i] as Record<string, unknown>;
      if (!SEVERITY_VALUES.has(t.severity as string)) errors.push(`escalationLogic[${i}].severity invalid: ${t.severity}`);
    }
  }

  // endStates
  const endStates = d.endStates as unknown[] | undefined;
  if (!Array.isArray(endStates) || endStates.length !== 3) {
    errors.push(`endStates must have exactly 3 entries, got ${Array.isArray(endStates) ? endStates.length : "non-array"}`);
  } else {
    const names = endStates.map((s) => (s as any).name as string);
    for (const name of ["Optimal", "Marginal", "Failure"] as const) {
      if (!names.includes(name)) errors.push(`endStates missing "${name}" entry`);
    }
  }

  if (errors.length > 0) {
    throw new LLMError(`ScenarioPacket validation failed:\n• ${errors.join("\n• ")}`);
  }

  // Patch: ensure emtExtras is present
  if (!("emtExtras" in d)) (d as any).emtExtras = undefined;

  return d as unknown as ScenarioPacket;
}
