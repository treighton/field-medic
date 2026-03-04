import type { Rng } from "./dice";
import type { MedicalConditionType } from "../types/scenario";

export type MedicalPresentation = {
  onsetTiming: "sudden" | "gradual";
  primaryComplaint: string;
  relatedSymptoms: string[];
};

const MEDICAL_PRESENTATIONS: Record<MedicalConditionType, MedicalPresentation[]> = {
  "acute coronary syndrome": [
    {
      onsetTiming: "sudden",
      primaryComplaint: "Chest pressure or heaviness",
      relatedSymptoms: ["Pain radiating to left arm", "Shortness of breath", "Diaphoresis"],
    },
    {
      onsetTiming: "sudden",
      primaryComplaint: "Severe chest pain",
      relatedSymptoms: ["Jaw or back pain", "Nausea", "Anxiety"],
    },
    {
      onsetTiming: "gradual",
      primaryComplaint: "Chest discomfort with exertion",
      relatedSymptoms: ["Dyspnea", "Fatigue", "Dizziness"],
    },
  ],
  "stroke": [
    {
      onsetTiming: "sudden",
      primaryComplaint: "Facial droop on one side",
      relatedSymptoms: ["Arm weakness", "Speech difficulty", "Confusion"],
    },
    {
      onsetTiming: "sudden",
      primaryComplaint: "Inability to speak clearly",
      relatedSymptoms: ["Facial asymmetry", "Weakness", "Dizziness"],
    },
    {
      onsetTiming: "sudden",
      primaryComplaint: "Weakness on one side of body",
      relatedSymptoms: ["Slurred speech", "Vision changes", "Confusion"],
    },
  ],
  "sepsis": [
    {
      onsetTiming: "gradual",
      primaryComplaint: "Fever and chills",
      relatedSymptoms: ["Weakness", "Headache", "Tachycardia"],
    },
    {
      onsetTiming: "gradual",
      primaryComplaint: "Feeling very weak and confused",
      relatedSymptoms: ["Fever", "Rapid heartbeat", "Pain from infection source"],
    },
  ],
  "diabetic emergency": [
    {
      onsetTiming: "sudden",
      primaryComplaint: "Confusion or difficulty concentrating",
      relatedSymptoms: ["Shakiness", "Sweating", "Palpitations"],
    },
    {
      onsetTiming: "gradual",
      primaryComplaint: "Feeling weak and dizzy",
      relatedSymptoms: ["Blurred vision", "Headache", "Nausea"],
    },
  ],
  "severe dehydration": [
    {
      onsetTiming: "gradual",
      primaryComplaint: "Extreme thirst and weakness",
      relatedSymptoms: ["Dizziness", "Dry mouth", "Dark urine"],
    },
    {
      onsetTiming: "gradual",
      primaryComplaint: "Dizziness when standing",
      relatedSymptoms: ["Weakness", "Headache", "Rapid heartbeat"],
    },
  ],
  "asthma exacerbation": [
    {
      onsetTiming: "sudden",
      primaryComplaint: "Shortness of breath",
      relatedSymptoms: ["Wheezing", "Chest tightness", "Anxiety"],
    },
    {
      onsetTiming: "sudden",
      primaryComplaint: "Can't catch my breath",
      relatedSymptoms: ["Wheezing sound", "Anxiety", "Difficulty speaking"],
    },
  ],
  "anaphylaxis": [
    {
      onsetTiming: "sudden",
      primaryComplaint: "Difficulty breathing and swelling",
      relatedSymptoms: ["Throat tightness", "Rash", "Dizziness"],
    },
    {
      onsetTiming: "sudden",
      primaryComplaint: "Severe allergic reaction starting",
      relatedSymptoms: ["Facial/throat swelling", "Wheezing", "Rapid heartbeat"],
    },
  ],
  "heat illness": [
    {
      onsetTiming: "gradual",
      primaryComplaint: "Extreme heat and dizziness",
      relatedSymptoms: ["Weakness", "Nausea", "Rapid heartbeat"],
    },
    {
      onsetTiming: "sudden",
      primaryComplaint: "Confusion and loss of coordination",
      relatedSymptoms: ["High temperature", "Altered mental status", "Weak"],
    },
  ],
  "hypothermia": [
    {
      onsetTiming: "gradual",
      primaryComplaint: "Feeling cold and weak",
      relatedSymptoms: ["Shivering", "Confusion", "Slurred speech"],
    },
    {
      onsetTiming: "gradual",
      primaryComplaint: "Can't seem to think clearly, very cold",
      relatedSymptoms: ["Muscle stiffness", "Shivering stopping", "Drowsiness"],
    },
  ],
  "acute abdomen": [
    {
      onsetTiming: "sudden",
      primaryComplaint: "Severe abdominal pain",
      relatedSymptoms: ["Nausea", "Vomiting", "Inability to move"],
    },
    {
      onsetTiming: "gradual",
      primaryComplaint: "Worsening stomach pain",
      relatedSymptoms: ["Not hungry", "Feeling sick", "Pain with movement"],
    },
  ],
  "no serious condition": [
    {
      onsetTiming: "gradual",
      primaryComplaint: "Mild headache",
      relatedSymptoms: ["Slight nausea", "Fatigue"],
    },
    {
      onsetTiming: "gradual",
      primaryComplaint: "Minor stomach upset",
      relatedSymptoms: ["Mild discomfort"],
    },
  ],
};

export function generateMedicalPresentation(
  conditionType: MedicalConditionType,
  rng: Rng
): MedicalPresentation {
  const presentations = MEDICAL_PRESENTATIONS[conditionType];
  const idx = Math.floor(rng() * presentations.length);
  return presentations[idx];
}
