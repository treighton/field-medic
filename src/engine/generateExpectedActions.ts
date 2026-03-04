import type { Injury, MechanismOfInjury } from "../types/scenario";
import { INJURY_EFFECTS } from "./injuryEffects";
import { MEDICAL_CONDITION_EFFECTS } from "./medicalConditionEffects";

function isHighRiskMoi(moi: MechanismOfInjury): boolean {
  return (
    moi.label.includes(">10") ||
    moi.label.includes("High-speed") ||
    moi.label.includes("Multiple impacts") ||
    moi.label.includes("Unknown") ||
    moi.label.includes("Compression") ||
    moi.label.includes("Blunt trauma") ||
    moi.label.includes("Fall 6–10")
  );
}

export function generateExpectedActions(moi: MechanismOfInjury, injuries: Injury[]): string[] {
  const actions: string[] = [];
  const add = (s: string) => {
    const normalized = s.trim();
    if (!normalized) return;
    if (!actions.includes(normalized)) actions.push(normalized);
  };

  add("BSI (gloves/eye protection as appropriate)");
  add("Scene safety: check for hazards and control the scene");
  if (isHighRiskMoi(moi)) add(`Spine consideration due to MOI (${moi.label}): minimize movement / manual stabilization as needed`);
  add("Primary assessment (ABCs) and address immediate life threats");
  add("Obtain initial wilderness vitals (HR/RR/BP or radial pulse, pupils, skin, LOR)");
  add("Focused exam guided by MOI and complaints; include CMS/neuro checks as relevant");
  add("Repeat vitals at least once to identify trends");
  add("Evacuation decision and plan (consider resources, distance, and deterioration risk)");

  for (const injury of injuries) {
    const traumaEffect = INJURY_EFFECTS[injury.type as keyof typeof INJURY_EFFECTS];
    const medicalEffect = MEDICAL_CONDITION_EFFECTS[injury.type as keyof typeof MEDICAL_CONDITION_EFFECTS];
    const effect = traumaEffect || medicalEffect;
    
    if (effect) {
      for (const s of effect.suggestedActions) add(s);
    }
  }

  return actions.length > 14 ? actions.slice(0, 14) : actions;
}
