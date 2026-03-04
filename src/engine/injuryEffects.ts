import type { TraumaInjuryType, WildernessVitals, EscalationTrigger } from "../types/scenario";

export type VitalsDelta = Partial<{
  hr: number;
  rr: number;
  bpSystolic: number;
  bpDiastolic: number;
  pupils: WildernessVitals["pupils"];
  skin: WildernessVitals["skin"];
  lor: WildernessVitals["lor"];
  bloodGlucose: number;
}>;

export type InjuryEffect = {
  type: TraumaInjuryType;
  summary: string;
  discoverableFindings: string[];
  suggestedActions: string[];
  deltasByMinutes: Record<10 | 20 | 30, VitalsDelta>;
  triggers: Array<Omit<EscalationTrigger, "id">>;
};

const t = (
  severity: "low" | "medium" | "high",
  description: string,
  condition: string,
  consequence: string,
  timeWindow?: "immediate" | "over time" | "10+ min" | "20+ min"
) => ({ severity, description, condition, consequence, timeWindow });

export const INJURY_EFFECTS: Record<TraumaInjuryType, InjuryEffect> = {
  "spinal instability": {
    type: "spinal instability",
    summary: "Potential unstable spinal injury with movement-sensitive neuro risk.",
    discoverableFindings: [
      "Concerning MOI; midline tenderness possible",
      "Pain with movement, possible paresthesia or weakness if worsens",
    ],
    suggestedActions: [
      "Spine precautions (manual stabilization / minimize movement)",
      "Neuro check (CMS) x4",
      "Avoid unnecessary movement; plan evacuation",
    ],
    deltasByMinutes: {
      10: { hr: +4, lor: "anxious" },
      20: { hr: +8, lor: "anxious" },
      30: { hr: +10, lor: "confused" },
    },
    triggers: [
      t("high", "Movement worsens neurologic status", "If spine precautions are not maintained and the patient moves", "New numbness/weakness or worsening pain; evacuation becomes urgent", "immediate"),
      t("medium", "Pain/anxiety escalates", "If movement and reassurance are not managed", "Patient becomes harder to assess and may attempt to stand", "10+ min"),
    ],
  },

  "intracranial bleed": {
    type: "intracranial bleed",
    summary: "Head injury with potentially delayed mental status and pupil changes.",
    discoverableFindings: [
      "Headache, nausea/vomiting",
      "Worsening confusion or lethargy",
      "Pupil changes may appear later",
    ],
    suggestedActions: [
      "Neuro assessment (mental status, pupils)",
      "Frequent reassessment",
      "Avoid re-injury; plan evacuation early",
    ],
    deltasByMinutes: {
      10: { lor: "anxious" },
      20: { lor: "confused", pupils: "sluggish" },
      30: { lor: "lethargic", pupils: "unequal" },
    },
    triggers: [
      t("high", "Delayed deterioration", "If neuro status is not reassessed", "Subtle decline is missed; patient becomes altered", "20+ min"),
      t("medium", "Vomiting risk", "If patient is supine and nausea develops", "Aspiration risk; airway priorities increase", "10+ min"),
    ],
  },

  "pelvic fracture": {
    type: "pelvic fracture",
    summary: "Pelvic injury with risk of internal bleeding; may look stable initially.",
    discoverableFindings: [
      "Pelvic pain, pain with movement/weight bearing",
      "Early compensated shock signs over time",
    ],
    suggestedActions: [
      "Initial vitals + repeat vitals (trend)",
      "Gentle pelvis assessment once; avoid repeated checks",
      "Treat for shock (warmth, minimal movement)",
      "Early evacuation decision",
    ],
    deltasByMinutes: {
      10: { hr: +12, bpSystolic: -8, bpDiastolic: -4, skin: "pale", lor: "anxious" },
      20: { hr: +24, bpSystolic: -18, bpDiastolic: -10, skin: "cool/clammy", lor: "confused" },
      30: { hr: +34, bpSystolic: -30, bpDiastolic: -18, skin: "cool/clammy", lor: "lethargic" },
    },
    triggers: [
      t("high", "Occult shock progression", "If vitals are not repeated", "Deterioration is missed until collapse symptoms appear", "20+ min"),
      t("medium", "Movement worsens perfusion", "If patient repeatedly stands/walks", "Dizziness/near syncope may occur sooner", "10+ min"),
    ],
  },

  "pneumothorax": {
    type: "pneumothorax",
    summary: "Chest injury with progressive breathing difficulty over time.",
    discoverableFindings: [
      "Increasing shortness of breath",
      "Chest pain, worse with breathing",
      "RR increases; anxiety increases",
    ],
    suggestedActions: [
      "Expose and assess chest",
      "Monitor breathing; repeat vitals",
      "Minimize exertion; plan evacuation",
    ],
    deltasByMinutes: {
      10: { rr: +4, lor: "anxious" },
      20: { rr: +8, hr: +10, skin: "diaphoretic", lor: "confused" },
      30: { rr: +12, hr: +18, skin: "cool/clammy", lor: "lethargic" },
    },
    triggers: [
      t("high", "Respiratory compromise progresses", "If breathing is not reassessed", "Patient becomes significantly dyspneic; urgent evacuation needed", "20+ min"),
      t("medium", "Exertion worsens breathing", "If patient walks or is stressed", "Symptoms worsen faster; RR rises", "10+ min"),
    ],
  },

  "internal bleeding": {
    type: "internal bleeding",
    summary: "Internal hemorrhage with compensated shock evolving over time.",
    discoverableFindings: [
      "MOI concerning; pain may be vague",
      "Pale/cool skin; dizziness develops",
      "HR rises; BP eventually drops",
    ],
    suggestedActions: [
      "Treat for shock (warmth, minimal movement)",
      "Early evacuation plan",
      "Repeat vitals to catch trends",
    ],
    deltasByMinutes: {
      10: { hr: +10, bpSystolic: -6, skin: "pale", lor: "anxious" },
      20: { hr: +22, bpSystolic: -16, skin: "cool/clammy", lor: "confused" },
      30: { hr: +34, bpSystolic: -28, skin: "cool/clammy", lor: "lethargic" },
    },
    triggers: [
      t("high", "Shock becomes apparent late", "If vitals trending is missed", "Patient becomes altered/dizzy; collapse risk rises", "20+ min"),
      t("medium", "Cold stress worsens perfusion", "If patient not kept warm", "Skin becomes cool/clammy earlier", "10+ min"),
    ],
  },

  "concussion": {
    type: "concussion",
    summary: "Mild TBI with headache, nausea, and possible confusion.",
    discoverableFindings: [
      "Headache, nausea, light sensitivity",
      "Memory gaps or slowed responses",
    ],
    suggestedActions: [
      "Neuro check (LOR/pupils)",
      "Reassessment; avoid continued activity",
    ],
    deltasByMinutes: {
      10: { lor: "anxious" },
      20: { lor: "confused" },
      30: { lor: "confused", pupils: "sluggish" },
    },
    triggers: [
      t("medium", "Symptoms worsen with stimulation", "If patient continues activity", "Headache and confusion worsen; evacuation more likely", "10+ min"),
      t("medium", "Vomiting", "If nausea progresses", "Airway and positioning considerations", "20+ min"),
    ],
  },

  "solid organ injury": {
    type: "solid organ injury",
    summary: "Blunt abdominal injury with internal bleeding risk.",
    discoverableFindings: [
      "Abdominal pain/tenderness",
      "Shock signs over time",
    ],
    suggestedActions: [
      "Gentle abdominal assessment",
      "Treat for shock; early evacuation",
      "Repeat vitals",
    ],
    deltasByMinutes: {
      10: { hr: +8, bpSystolic: -4, skin: "pale", lor: "anxious" },
      20: { hr: +18, bpSystolic: -12, skin: "cool/clammy", lor: "confused" },
      30: { hr: +28, bpSystolic: -22, skin: "cool/clammy", lor: "lethargic" },
    },
    triggers: [
      t("high", "Deterioration without external bleeding", "If internal bleed not considered", "Evacuation delayed; patient worsens", "20+ min"),
      t("medium", "Movement increases pain", "If patient walks/stands frequently", "Pain increases; dizziness may develop", "10+ min"),
    ],
  },

  "femur fracture": {
    type: "femur fracture",
    summary: "Large bone fracture with significant pain and possible blood loss.",
    discoverableFindings: [
      "Severe thigh pain, deformity",
      "Difficulty weight bearing",
      "Shock signs possible",
    ],
    suggestedActions: [
      "Expose and assess limb; CMS",
      "Immobilize/splint",
      "Treat for shock; repeat vitals",
    ],
    deltasByMinutes: {
      10: { hr: +10, skin: "pale", lor: "anxious" },
      20: { hr: +20, bpSystolic: -10, skin: "cool/clammy", lor: "confused" },
      30: { hr: +28, bpSystolic: -18, skin: "cool/clammy", lor: "lethargic" },
    },
    triggers: [
      t("medium", "Pain-driven movement", "If limb not immobilized", "Pain increases; assessment becomes harder", "10+ min"),
      t("high", "Shock risk", "If vitals not trended", "Deterioration missed", "20+ min"),
    ],
  },

  "rib fractures": {
    type: "rib fractures",
    summary: "Painful breathing and splinting; risk of respiratory decline.",
    discoverableFindings: [
      "Chest wall tenderness",
      "Pain with deep breaths",
      "RR may increase over time",
    ],
    suggestedActions: [
      "Assess breathing and chest wall",
      "Repeat vitals; decide evacuation if worsening",
    ],
    deltasByMinutes: {
      10: { rr: +2, lor: "anxious" },
      20: { rr: +4, hr: +6, skin: "diaphoretic" },
      30: { rr: +6, hr: +10, skin: "cool/clammy", lor: "confused" },
    },
    triggers: [
      t("medium", "Breathing becomes shallow", "If reassessment skipped", "RR rises; fatigue develops", "20+ min"),
      t("medium", "Complication concern", "If symptoms worsen disproportionately", "Consider complication; evacuate sooner", "20+ min"),
    ],
  },

  "multiple injuries": {
    type: "multiple injuries",
    summary: "More than one injury pattern; treat as higher risk with broad reassessment.",
    discoverableFindings: [
      "Mixed symptoms; more than one painful area",
      "Vague but concerning trends",
    ],
    suggestedActions: [
      "Head-to-toe exam",
      "Repeat vitals frequently",
      "Early evacuation decision",
    ],
    deltasByMinutes: {
      10: { hr: +14, rr: +2, skin: "pale", lor: "anxious" },
      20: { hr: +28, rr: +6, bpSystolic: -14, skin: "cool/clammy", lor: "confused" },
      30: { hr: +40, rr: +10, bpSystolic: -26, skin: "cool/clammy", lor: "lethargic" },
    },
    triggers: [
      t("high", "Rapid cumulative deterioration", "If reassessment is delayed", "Trends worsen faster; evacuation becomes urgent", "10+ min"),
      t("medium", "Missed injury", "If head-to-toe and CMS checks are skipped", "Important findings remain hidden", "over time"),
    ],
  },

  "no serious injury": {
    type: "no serious injury",
    summary: "No significant hidden injury; scenario emphasizes process and cautious decisions.",
    discoverableFindings: [
      "Normal vitals over time",
      "Pain remains mild/moderate and localized",
    ],
    suggestedActions: [
      "Focused exam",
      "Reassess; determine safe disposition",
    ],
    deltasByMinutes: {
      10: {},
      20: {},
      30: {},
    },
    triggers: [
      t("low", "Overconfidence risk", "If MOI is ignored", "Missed opportunity to demonstrate cautious assessment", "immediate"),
      t("low", "Environmental exposure", "If patient left exposed", "Cold/heat stress can create secondary problems", "over time"),
    ],
  },
};
