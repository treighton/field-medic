import type { MechanismOfInjury, PatientProfile } from "../types/scenario";

export type MoiTags = {
  energy: "low" | "moderate" | "high";
  landing: MechanismOfInjury["details"]["landing"];
  surface: MechanismOfInjury["details"]["surface"];
  witnessed: boolean;
  helmet?: boolean;
  isFall: boolean;
  isHighSpeed: boolean;
  cooperation: PatientProfile["cooperation"];
};

export function deriveMoiTags(moi: MechanismOfInjury, patient: PatientProfile): MoiTags {
  return {
    energy: moi.details.energy,
    landing: moi.details.landing,
    surface: moi.details.surface,
    witnessed: moi.details.witnessed,
    helmet: moi.details.protectiveGear?.helmet,
    isFall: moi.label.startsWith("Fall"),
    isHighSpeed: moi.label.includes("High-speed"),
    cooperation: patient.cooperation,
  };
}
