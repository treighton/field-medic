import type { ScenarioPacket, Injury, TraumaInjuryType, MedicalConditionType, GradingHints } from "../types/scenario";
import { mulberry32, seedToNumber, type Rng } from "./dice";
import { rollSetting, rollHazard, rollPatient, rollMOI, rollMoiDetails } from "./tables";
import { rollHiddenInjuryCount } from "./injuryCount";
import { INJURY_EFFECTS } from "./injuryEffects";
import { MEDICAL_CONDITION_EFFECTS } from "./medicalConditionEffects";
import { generateVitalsTimeline } from "./generateVitalsTimeline";
import { generateEscalationLogic } from "./generateEscalation";
import { deriveMoiTags } from "./moiTags";
import { rollDistinctInjuriesWeighted } from "./injurySelection";
import { generateChiefComplaint } from "./chiefComplaint";
import { generateExpectedActions } from "./generateExpectedActions";
import { generateEndStates } from "./generateEndStates";
import { generateMedicalPresentation } from "./generateMedicalPresentation";

function randomId(prefix: string): string {
  const rand = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(rand).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}

function makeInjury(id: string, type: TraumaInjuryType | MedicalConditionType): Injury {
  const traumaEff = INJURY_EFFECTS[type as TraumaInjuryType];
  const medicalEff = MEDICAL_CONDITION_EFFECTS[type as MedicalConditionType];
  const eff = traumaEff || medicalEff;

  return {
    id,
    type,
    summary: eff.summary,
    discoverableFindings: eff.discoverableFindings,
    suggestedActions: eff.suggestedActions,
  };
}

export function generateScenarioPacket(opts?: { seed?: string; scenarioType?: "trauma" | "medical" }): ScenarioPacket {
  const seed = opts?.seed?.trim();
  const scenarioType = opts?.scenarioType ?? "trauma";
  const rng = seed ? mulberry32(seedToNumber(seed)) : Math.random;

  if (scenarioType === "medical") {
    return generateMedicalScenario(seed, rng);
  }

  return generateTraumaScenario(seed, rng);
}

function generateTraumaScenario(seed: string | undefined, rng: Rng): ScenarioPacket {
  const settingRoll = rollSetting(rng);
  const hazardRoll = rollHazard(rng);
  const patientRoll = rollPatient(rng);
  const moiRoll = rollMOI(rng);

  const moiDetails = rollMoiDetails(
    { moiLabel: moiRoll.value.label, moiModifier: moiRoll.value.modifierForInjuryCount },
    rng
  );

  const moi = {
    label: moiRoll.value.label,
    roll: moiRoll.roll,
    modifierForInjuryCount: moiRoll.value.modifierForInjuryCount,
    details: moiDetails.details,
  };

  const injuryCount = rollHiddenInjuryCount(moi.modifierForInjuryCount, rng);

  const patient = {
    type: patientRoll.value.type,
    cooperation: patientRoll.value.cooperation,
    notes: patientRoll.value.notes,
    roll: patientRoll.roll,
  };

  const tags = deriveMoiTags(moi, patient);
  const injuryTypes = rollDistinctInjuriesWeighted(injuryCount.injuryCount, tags, rng);
  const injuries: Injury[] = injuryTypes.map((t, idx) => makeInjury(`inj_${idx + 1}`, t as TraumaInjuryType));

  const cc = generateChiefComplaint({ tags, patient, injuries, rng });

  const vitalsTimeline = generateVitalsTimeline(injuries);

  const setting = {
    name: settingRoll.value.name,
    notes: settingRoll.value.notes,
    modifiers: settingRoll.value.modifiers,
    roll: settingRoll.roll,
  };

  const hazards = [{ name: hazardRoll.value.name }];

  const escalationLogic = generateEscalationLogic({ setting, moi, hazards, injuries });
  const expectedActions = generateExpectedActions(moi, injuries);
  const endStates = generateEndStates(moi, injuries);

  const gradingHints: GradingHints = {
    gradedFields: ["hr", "rr", "bp", "pupils", "skin", "lor"],
    notGradedNotes: ["Core temperature may be unavailable in wilderness contexts and should not affect grading."],
  };

  const now = new Date().toISOString();

  return {
    meta: {
      id: randomId("scenario"),
      createdAt: now,
      version: "1.0",
      generatorVersion: "prototype-0.1",
      scenarioType: "trauma",
      ...(seed ? { seedUsed: seed } : {}),
    },
    setting,
    hazards: [{ name: hazardRoll.value.name, notes: hazardRoll.value.notes, roll: hazardRoll.roll }],
    patient: {
      type: patientRoll.value.type,
      cooperation: patientRoll.value.cooperation,
      notes: patientRoll.value.notes,
      roll: patientRoll.roll,
    },
    chiefComplaint: cc.chiefComplaint,
    moi,
    injuryCount,
    hiddenInjuries: injuries,
    vitalsTimeline,
    expectedActions,
    escalationLogic,
    endStates,
    gradingHints,
    emtExtras: undefined,
  };
}

function generateMedicalScenario(seed: string | undefined, rng: Rng): ScenarioPacket {
  const settingRoll = rollSetting(rng);
  const hazardRoll = rollHazard(rng);
  const patientRoll = rollPatient(rng);

  // For medical scenarios, use a simple MOI-like structure representing "presentation location"
  const presentationLocations = [
    { label: "Hiking trail", notes: ["Remote access", "Limited supplies"] },
    { label: "Camping site", notes: ["Overnight stay", "Basic first aid available"] },
    { label: "Urban park", notes: ["Public area", "Quick evacuation possible"] },
    { label: "Remote wilderness", notes: ["Long evacuation", "Delayed help"] },
    { label: "Home/indoor", notes: ["Familiar setting", "Phone access possible"] },
  ];
  const locationIdx = Math.floor(rng() * presentationLocations.length);
  const location = presentationLocations[locationIdx];

  // Roll for which medical condition to generate
  const conditionTypes: MedicalConditionType[] = [
    "acute coronary syndrome",
    "stroke",
    "sepsis",
    "diabetic emergency",
    "severe dehydration",
    "asthma exacerbation",
    "anaphylaxis",
    "heat illness",
    "hypothermia",
    "acute abdomen",
  ];

  const conditionIdx = Math.floor(rng() * conditionTypes.length);
  const conditionType = conditionTypes[conditionIdx];

  const presentation = generateMedicalPresentation(conditionType, rng);

  const patient = {
    type: patientRoll.value.type,
    cooperation: patientRoll.value.cooperation,
    notes: patientRoll.value.notes,
    roll: patientRoll.roll,
  };

  // Create a pseudo-MOI for the medical scenario structure
  const moi = {
    label: location.label,
    roll: { kind: "dice" as const, label: "Presentation", sides: 6, count: 1, values: [conditionIdx + 1], total: conditionIdx + 1 },
    modifierForInjuryCount: 0,
    details: {
      narrative: `Patient presented while ${presentation.onsetTiming === "sudden" ? "suddenly experiencing" : "experiencing"} ${presentation.primaryComplaint.toLowerCase()}`,
      surface: "unknown" as const,
      landing: "unknown" as const,
      witnessed: true,
      energy: "moderate" as const,
    },
  };

  // Create the medical condition as an "injury" for the data structure
  const conditions: Injury[] = [makeInjury("cond_1", conditionType)];

  const now = new Date().toISOString();

  // Generate vitals timeline based on the condition
  const vitalsTimeline = generateVitalsTimeline(conditions);

  const setting = {
    name: settingRoll.value.name,
    notes: settingRoll.value.notes,
    modifiers: settingRoll.value.modifiers,
    roll: settingRoll.roll,
  };

  // Create chief complaint from medical presentation
  const ccStatement = `${presentation.primaryComplaint}${presentation.relatedSymptoms.length > 0 ? `. Also: ${presentation.relatedSymptoms.join(", ")}` : ""}`;

  // Generate escalation, expected actions, and end states
  const hazards = [{ name: hazardRoll.value.name }];
  const escalationLogic = generateEscalationLogic({ setting, moi, hazards, injuries: conditions });
  const expectedActions = generateExpectedActions(moi, conditions);
  const endStates = generateEndStates(moi, conditions);

  const gradingHints: GradingHints = {
    gradedFields: ["hr", "rr", "bp", "pupils", "skin", "lor"],
    notGradedNotes: ["Time-sensitive presentation; early recognition and rapid evacuation are critical."],
  };

  return {
    meta: {
      id: randomId("scenario"),
      createdAt: now,
      version: "1.0",
      generatorVersion: "prototype-0.1",
      scenarioType: "medical",
      ...(seed ? { seedUsed: seed } : {}),
    },
    setting,
    hazards: [{ name: hazardRoll.value.name, notes: hazardRoll.value.notes, roll: hazardRoll.roll }],
    patient,
    chiefComplaint: {
      statement: ccStatement,
      category: presentation.onsetTiming === "sudden" ? "general" : "general",
      reliability: patient.cooperation === "cooperative" ? "reliable" : "minimizes",
      isMisdirecting: false,
      roll: { kind: "dice" as const, label: "Chief Complaint", sides: 6, count: 1, values: [1], total: 1 },
      notes: [`Onset: ${presentation.onsetTiming}`],
    },
    moi,
    injuryCount: {
      roll: { kind: "rollWithModifier" as const, label: "Condition Count", baseRoll: { kind: "dice" as const, label: "Base", sides: 6, count: 1, values: [1], total: 1 }, modifier: 0, total: 1 },
      injuryCount: 1 as const,
      mappingRule: "Single medical condition presented",
    },
    hiddenInjuries: conditions,
    vitalsTimeline,
    expectedActions,
    escalationLogic,
    endStates,
    gradingHints,
    emtExtras: undefined,
  };
}
