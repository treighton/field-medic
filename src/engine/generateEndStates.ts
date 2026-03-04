import type { EndState, Injury, MechanismOfInjury } from "../types/scenario";

function makeId(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function injurySpecificCriteria(injuries: Injury[]): string[] {
  const c: string[] = [];
  const types = new Set(injuries.map((i) => i.type));

  if (types.has("pneumothorax") || types.has("rib fractures")) c.push("Breathing status is reassessed; increasing RR triggers earlier evacuation.");
  if (types.has("pelvic fracture") || types.has("internal bleeding") || types.has("solid organ injury"))
    c.push("Shock is anticipated: warmth/minimal movement + vitals trending informs evacuation urgency.");
  if (types.has("intracranial bleed") || types.has("concussion")) c.push("Neuro (LOR/pupils) is reassessed; deterioration prompts evacuation.");
  if (types.has("spinal instability")) c.push("Spine risk is respected: movement minimized and neuro checks documented.");
  if (types.has("femur fracture")) c.push("CMS is checked and the limb is immobilized; pain/movement is controlled.");

  if (types.size === 0) c.push("Assessment is cautious despite stable findings; reassessment confirms stability.");
  return c;
}

export function generateEndStates(moi: MechanismOfInjury, injuries: Injury[]): EndState[] {
  const baseCriteria = [
    "Scene hazards identified early",
    "Primary assessment performed before detailed exam",
    "Initial vitals obtained",
    "Vitals repeated at least once (trend observed)",
    "Evacuation decision justified based on MOI + findings + trends",
  ];

  const specific = injurySpecificCriteria(injuries);

  const optimal: EndState = {
    id: makeId("Optimal"),
    name: "Optimal",
    description: "Correct priorities, early trend recognition, and an appropriate evacuation plan. Patient remains as stable as possible.",
    criteria: [...baseCriteria, ...specific],
    debriefNotes: [
      "Highlight sequencing: scene safety → ABCs → vitals → focused exam → reassessment.",
      "Call out how MOI influenced caution even if initial appearance was reassuring.",
    ],
  };

  const marginal: EndState = {
    id: makeId("Marginal"),
    name: "Marginal",
    description: "Key steps eventually completed, but delays or omissions allowed deterioration or increased risk.",
    criteria: [
      "Primary assessment completed, but out of order or delayed",
      "Vitals obtained but trending delayed or incomplete",
      "Evacuation decision made after deterioration cues appear",
      ...specific.slice(0, Math.max(1, Math.floor(specific.length / 2))),
    ],
    debriefNotes: [
      "Emphasize how repeating vitals earlier would have revealed trends sooner.",
      "Discuss which single missed step most contributed to escalation.",
    ],
  };

  const failure: EndState = {
    id: makeId("Failure"),
    name: "Failure",
    description: "Missed priorities or unsafe choices lead to significant deterioration, collapse risk, or preventable complications.",
    criteria: [
      `High-risk MOI (${moi.label}) not respected (unsafe movement / no reassessment)`,
      "Life threats or shock signs not anticipated",
      "No repeat vitals performed",
      "Evacuation decision delayed until severe symptoms",
    ],
    debriefNotes: [
      "Reinforce that 'sudden' collapse is usually a missed trend + delayed decision.",
      "Review triggers that would have been prevented by early reassessment and movement control.",
    ],
  };

  return [optimal, marginal, failure];
}
