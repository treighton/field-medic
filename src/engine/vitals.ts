import type { BloodPressure, CoreTemp, WildernessVitals } from "../types/scenario";

export function formatBP(bp: BloodPressure): string {
  if (bp.kind === "bp") return `${bp.systolic}/${bp.diastolic}`;
  return `Radial pulse: ${bp.quality}`;
}

export function baselineAdultVitals(): WildernessVitals {
  return {
    hr: 84,
    rr: 16,
    bp: { kind: "bp", systolic: 122, diastolic: 78 },
    pupils: "PERRL",
    skin: "warm/dry",
    lor: "A&Ox4",
    coreTemp: { kind: "unavailable", reason: "Not measured / not available in field" } as CoreTemp,
  };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function maybeConvertToRadialPulse(bp: BloodPressure): BloodPressure {
  if (bp.kind !== "bp") return bp;
  if (bp.systolic <= 60) return { kind: "radialPulse", quality: "absent" };
  if (bp.systolic <= 80) return { kind: "radialPulse", quality: "weak" };
  return bp;
}
