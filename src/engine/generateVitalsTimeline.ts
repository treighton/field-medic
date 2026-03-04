import type { Injury, VitalsTimepoint, WildernessVitals } from "../types/scenario";
import { baselineAdultVitals, clamp, maybeConvertToRadialPulse } from "./vitals";
import { INJURY_EFFECTS } from "./injuryEffects";
import { MEDICAL_CONDITION_EFFECTS } from "./medicalConditionEffects";

type Minutes = 0 | 10 | 20 | 30;

function applyDelta(base: WildernessVitals, delta: any): WildernessVitals {
  const next: WildernessVitals = { ...base, bp: { ...base.bp } };

  if (typeof delta.hr === "number") next.hr = clamp(next.hr + delta.hr, 40, 180);
  if (typeof delta.rr === "number") next.rr = clamp(next.rr + delta.rr, 8, 40);

  if (next.bp.kind === "bp") {
    const systolic = typeof delta.bpSystolic === "number" ? next.bp.systolic + delta.bpSystolic : next.bp.systolic;
    const diastolic = typeof delta.bpDiastolic === "number" ? next.bp.diastolic + delta.bpDiastolic : next.bp.diastolic;
    next.bp = { kind: "bp", systolic: clamp(systolic, 60, 200), diastolic: clamp(diastolic, 30, 120) };
    next.bp = maybeConvertToRadialPulse(next.bp);
  }

  if (delta.pupils) next.pupils = delta.pupils;
  if (delta.skin) next.skin = delta.skin;
  if (delta.lor) next.lor = delta.lor;

  return next;
}

export function generateVitalsTimeline(hiddenInjuries: Injury[]): VitalsTimepoint[] {
  const baseline = baselineAdultVitals();
  const timepoints: Minutes[] = [0, 10, 20, 30];
  const out: VitalsTimepoint[] = [];

  let current: WildernessVitals = baseline;

  for (const minutes of timepoints) {
    if (minutes === 0) {
      out.push({ minutes, vitals: current, notes: ["Initial presentation vitals (baseline)"] });
      continue;
    }

    let next = { ...current, bp: { ...current.bp } } as WildernessVitals;
    const notes: string[] = [];

    for (const injury of hiddenInjuries) {
      const traumaEffect = INJURY_EFFECTS[injury.type as keyof typeof INJURY_EFFECTS];
      const medicalEffect = MEDICAL_CONDITION_EFFECTS[injury.type as keyof typeof MEDICAL_CONDITION_EFFECTS];
      const effect = traumaEffect || medicalEffect;
      
      if (effect) {
        const delta = effect.deltasByMinutes[minutes as 10 | 20 | 30];
        next = applyDelta(next, delta);
      }
    }

    if (hiddenInjuries.length === 0) {
      notes.push("No hidden injuries: vitals remain stable over time (process-focused scenario).");
    } else {
      notes.push("Vitals incorporate cumulative effects from hidden injuries.");
    }

    out.push({ minutes: minutes as any, vitals: next, notes });
    current = next;
  }

  return out;
}
