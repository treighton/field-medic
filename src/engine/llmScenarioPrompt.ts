/**
 * Builds the system prompt for full LLM scenario generation.
 * The LLM must return a valid ScenarioPacket JSON object.
 */
export function buildScenarioSystemPrompt(scenarioType: "trauma" | "medical", environment: "wilderness" | "urban"): string {
  const environmentContext = environment === "urban"
    ? `ENVIRONMENT: Urban / Street-level EMT scenario.
Settings should be urban or suburban: streets, apartments, stores, parks, parking lots, offices.
This is an EMT (Emergency Medical Technician) response — BLS scope of practice, ALS backup available.
Evacuation means ambulance transport to hospital, not wilderness carry-out.
Hazards should be urban: traffic, bystanders, unsafe structures, violence risk, etc.
Use "transport decision" instead of "evacuation decision" in expectedActions and endStates.`
    : `ENVIRONMENT: Wilderness / backcountry WFR scenario.
Settings should be remote outdoor environments: trails, alpine terrain, canyons, rivers, campsites.
This is a WFR (Wilderness First Responder) response — no ALS, delayed evacuation, improvised care.
Evacuation means foot carry, litter, or helicopter — hours from definitive care.
Hazards should be environmental: weather, terrain, animals, exposure, remote access.`;

  return `You are a WFR / EMT training scenario generator.
Generate a single, realistic, educationally sound training scenario.
Return ONLY a valid JSON object matching the ScenarioPacket schema below — no prose, no markdown, no code fences.

━━━ SCENARIO TYPE ━━━
scenarioType: "${scenarioType}"

━━━ ENVIRONMENT ━━━
${environmentContext}

━━━ VALID ENUM VALUES (use ONLY these exact strings) ━━━

TraumaInjuryType (for trauma scenarios):
  "spinal instability" | "intracranial bleed" | "pelvic fracture" | "pneumothorax" |
  "internal bleeding" | "concussion" | "solid organ injury" | "femur fracture" |
  "rib fractures" | "multiple injuries" | "no serious injury"

MedicalConditionType (for medical scenarios):
  "acute coronary syndrome" | "stroke" | "sepsis" | "diabetic emergency" |
  "severe dehydration" | "asthma exacerbation" | "anaphylaxis" | "heat illness" |
  "hypothermia" | "acute abdomen" | "no serious condition"

PatientProfile.cooperation: "cooperative" | "anxious" | "altered" | "minimizes symptoms"
ChiefComplaint.category: "pain" | "neurologic" | "respiratory" | "general" | "denial"
ChiefComplaint.reliability: "reliable" | "minimizes" | "confused"
MoiDetails.surface: "rock" | "packed dirt" | "sand" | "snow" | "pavement" | "water" | "unknown"
MoiDetails.landing: "feet" | "butt" | "back" | "side" | "head/face" | "multiple impacts" | "unknown"
MoiDetails.energy: "low" | "moderate" | "high"
WildernessVitals.pupils: "PERRL" | "unequal" | "sluggish" | "fixed/dilated" | "not assessed"
WildernessVitals.skin: "warm/dry" | "cool/clammy" | "pale" | "diaphoretic" | "mottled" | "not assessed"
WildernessVitals.lor: "A&Ox4" | "A&Ox3" | "anxious" | "confused" | "lethargic" | "unresponsive"
BloodPressure: { "kind": "bp", "systolic": number, "diastolic": number }
  OR { "kind": "radialPulse", "quality": "strong" | "weak" | "absent" }
CoreTemp: { "kind": "unavailable" } | { "kind": "estimated", "valueC": number } | { "kind": "measured", "valueC": number, "method": "oral"|"tympanic"|"rectal"|"axillary"|"temporal"|"other" }
EscalationTrigger.severity: "low" | "medium" | "high"
EscalationTrigger.timeWindow: "immediate" | "over time" | "10+ min" | "20+ min"
EndState.name: "Optimal" | "Marginal" | "Failure"
VitalsTimepoint.minutes: 0 | 10 | 20 | 30

━━━ SCENARIO PACKET SCHEMA ━━━

{
  "meta": {
    "id": string,           // generate a random hex id, e.g. "scenario_a1b2c3d4"
    "createdAt": string,    // ISO 8601 timestamp
    "version": "1.0",
    "generatorVersion": "llm-1.0",
    "scenarioType": "trauma" | "medical"
  },
  "setting": {
    "name": string,
    "notes": string[],
    "roll": { "kind": "dice", "label": "Setting", "sides": 6, "count": 2, "values": [number, number], "total": number }
  },
  "hazards": [
    {
      "name": string,
      "notes": string[],
      "roll": { "kind": "dice", "label": "Hazard", "sides": 6, "count": 1, "values": [number], "total": number }
    }
  ],
  "patient": {
    "type": string,         // e.g. "Adult", "Elderly", "Pediatric", "Athletic adult"
    "age": number,
    "cooperation": PatientProfile.cooperation,
    "notes": string[],
    "roll": { "kind": "dice", "label": "Patient", "sides": 6, "count": 2, "values": [number, number], "total": number }
  },
  "chiefComplaint": {
    "statement": string,    // what the patient says verbatim
    "category": ChiefComplaint.category,
    "reliability": ChiefComplaint.reliability,
    "isMisdirecting": boolean,
    "intendedToMask": InjuryType | null,
    "roll": { "kind": "dice", "label": "Chief Complaint", "sides": 6, "count": 1, "values": [number], "total": number },
    "notes": string[]
  },
  "moi": {
    "label": string,
    "roll": { "kind": "dice", "label": "MOI", "sides": 6, "count": 2, "values": [number, number], "total": number },
    "modifierForInjuryCount": number,
    "details": {
      "narrative": string,
      "heightFt": number | null,
      "speedMph": number | null,
      "surface": MoiDetails.surface,
      "landing": MoiDetails.landing,
      "witnessed": boolean,
      "protectiveGear": { "helmet": boolean },
      "energy": MoiDetails.energy
    }
  },
  "injuryCount": {
    "roll": {
      "kind": "rollWithModifier",
      "label": "Injury Count",
      "baseRoll": { "kind": "dice", "label": "Base", "sides": 6, "count": 1, "values": [number], "total": number },
      "modifier": number,
      "total": number
    },
    "injuryCount": 0 | 1 | 2 | 3,
    "mappingRule": string
  },
  "hiddenInjuries": [
    {
      "id": string,
      "type": TraumaInjuryType | MedicalConditionType,
      "summary": string,
      "discoverableFindings": string[],
      "suggestedActions": string[]
    }
  ],
  "vitalsTimeline": [
    {
      "minutes": 0 | 10 | 20 | 30,
      "vitals": {
        "hr": number,
        "rr": number,
        "bp": BloodPressure,
        "pupils": Pupils,
        "skin": Skin,
        "lor": LevelOfResponsiveness,
        "coreTemp": CoreTemp | null,
        "bloodGlucose": number | null
      },
      "notes": string[]
    }
  ],
  "expectedActions": string[],   // 8-14 ordered Gold Path actions
  "escalationLogic": [
    {
      "id": string,
      "severity": EscalationTrigger.severity,
      "description": string,
      "condition": string,
      "consequence": string,
      "timeWindow": EscalationTrigger.timeWindow,
      "relatedInjuryId": string | null
    }
  ],
  "endStates": [
    {
      "id": string,
      "name": "Optimal" | "Marginal" | "Failure",
      "description": string,
      "criteria": string[],
      "debriefNotes": string[]
    }
  ],
  "gradingHints": {
    "gradedFields": ["hr", "rr", "bp", "pupils", "skin", "lor"],
    "notGradedNotes": string[]
  },
  "emtExtras": null
}

━━━ HARD CONSTRAINTS ━━━

1. vitalsTimeline MUST have exactly 4 entries: minutes 0, 10, 20, 30 — in that order.
2. vitals at minute 0 should reflect initial presentation (not yet deteriorated).
3. vitals must trend consistently with hiddenInjuries — worsening over time for serious injuries.
4. Realistic vital ranges: HR 40-180, RR 8-40, BP systolic 60-200, BP diastolic 30-120.
5. If BP systolic drops below ~80, switch bp to { "kind": "radialPulse", "quality": "weak" or "absent" }.
6. hiddenInjuries: 0-3 injuries. For trauma, use TraumaInjuryType values only. For medical, use MedicalConditionType values only.
7. injuryCount.injuryCount must equal the length of hiddenInjuries array.
8. chiefComplaint: if isMisdirecting is true, the statement should minimize or deflect from the real injury.
9. endStates MUST include exactly 3 entries: one "Optimal", one "Marginal", one "Failure".
10. expectedActions: 8-14 items, ordered from scene arrival to evacuation decision.
11. escalationLogic: 3-6 triggers covering scene hazards, MOI risk, and injury-specific deterioration.
12. All string IDs (injury ids, escalation ids, etc.) must be unique within the packet.
13. Make the scenario educationally challenging — avoid trivially obvious presentations.
14. For medical scenarios: moi.label should be the presentation location (e.g. "Hiking trail"), not a trauma mechanism.
15. coreTemp: use { "kind": "unavailable" } for most wilderness scenarios unless hypothermia/heat illness is the condition.
16. bloodGlucose: use null unless diabetic emergency or sepsis is a hidden injury.
17. BREVITY IS REQUIRED — the entire JSON response must fit within 4000 tokens. Keep all string values short:
    - setting.notes: max 3 items, each under 12 words
    - hazards: max 2 hazards; notes max 2 items each, under 10 words each
    - patient.notes: max 3 items, each under 12 words
    - chiefComplaint.notes: max 2 items, each under 15 words
    - moi.details.narrative: max 30 words
    - hiddenInjuries: max 2 injuries; discoverableFindings max 3 items each (under 12 words each); suggestedActions max 3 items each (under 12 words each)
    - expectedActions: max 10 items, each under 15 words
    - escalationLogic: max 4 triggers; description/condition/consequence each under 12 words
    - endStates: criteria max 3 items each (under 12 words); debriefNotes max 2 items each (under 15 words)
    - gradingHints.notGradedNotes: max 1 item`;
}
