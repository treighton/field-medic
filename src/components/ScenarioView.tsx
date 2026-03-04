import type { ScenarioPacket, VitalsTimepoint, EscalationTrigger, Injury } from "../types/scenario";
import { Card } from "./Card";
import { formatBP } from "../engine/vitals";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function groupBySeverity(triggers: EscalationTrigger[]) {
  const groups: Record<string, EscalationTrigger[]> = { high: [], medium: [], low: [] };
  for (const t of triggers) groups[t.severity].push(t);
  return groups as { high: EscalationTrigger[]; medium: EscalationTrigger[]; low: EscalationTrigger[] };
}

function VitalsTable({ timeline }: { timeline: VitalsTimepoint[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Time</th>
          <th>HR</th>
          <th>RR</th>
          <th>BP / Radial Pulse</th>
          <th>Pupils</th>
          <th>Skin</th>
          <th>LOR</th>
          <th>Core Temp</th>
        </tr>
      </thead>
      <tbody>
        {timeline.map((tp) => (
          <tr key={tp.minutes}>
            <td>{tp.minutes} min</td>
            <td>{tp.vitals.hr}</td>
            <td>{tp.vitals.rr}</td>
            <td>{formatBP(tp.vitals.bp)}</td>
            <td>{tp.vitals.pupils}</td>
            <td>{tp.vitals.skin}</td>
            <td>{tp.vitals.lor}</td>
            <td>
              {tp.vitals.coreTemp
                ? tp.vitals.coreTemp.kind === "unavailable"
                  ? "Unavailable"
                  : `${tp.vitals.coreTemp.valueC.toFixed(1)}°C`
                : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InjuryList({ injuries }: { injuries: Injury[] }) {
  if (!injuries.length) return <p>No hidden injuries rolled.</p>;
  return (
    <div className="stack">
      {injuries.map((inj) => (
        <div key={inj.id} className="subcard">
          <div className="subcard__title">
            <strong>{inj.type}</strong>
          </div>
          <p className="muted">{inj.summary}</p>
          <div className="grid2">
            <div>
              <div className="label">Discoverable findings</div>
              <ul>
                {inj.discoverableFindings.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="label">Suggested actions</div>
              <ul>
                {inj.suggestedActions.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScenarioView({ packet }: { packet: ScenarioPacket }) {
  const sev = groupBySeverity(packet.escalationLogic);

  return (
    <div className="stack">

      <div className="grid2">
        <Card title="Setting">
          <p><strong>{packet.setting.name}</strong></p>
          {packet.setting.notes?.length ? (
            <>
              <div className="label">Notes</div>
              <ul>{packet.setting.notes.map((n, idx) => <li key={idx}>{n}</li>)}</ul>
            </>
          ) : null}
        </Card>

        <Card title="Hazards">
          {packet.hazards.map((h, idx) => (
            <div key={idx}>
              <p><strong>{h.name}</strong></p>
              {h.notes?.length ? (
                <ul>{h.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
              ) : null}
            </div>
          ))}
        </Card>
      </div>

      <Card title="Patient">
        <p><strong>{packet.patient.type}</strong> — {packet.patient.cooperation}</p>
        {packet.patient.notes?.length ? (
          <>
            <div className="label">Notes</div>
            <ul>{packet.patient.notes.map((n, idx) => <li key={idx}>{n}</li>)}</ul>
          </>
        ) : null}
      </Card>
      <Card title="Chief Complaint">
        <p><strong>Patient says:</strong> “{packet.chiefComplaint.statement}”</p>
        <p className="muted">
          Category: {packet.chiefComplaint.category} • Reliability: {packet.chiefComplaint.reliability}
        </p>

        {packet.chiefComplaint.notes?.length ? (
          <>
            <div className="label">Notes</div>
            <ul>{packet.chiefComplaint.notes.map((n, idx) => <li key={idx}>{n}</li>)}</ul>
          </>
        ) : null}
      </Card>


      <Card title="Mechanism of Injury (MOI) + Hidden Injury Count">
        <p><strong>{packet.moi.label}</strong></p>
        <p className="muted">
          <strong>Details:</strong> {packet.moi.details.narrative}
        </p>
        <div className="chiprow">
          {packet.moi.details.heightFt ? <span className="chip">Height: {packet.moi.details.heightFt} ft</span> : null}
          {packet.moi.details.speedMph ? <span className="chip">Speed: ~{packet.moi.details.speedMph} mph</span> : null}
          <span className="chip">Surface: {packet.moi.details.surface}</span>
          <span className="chip">Landing: {packet.moi.details.landing}</span>
          <span className="chip">Energy: {packet.moi.details.energy}</span>
          {packet.moi.details.protectiveGear?.helmet !== undefined ? (
            <span className="chip">Helmet: {packet.moi.details.protectiveGear.helmet ? "yes" : "no"}</span>
          ) : null}
          <span className="chip">{packet.moi.details.witnessed ? "Witnessed" : "Unwitnessed"}</span>
        </div>
      </Card>

      <Card title="Hidden Injuries">
        <InjuryList injuries={packet.hiddenInjuries} />
      </Card>

      <Card title="Vitals Timeline (Wilderness)">
        <VitalsTable timeline={packet.vitalsTimeline} />
      </Card>

      <Card title="Expected Actions (Gold Path)">
        <ol>
          {packet.expectedActions.map((a, idx) => (
            <li key={idx}>{a}</li>
          ))}
        </ol>
      </Card>

      <Card title="Escalation Logic (Triggers)">
        <div className="grid2">
          <div>
            <div className="label">High</div>
            <ul>
              {sev.high.map((t) => (
                <li key={t.id}>
                  <strong>{t.description}</strong>
                  <div className="muted">{t.condition} → {t.consequence}{t.timeWindow ? ` (${t.timeWindow})` : ""}</div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label">Medium</div>
            <ul>
              {sev.medium.map((t) => (
                <li key={t.id}>
                  <strong>{t.description}</strong>
                  <div className="muted">{t.condition} → {t.consequence}{t.timeWindow ? ` (${t.timeWindow})` : ""}</div>
                </li>
              ))}
            </ul>
            <div className="label" style={{ marginTop: 12 }}>Low</div>
            <ul>
              {sev.low.map((t) => (
                <li key={t.id}>
                  <strong>{t.description}</strong>
                  <div className="muted">{t.condition} → {t.consequence}{t.timeWindow ? ` (${t.timeWindow})` : ""}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="End States">
        <div className="grid2">
          {packet.endStates.map((s) => (
            <div key={s.id} className="subcard">
              <div className="subcard__title"><strong>{s.name}</strong></div>
              <p>{s.description}</p>
              <div className="label">Criteria</div>
              <ul>{s.criteria.map((c, idx) => <li key={idx}>{c}</li>)}</ul>
              <div className="label">Debrief notes</div>
              <ul>{s.debriefNotes.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
