export type DiceRoll = {
  kind: "dice";
  label: string;
  sides: number;
  count: number;
  values: number[];
  total: number;
};

export type RollWithModifier = {
  kind: "rollWithModifier";
  label: string;
  baseRoll: DiceRoll;
  modifier: number;
  total: number;
};

export type BloodPressure =
  | { kind: "bp"; systolic: number; diastolic: number }
  | { kind: "radialPulse"; quality: "strong" | "weak" | "absent" };

export type Pupils = "PERRL" | "unequal" | "sluggish" | "fixed/dilated" | "not assessed";
export type Skin = "warm/dry" | "cool/clammy" | "pale" | "diaphoretic" | "mottled" | "not assessed";
export type LevelOfResponsiveness = "A&Ox4" | "A&Ox3" | "anxious" | "confused" | "lethargic" | "unresponsive";

export type CoreTemp =
  | { kind: "unavailable"; reason?: string }
  | { kind: "estimated"; valueC: number }
  | { kind: "measured"; valueC: number; method: "oral" | "tympanic" | "rectal" | "axillary" | "temporal" | "other" };

export type WildernessVitals = {
  hr: number;
  rr: number;
  bp: BloodPressure;
  pupils: Pupils;
  skin: Skin;
  lor: LevelOfResponsiveness;
  coreTemp?: CoreTemp | null;
};

export type VitalsTimepoint = {
  minutes: 0 | 10 | 20 | 30;
  vitals: WildernessVitals;
  notes?: string[];
};

export type Setting = {
  name: string;
  notes?: string[];
  modifiers?: Record<string, number | string>;
  roll: DiceRoll;
};

export type Hazard = {
  name: string;
  notes?: string[];
  roll: DiceRoll;
};

export type PatientProfile = {
  type: string;
  cooperation: "cooperative" | "anxious" | "altered" | "minimizes symptoms";
  notes?: string[];
  roll: DiceRoll;
};

export type MoiDetails = {
  /** Printable, human-friendly MOI sentence */
  narrative: string;

  /** For falls, approximate height in feet */
  heightFt?: number;

  /** For high-speed mechanisms, approximate speed in mph */
  speedMph?: number;

  surface: "rock" | "packed dirt" | "sand" | "snow" | "pavement" | "water" | "unknown";
  landing: "feet" | "butt" | "back" | "side" | "head/face" | "multiple impacts" | "unknown";
  witnessed: boolean;

  protectiveGear?: {
    helmet?: boolean;
    pads?: boolean;
    seatbelt?: boolean; // reserved for future EMT mode
  };

  /** Derived from MOI + details */
  energy: "low" | "moderate" | "high";
};


export type ChiefComplaint = {
  statement: string;
  category: "pain" | "neurologic" | "respiratory" | "general" | "denial";
  reliability: "reliable" | "minimizes" | "confused";

  /** True if the complaint is intentionally/structurally misleading given the underlying risk */
  isMisdirecting: boolean;

  /** Optional: the injury type this complaint tends to mask (GM-facing metadata) */
  intendedToMask?: InjuryType;

  roll: DiceRoll;
  notes?: string[];
};


export type MechanismOfInjury = {
  label: string;
  roll: DiceRoll;
  modifierForInjuryCount: number;
  details: MoiDetails;
};

export type TraumaInjuryType =
  | "spinal instability"
  | "intracranial bleed"
  | "pelvic fracture"
  | "pneumothorax"
  | "internal bleeding"
  | "concussion"
  | "solid organ injury"
  | "femur fracture"
  | "rib fractures"
  | "multiple injuries"
  | "no serious injury";

export type MedicalConditionType =
  | "acute coronary syndrome"
  | "stroke"
  | "sepsis"
  | "diabetic emergency"
  | "severe dehydration"
  | "asthma exacerbation"
  | "anaphylaxis"
  | "heat illness"
  | "hypothermia"
  | "acute abdomen"
  | "no serious condition";

export type InjuryType = TraumaInjuryType | MedicalConditionType;

export type Injury = {
  id: string;
  type: InjuryType;
  summary: string;
  discoverableFindings: string[];
  suggestedActions: string[];
};

export type EscalationTrigger = {
  id: string;
  severity: "low" | "medium" | "high";
  description: string;
  condition: string;
  consequence: string;
  timeWindow?: "immediate" | "over time" | "10+ min" | "20+ min";
  relatedInjuryId?: string;
};

export type EndState = {
  id: string;
  name: "Optimal" | "Marginal" | "Failure";
  description: string;
  criteria: string[];
  debriefNotes: string[];
};

export type InjuryCountResult = {
  roll: RollWithModifier;
  injuryCount: 0 | 1 | 2 | 3;
  mappingRule: string;
};

export type GradingHints = {
  gradedFields: Array<keyof WildernessVitals>;
  notGradedNotes: string[];
};

export type ScenarioPacket = {
  meta: {
    id: string;
    createdAt: string; // ISO
    version: string;
    generatorVersion: string;
    scenarioType: "trauma" | "medical";
    seedUsed?: string;
  };

  setting: Setting;
  hazards: Hazard[];
  patient: PatientProfile;
  chiefComplaint: ChiefComplaint;
  moi: MechanismOfInjury;

  injuryCount: InjuryCountResult;
  hiddenInjuries: Injury[];

  vitalsTimeline: VitalsTimepoint[];
  expectedActions: string[];
  escalationLogic: EscalationTrigger[];
  endStates: EndState[];

  gradingHints?: GradingHints;

  // Extension point for future EMT/ALS content
  emtExtras?: Record<string, unknown>;
};
