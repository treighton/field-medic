import type { ScenarioPacket } from "../types/scenario";
import { callClaude, extractJson, LLMError } from "./llm";

export type NarrativeExtras = {
  opener: string;
  patientDialogue: string[];
  bystanderDialogue: string[];
  sensoryDetails: string[];
  gmNotes: string[];
};

function buildNarrativeSystemPrompt(environment: "wilderness" | "urban"): string {
  const contextLine = environment === "urban"
    ? "Keep all content urban/street-level EMT context appropriate and concise."
    : "Keep all content wilderness/outdoor-context appropriate and concise.";

  return `You are generating narrative flavor text for a WFR/EMT training scenario.
You will receive a JSON ScenarioPacket. That packet is the source of truth — do not contradict it.

Return ONLY a valid JSON object with this exact shape (no prose, no markdown, no code fences):
{
  "opener": string,
  "patientDialogue": string[],
  "bystanderDialogue": string[],
  "sensoryDetails": string[],
  "gmNotes": string[]
}

Hard constraints:
- Do NOT change MOI, injuries, vitals, timelines, expected actions, escalation logic, or end states.
- Do NOT invent symptoms that imply injuries not present in hiddenInjuries.
- You may rephrase the chief complaint as dialogue, but must preserve its meaning and reliability level.
- If chiefComplaint.isMisdirecting is true, patient dialogue must minimize or redirect appropriately.
- ${contextLine}
- patientDialogue: 2–4 lines of what the patient might say during assessment.
- bystanderDialogue: 1–3 lines from a bystander/witness (or empty array if unwitnessed).
- sensoryDetails: 2–4 short environmental/sensory observations for the scene.
- gmNotes: 2–3 tips for the instructor running this scenario.`;
}

export async function generateNarrative(packet: ScenarioPacket, apiKey: string, environment: "wilderness" | "urban" = "wilderness"): Promise<NarrativeExtras> {
  const userContent = `ScenarioPacket (source of truth):\n${JSON.stringify(packet, null, 2)}`;

  const raw = await callClaude(buildNarrativeSystemPrompt(environment), userContent, apiKey);
  const jsonStr = extractJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new LLMError("Failed to parse JSON from narrative response");
  }

  return validateNarrative(parsed);
}

function validateNarrative(data: unknown): NarrativeExtras {
  if (typeof data !== "object" || data === null) throw new LLMError("Narrative response is not an object");
  const d = data as Record<string, unknown>;

  const str = (v: unknown, field: string): string => {
    if (typeof v !== "string") throw new LLMError(`Narrative field '${field}' must be a string`);
    return v;
  };
  const strArr = (v: unknown, field: string): string[] => {
    if (!Array.isArray(v)) throw new LLMError(`Narrative field '${field}' must be an array`);
    return v.map((item, i) => str(item, `${field}[${i}]`));
  };

  return {
    opener: str(d.opener, "opener"),
    patientDialogue: strArr(d.patientDialogue, "patientDialogue"),
    bystanderDialogue: strArr(d.bystanderDialogue, "bystanderDialogue"),
    sensoryDetails: strArr(d.sensoryDetails, "sensoryDetails"),
    gmNotes: strArr(d.gmNotes, "gmNotes"),
  };
}
