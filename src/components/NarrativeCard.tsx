import { Card } from "./Card";
import type { NarrativeExtras } from "../engine/generateNarrative";

export function NarrativeCard({ narrative }: { narrative: NarrativeExtras }) {
  return (
    <Card title="AI Narrative">
      <p className="narrative-opener">{narrative.opener}</p>

      {narrative.sensoryDetails.length > 0 && (
        <>
          <div className="label" style={{ marginTop: 12 }}>Scene</div>
          <ul>
            {narrative.sensoryDetails.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </>
      )}

      {narrative.patientDialogue.length > 0 && (
        <>
          <div className="label" style={{ marginTop: 12 }}>Patient</div>
          <ul>
            {narrative.patientDialogue.map((line, i) => <li key={i}>"{line}"</li>)}
          </ul>
        </>
      )}

      {narrative.bystanderDialogue.length > 0 && (
        <>
          <div className="label" style={{ marginTop: 12 }}>Bystander</div>
          <ul>
            {narrative.bystanderDialogue.map((line, i) => <li key={i}>"{line}"</li>)}
          </ul>
        </>
      )}

      {narrative.gmNotes.length > 0 && (
        <>
          <div className="label" style={{ marginTop: 12 }}>GM Notes</div>
          <ul>
            {narrative.gmNotes.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </>
      )}
    </Card>
  );
}
