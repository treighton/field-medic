import { useState } from "react";
import { generateScenarioWithLLM } from "./engine/generateScenario";
import type { ScenarioPacket } from "./types/scenario";
import { ScenarioView } from "./components/ScenarioView";
import { LoadPacketModal } from "./components/LoadPacketModal";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { NarrativeCard } from "./components/NarrativeCard";
import { generateNarrative, type NarrativeExtras } from "./engine/generateNarrative";

const API_KEY_STORAGE_KEY = "field_medic_anthropic_key";


export default function App() {
  const [scenarioType, setScenarioType] = useState<"trauma" | "medical">("trauma");
  const [environment, setEnvironment] = useState<"wilderness" | "urban">("wilderness");
  const [packet, setPacket] = useState<ScenarioPacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"scenario" | "narrative" | null>(null);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE_KEY) ?? "");
  const [narrative, setNarrative] = useState<NarrativeExtras | null>(null);

  const onGenerate = async () => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    setLoading(true);
    setScenarioError(null);
    setNarrative(null);
    setPacket(null);

    let next: ScenarioPacket;
    try {
      setLoadingStep("scenario");
      next = await generateScenarioWithLLM({ scenarioType, environment, apiKey });
      setPacket(next);
    } catch (err) {
      setScenarioError(err instanceof Error ? err.message : "Unknown error generating scenario.");
      setLoading(false);
      setLoadingStep(null);
      return;
    }

    try {
      setLoadingStep("narrative");
      const result = await generateNarrative(next, apiKey, environment);
      setNarrative(result);
    } catch {
      // Narrative failure is non-fatal — show the packet without it
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  const onSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
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
            <select value={scenarioType} onChange={(e) => setScenarioType(e.target.value as "trauma" | "medical")} disabled={loading}>
              <option value="trauma">Trauma</option>
              <option value="medical">Medical</option>
            </select>
          </label>
          <label className="control">
            <span>Environment</span>
            <select value={environment} onChange={(e) => setEnvironment(e.target.value as "wilderness" | "urban")} disabled={loading}>
              <option value="wilderness">Wilderness</option>
              <option value="urban">Urban / EMT</option>
            </select>
          </label>
          <button onClick={onGenerate} disabled={loading}>
            {loading ? (loadingStep === "narrative" ? "Adding narrative…" : "Generating…") : "Generate"}
          </button>
          <button onClick={() => setIsLoadModalOpen(true)} disabled={loading}>Load Packet</button>
          <button onClick={() => setIsApiKeyModalOpen(true)} title="Set Anthropic API key">
            {apiKey ? "API Key ✓" : "Set API Key"}
          </button>
          <button onClick={() => window.print()} disabled={!packet || loading}>Print</button>
        </div>
      </header>

      <main className="content">
        {scenarioError && (
          <p className="narrative-error">Error: {scenarioError}</p>
        )}
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" />
            <p>{loadingStep === "narrative" ? "Adding narrative flavor…" : "AI is generating your scenario…"}</p>
          </div>
        ) : !packet ? (
          <div className="empty-state">
            <p className="empty-state__title">No scenario loaded</p>
            <p className="muted">Select a scenario type and environment, then click Generate.</p>
          </div>
        ) : (
          <>
            {narrative && <NarrativeCard narrative={narrative} />}
            <ScenarioView packet={packet} />
          </>
        )}
      </main>

      <LoadPacketModal
        isOpen={isLoadModalOpen}
        onLoad={(loadedPacket) => {
          setPacket(loadedPacket);
          setIsLoadModalOpen(false);
        }}
        onClose={() => setIsLoadModalOpen(false)}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        currentKey={apiKey}
        onSave={onSaveApiKey}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      <footer className="footer no-print">
        <small className="muted">
          Prototype. Training simulator only — not medical advice.
        </small>
      </footer>
    </div>
  );
}
