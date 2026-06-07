// ── Core domain types ───────────────────────────────────────────────────────
// The structured WillData object (PRD §5) produced by the Q&A engine and
// consumed by the PDF generator and the email service.

export type MaritalStatus =
  | "Single"
  | "Married"
  | "Civil Partnership"
  | "Divorced"
  | "Widowed";

export type LegacyType = "pecuniary" | "specific" | "charitable";

export type LegacyPredecease = "to_issue" | "to_residue" | "lapse";
export type ResiduePredecease = "to_issue" | "to_others" | "lapse";

export interface Person {
  name: string;
  address: string;
}

export interface Testator {
  fullName: string;
  address: string;
  dateOfBirth: string; // ISO date (yyyy-mm-dd)
  maritalStatus: MaritalStatus;
  domicileScotland: boolean;
  hasCapacityToday: boolean;
}

export interface Executors {
  primary: Person[]; // exactly 1 required
  substitutes: Person[]; // 0..2
}

export interface Legacy {
  type: LegacyType;
  amountOrDescription: string;
  beneficiary: {
    name: string;
    relationship?: string;
    address?: string;
  };
  ifPredecease: LegacyPredecease; // default "to_residue"
}

export interface ResidueBeneficiary {
  name: string;
  sharePercent: number; // integer; all shares sum to 100
  ifPredecease: ResiduePredecease; // default "to_others"
}

export interface WillData {
  testator: Testator;
  executors: Executors;
  guardians: Person[]; // 0 or 1 in v1
  legacies: Legacy[];
  residue: {
    beneficiaries: ResidueBeneficiary[];
  };
  property: {
    hasJointProperty: boolean;
    survivorshipDestination: boolean;
  };
  powers: {
    investment: boolean;
    advanceToBeneficiaries: boolean;
    trustCreationIfMinor: { ageVesting: number }; // default 16
  };
  funeral: {
    preferences: string;
    notes: string;
  };
  digitalAssets: {
    instructions: string;
  };
  acknowledgements: {
    legalRightsNoticeShown: boolean;
    notLegalAdvice: boolean;
  };
}

// ── Q&A answer store ────────────────────────────────────────────────────────
// The conversational engine stores a flat map of answers keyed by question id.
// `Answers` is intentionally permissive — values are normalised when building
// the WillData object (see lib/will-builder.ts).

export type AnswerValue = string | number | boolean | undefined;

export interface Answers {
  [questionId: string]: AnswerValue;
}
