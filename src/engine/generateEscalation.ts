import type { EscalationTrigger, Injury, MechanismOfInjury, Setting } from "../types/scenario";
import { INJURY_EFFECTS } from "./injuryEffects";
import { MEDICAL_CONDITION_EFFECTS } from "./medicalConditionEffects";

function id(prefix: string, n: number) {
  return `${prefix}-${n}`;
}

export function generateEscalationLogic(args: {
  setting: Setting;
  moi: MechanismOfInjury;
  hazards: { name: string }[];
  injuries: Injury[];
}): EscalationTrigger[] {
  const { hazards, injuries, moi, setting } = args;

  const triggers: EscalationTrigger[] = [];
  let i = 1;

  triggers.push({
    id: id("gen", i++),
    severity: "medium",
    description: "Scene hazard may activate later if not identified",
    condition: "If the scene is not assessed for hazards early",
    consequence: hazards.length ? `Hazard '${hazards[0].name}' may worsen patient/provider safety.` : "Unrecognized hazard increases risk.",
    timeWindow: "over time",
  });

  const highRiskMoi = /Fall >10|High-speed|Multiple impacts|Unknown|Compression|Blunt|Fall 6–10/.test(moi.label);
  if (highRiskMoi) {
    triggers.push({
      id: id("gen", i++),
      severity: "medium",
      description: "High-risk MOI warrants spine consideration and careful movement",
      condition: `If spine precautions are not considered with MOI: ${moi.label}`,
      consequence: "Patient movement may worsen pain, neuro status, or unmask injury; evacuation threshold should be lower.",
      timeWindow: "immediate",
    });
  }

  if (setting.name.includes("Remote")) {
    triggers.push({
      id: id("gen", i++),
      severity: "medium",
      description: "Delayed evacuation increases importance of trending and prevention",
      condition: "If evacuation planning is delayed in a remote setting",
      consequence: "Deterioration may progress before definitive care; reassessment and warmth become more important.",
      timeWindow: "10+ min",
    });
  }

  triggers.push({
    id: id("gen", i++),
    severity: "low",
    description: "Missed trending can make deterioration feel sudden",
    condition: "If vitals are not repeated at least once",
    consequence: "Trends may be missed; debrief should emphasize reassessment cadence.",
    timeWindow: "20+ min",
  });

  for (const injury of injuries) {
    const traumaEffect = INJURY_EFFECTS[injury.type as keyof typeof INJURY_EFFECTS];
    const medicalEffect = MEDICAL_CONDITION_EFFECTS[injury.type as keyof typeof MEDICAL_CONDITION_EFFECTS];
    const effect = traumaEffect || medicalEffect;
    
    if (effect) {
      for (const trig of effect.triggers) {
        triggers.push({
          id: id("inj", i++),
          relatedInjuryId: injury.id,
          ...trig,
        });
      }
    }
  }

  return triggers;
}
