import type { MedicalConditionType, WildernessVitals, EscalationTrigger } from "../types/scenario";

export type VitalsDelta = Partial<{
  hr: number;
  rr: number;
  bpSystolic: number;
  bpDiastolic: number;
  pupils: WildernessVitals["pupils"];
  skin: WildernessVitals["skin"];
  lor: WildernessVitals["lor"];
}>;

export type MedicalConditionEffect = {
  type: MedicalConditionType;
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

export const MEDICAL_CONDITION_EFFECTS: Record<MedicalConditionType, MedicalConditionEffect> = {
  "acute coronary syndrome": {
    type: "acute coronary syndrome",
    summary: "Cardiac chest pain/pressure; risk of deterioration or arrhythmia.",
    discoverableFindings: [
      "Chest pain, pressure, or heaviness",
      "Pain radiating to arm/jaw/back",
      "Anxiety, dyspnea, diaphoresis",
    ],
    suggestedActions: [
      "Calm environment; position of comfort",
      "Monitor vitals closely",
      "Urgent evacuation",
    ],
    deltasByMinutes: {
      10: { hr: +12, rr: +2, skin: "diaphoretic", lor: "anxious" },
      20: { hr: +18, rr: +4, bpSystolic: -8, skin: "cool/clammy", lor: "confused" },
      30: { hr: +24, rr: +6, bpSystolic: -14, skin: "pale", lor: "lethargic" },
    },
    triggers: [
      t("high", "Cardiac compromise", "If pain worsens or vital changes occur", "Patient deteriorates; risk of collapse", "10+ min"),
      t("high", "Arrhythmia risk", "If patient is stressed or exerted", "Heart rate/rhythm deteriorates; emergency evacuation", "immediate"),
    ],
  },

  "stroke": {
    type: "stroke",
    summary: "Acute neuro deficit with time-critical intervention needs.",
    discoverableFindings: [
      "Facial droop, arm weakness, or speech difficulty",
      "Time-critical window for intervention",
      "Risk of further deterioration",
    ],
    suggestedActions: [
      "Exact time of symptom onset",
      "Neuro checks (NIHSS or wilderness equivalent)",
      "Urgent evacuation; call ahead",
    ],
    deltasByMinutes: {
      10: { lor: "confused", pupils: "sluggish" },
      20: { lor: "lethargic", pupils: "unequal", rr: +2, hr: +6 },
      30: { lor: "unresponsive", pupils: "fixed/dilated", rr: +4, hr: +10 },
    },
    triggers: [
      t("high", "Rapid deterioration", "If neuro status declines further", "Airway/breathing risk; intubation capability may be needed", "10+ min"),
      t("high", "Time window loss", "If evacuation is delayed beyond golden period", "Thrombolytic/thrombectomy options fade", "immediate"),
    ],
  },

  "sepsis": {
    type: "sepsis",
    summary: "Infection with systemic inflammation; gradual but serious deterioration.",
    discoverableFindings: [
      "Fever/chills, possibly hypotension",
      "Tachycardia, tachypnea early",
      "May have localized infection signs (wound, UTI, etc.)",
    ],
    suggestedActions: [
      "Identify source; assess for fever/chills",
      "Warm environment, fluids if available",
      "Monitor vitals; plan evacuation",
    ],
    deltasByMinutes: {
      10: { hr: +8, rr: +2, skin: "diaphoretic", lor: "anxious" },
      20: { hr: +16, rr: +4, bpSystolic: -10, skin: "cool/clammy", lor: "confused" },
      30: { hr: +24, rr: +6, bpSystolic: -20, skin: "mottled", lor: "lethargic" },
    },
    triggers: [
      t("medium", "Progressive shock", "If fluids are unavailable or vital decline continues", "Hypotension deepens; altered mental status worsens", "20+ min"),
      t("medium", "Source worsens", "If infection source (wound, etc.) is not addressed", "Systemic signs accelerate", "over time"),
    ],
  },

  "diabetic emergency": {
    type: "diabetic emergency",
    summary: "Hypoglycemia or hyperglycemic crisis; mental status risk.",
    discoverableFindings: [
      "Altered mental status, confusion, slurred speech",
      "Tachycardia, diaphoresis (hypoglycemia) or Kussmaul breathing (DKA)",
      "History of diabetes or insulin use",
    ],
    suggestedActions: [
      "Blood glucose check if available",
      "If hypoglycemic and able to swallow: sugar/carbs",
      "Monitor mental status; plan evacuation",
    ],
    deltasByMinutes: {
      10: { hr: +10, rr: +2, skin: "diaphoretic", lor: "confused" },
      20: { hr: +14, rr: +6, skin: "cool/clammy", lor: "lethargic" },
      30: { hr: +18, rr: +10, lor: "unresponsive" },
    },
    triggers: [
      t("high", "Unresponsiveness", "If mental status continues to decline", "Seizure or coma risk; advanced airway considerations", "10+ min"),
      t("medium", "Delayed sugar administration", "If hypoglycemia not treated promptly", "Deterioration accelerates; irreversible damage risk", "10+ min"),
    ],
  },

  "severe dehydration": {
    type: "severe dehydration",
    summary: "Volume depletion with compensatory tachycardia and shock risk.",
    discoverableFindings: [
      "Weakness, dizziness, dry mucous membranes",
      "Tachycardia, mild hypotension",
      "History of inadequate fluid intake",
    ],
    suggestedActions: [
      "Encourage PO fluids if alert; monitor toleration",
      "Shade/cool environment",
      "Repeat vitals; plan evacuation if severe",
    ],
    deltasByMinutes: {
      10: { hr: +12, bpSystolic: -6, lor: "anxious" },
      20: { hr: +20, bpSystolic: -14, skin: "pale", lor: "confused" },
      30: { hr: +28, bpSystolic: -22, skin: "cool/clammy", lor: "lethargic" },
    },
    triggers: [
      t("medium", "Shock progression", "If fluid intake is not possible", "Hypotension deepens; altered mental status", "20+ min"),
      t("low", "Environmental worsening", "If patient remains in sun/heat without shelter", "Dehydration and temperature stress compound", "over time"),
    ],
  },

  "asthma exacerbation": {
    type: "asthma exacerbation",
    summary: "Acute airway narrowing with dyspnea and potential respiratory failure.",
    discoverableFindings: [
      "Dyspnea, wheezing, chest tightness",
      "Tachypnea, accessory muscle use",
      "History of asthma",
    ],
    suggestedActions: [
      "Upright position; calm reassurance",
      "Rescue inhaler if available",
      "Oxygen if available; monitor breathing",
    ],
    deltasByMinutes: {
      10: { rr: +6, hr: +8, lor: "anxious" },
      20: { rr: +12, hr: +14, skin: "diaphoretic", lor: "confused" },
      30: { rr: +16, hr: +20, skin: "cool/clammy", lor: "lethargic" },
    },
    triggers: [
      t("high", "Respiratory failure risk", "If wheezing worsens or silent chest develops", "Airway compromise; urgent evacuation needed", "10+ min"),
      t("medium", "Anxiety feedback loop", "If patient is not reassured", "Breathing worsens; tension increases", "10+ min"),
    ],
  },

  "anaphylaxis": {
    type: "anaphylaxis",
    summary: "Immediate hypersensitivity reaction; life-threatening airway/circulatory risk.",
    discoverableFindings: [
      "Rapid onset: urticaria, angioedema, or respiratory/GI symptoms",
      "Hypotension, tachycardia, wheezing or stridor",
      "Recent allergen exposure (food, drug, insect sting)",
    ],
    suggestedActions: [
      "Epinephrine (if available) immediately",
      "Airway positioning; monitor airway opening",
      "IV fluids if available; rapid evacuation",
    ],
    deltasByMinutes: {
      10: { hr: +16, rr: +8, bpSystolic: -12, lor: "anxious" },
      20: { hr: +28, rr: +14, bpSystolic: -26, lor: "confused" },
      30: { hr: +40, rr: +20, bpSystolic: -40, lor: "lethargic" },
    },
    triggers: [
      t("high", "Airway closure", "If epinephrine is not given or swelling worsens", "Stridor/complete airway obstruction; emergency airway measures", "immediate"),
      t("high", "Refractory shock", "If patient does not respond to epinephrine", "Second dose or advanced interventions needed", "10+ min"),
    ],
  },

  "heat illness": {
    type: "heat illness",
    summary: "Heat exhaustion or heat stroke with altered mental status risk.",
    discoverableFindings: [
      "High core temperature; profuse sweating (exhaustion) or absent (stroke)",
      "Confusion, weakness, dizziness",
      "Hot, flushed skin",
    ],
    suggestedActions: [
      "Move to shade/cool area",
      "Cool body (water, shade, elevation of legs)",
      "Monitor mental status and vitals",
    ],
    deltasByMinutes: {
      10: { hr: +10, rr: +4, skin: "diaphoretic", lor: "anxious" },
      20: { hr: +18, rr: +8, lor: "confused" },
      30: { hr: +26, rr: +12, bpSystolic: -8, lor: "lethargic" },
    },
    triggers: [
      t("high", "Heat stroke", "If core temp remains >40°C and cooling is ineffective", "Risk of organ damage; aggressive cooling and evacuation critical", "over time"),
      t("medium", "Continued exertion", "If patient tries to walk/exercise", "Temperature rises; deterioration accelerates", "10+ min"),
    ],
  },

  "hypothermia": {
    type: "hypothermia",
    summary: "Core body cooling with risk of arrhythmia and altered mental status.",
    discoverableFindings: [
      "Core temp <35°C; shivering or paradoxical undressing",
      "Confusion, lethargy, slurred speech",
      "Bradycardia possible; risk of fatal arrhythmia",
    ],
    suggestedActions: [
      "Remove wet clothing; insulate from ground",
      "Passive rewarming (blankets, shelter)",
      "Gentle movement; avoid rough handling",
      "Evacuation if moderate-severe",
    ],
    deltasByMinutes: {
      10: { hr: -6, lor: "anxious" },
      20: { hr: -12, lor: "confused", rr: -2 },
      30: { hr: -18, lor: "lethargic", rr: -4 },
    },
    triggers: [
      t("high", "Afterdrop", "If patient is moved/warmed too aggressively", "Core temp drops further; fatal arrhythmia risk", "immediate"),
      t("medium", "Rewarming shock", "If core temp rises too quickly without stabilization", "Metabolic disturbance; arrhythmia risk", "10+ min"),
    ],
  },

  "acute abdomen": {
    type: "acute abdomen",
    summary: "Severe abdominal pain with potential internal emergency (appendicitis, perforation, etc.).",
    discoverableFindings: [
      "Severe abdominal pain; guarding or rebound tenderness",
      "Nausea/vomiting; possible fever",
      "Tachycardia; risk of shock if bleeding",
    ],
    suggestedActions: [
      "Gentle abdominal assessment; avoid repeated palpation",
      "NPO (no food/water); consider shock treatment",
      "Urgent evacuation",
    ],
    deltasByMinutes: {
      10: { hr: +8, rr: +2, lor: "anxious" },
      20: { hr: +16, bpSystolic: -8, skin: "pale", lor: "confused" },
      30: { hr: +24, bpSystolic: -16, skin: "cool/clammy", lor: "lethargic" },
    },
    triggers: [
      t("high", "Shock from internal bleeding", "If patient deteriorates with vague exam", "Internal hemorrhage risk; aggressive evacuation", "20+ min"),
      t("medium", "Peritonitis", "If pain worsens or rebound increases", "Infection risk; evacuation priority increases", "over time"),
    ],
  },

  "no serious condition": {
    type: "no serious condition",
    summary: "Minor illness or injury; vital signs remain stable throughout.",
    discoverableFindings: [
      "Mild symptoms; normal or near-normal vitals",
      "Pain is localized and mild-moderate",
    ],
    suggestedActions: [
      "Symptomatic treatment; rest",
      "Monitor for change; plan safe disposition",
    ],
    deltasByMinutes: {
      10: {},
      20: {},
      30: {},
    },
    triggers: [
      t("low", "Reassurance needed", "If patient is anxious despite benign findings", "Anxiety management; clear discharge planning", "immediate"),
      t("low", "Delayed recognition of severity", "If provider assumes benignity without adequate exam", "Missed opportunity to detect subtle findings", "over time"),
    ],
  },
};
