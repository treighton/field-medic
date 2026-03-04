import { useState } from "react";
import { generateScenarioPacket } from "./engine/generateScenario";
import type { ScenarioPacket } from "./types/scenario";
import { ScenarioView } from "./components/ScenarioView";
import { LoadPacketModal } from "./components/LoadPacketModal";

// function downloadJson(packet: ScenarioPacket) {
//   const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = `${packet.meta.id}.json`;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   URL.revokeObjectURL(url);
// }

function buildNarrativePrompt(packet: ScenarioPacket): string {
  const lines = [
    "You are generating narrative flavor for an EMT training scenario.",
    "You will be given a JSON ScenarioPacket. That JSON is the source of truth.",
    "",
    "Return ONLY valid JSON file for download with this shape:",
    "{",
    '  "narrative": {',
    '    "opener": string,',
    '    "patientDialogue": string[],',
    '    "bystanderDialogue": string[],',
    '    "sensoryDetails": string[],',
    '    "gmNotes": string[]',
    "  }",
    "}",
    "",
    "Hard constraints:",
    "- DO NOT change MOI, injuries, vitals, timelines, expected actions, escalation logic, or end states.",
    "- DO NOT invent new symptoms that imply injuries not present in hiddenInjuries.",
    "- You may rephrase the chief complaint as dialogue, but must preserve meaning and reliability.",
    "- If chiefComplaint.isMisdirecting is true, the patient's dialogue should minimize/redirect appropriately.",
    "- Keep it wilderness-context appropriate and concise.",
    "",
    "ScenarioPacket JSON (source of truth):",
    JSON.stringify(packet, null, 2),
  ];
  return lines.join("\n");
}

async function copyNarrativePrompt(packet: ScenarioPacket) {
  const text = buildNarrativePrompt(packet);
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied narrative prompt to clipboard.");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    alert("Copied narrative prompt to clipboard.");
  }
}

export default function App() {
  const [scenarioType, setScenarioType] = useState<"trauma" | "medical">("trauma");
  const [packet, setPacket] = useState<ScenarioPacket>(() => generateScenarioPacket({ scenarioType }));
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  const onGenerate = () => {
    const next = generateScenarioPacket({
      scenarioType,
    });
    setPacket(next);
  };

  return (
    <div className="app">
      <header className="topbar no-print">
        <div className="topbar__left">
          <h1 className="title">Field Medic — Scenario Packet Generator</h1>
          <p className="subtitle">Solo mode • client-only • JSON packet + printable HTML</p>
        </div>

        <div className="topbar__controls">
          <label className="control">
            <span>Scenario Type</span>
            <select value={scenarioType} onChange={(e) => {
              setScenarioType(e.target.value as "trauma" | "medical");
              const next = generateScenarioPacket({
                scenarioType: e.target.value as "trauma" | "medical"
              });
              setPacket(next);
            }}>
              <option value="trauma">Trauma</option>
              <option value="medical">Medical</option>
            </select>
          </label>
          <label className="control">
            {/* <span>Seed (optional)</span>
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="e.g. 1234 or 'pelvic'"
            /> */}
          </label>
          <button onClick={onGenerate}>Generate Scenario</button>
          <button onClick={() => setIsLoadModalOpen(true)}>Load Packet</button>
          {/* <button onClick={() => downloadJson(packet)}>Export JSON</button> */}
          <button onClick={() => copyNarrativePrompt(packet)}>Copy LLM Prompt</button>
          <button onClick={() => window.print()}>Print</button>
        </div>
      </header>

      <main className="content">
        <ScenarioView packet={packet} />
      </main>

      <LoadPacketModal
        isOpen={isLoadModalOpen}
        onLoad={(loadedPacket) => {
          setPacket(loadedPacket);
          setIsLoadModalOpen(false);
        }}
        onClose={() => setIsLoadModalOpen(false)}
      />

      <footer className="footer no-print">
        <small className="muted">
          Prototype. Training simulator only — not medical advice.
        </small>
      </footer>
    </div>
  );
}
