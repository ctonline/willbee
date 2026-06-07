// Transforms the flat Q&A answer map into the structured WillData object
// (PRD §5) consumed by the PDF generator and the email service.

import type {
  Answers,
  WillData,
  Person,
  Legacy,
  LegacyType,
  ResidueBeneficiary,
  MaritalStatus,
} from "./types";
import { MAX_LEGACIES, MAX_RESIDUE } from "./questions";

const DEFAULT_VESTING_AGE = 16;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function int(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function isYes(v: unknown): boolean {
  return v === "yes";
}

/** Build the residue beneficiary list, giving the final beneficiary the remainder. */
export function buildResidueBeneficiaries(a: Answers): ResidueBeneficiary[] {
  const count = Math.min(MAX_RESIDUE, Math.max(1, int(a.residue_count, 1)));
  const out: ResidueBeneficiary[] = [];

  let allocated = 0;
  for (let i = 0; i < count; i++) {
    const name = str(a[`residue_${i}_name`]);
    const isLast = i === count - 1;
    let share: number;
    if (count === 1) {
      share = 100;
    } else if (isLast) {
      share = Math.max(0, 100 - allocated);
    } else {
      share = int(a[`residue_${i}_share`]);
      allocated += share;
    }
    out.push({ name, sharePercent: share, ifPredecease: "to_others" });
  }
  return out;
}

function buildLegacies(a: Answers): Legacy[] {
  if (!isYes(a.legacy_want)) return [];
  const count = Math.min(MAX_LEGACIES, Math.max(0, int(a.legacy_count)));
  const out: Legacy[] = [];
  for (let i = 0; i < count; i++) {
    const type = (str(a[`legacy_${i}_type`]) || "specific") as LegacyType;
    out.push({
      type,
      amountOrDescription: str(a[`legacy_${i}_desc`]),
      beneficiary: { name: str(a[`legacy_${i}_beneficiary`]) },
      ifPredecease: "to_residue",
    });
  }
  return out;
}

function buildSubstitutes(a: Answers): Person[] {
  const subs: Person[] = [];
  if (isYes(a.exec_want_substitute)) {
    subs.push({ name: str(a.exec_sub1_name), address: str(a.exec_sub1_address) });
    if (isYes(a.exec_want_substitute2)) {
      subs.push({ name: str(a.exec_sub2_name), address: str(a.exec_sub2_address) });
    }
  }
  return subs;
}

function buildGuardians(a: Answers): Person[] {
  if (!isYes(a.guard_has_children)) return [];
  return [{ name: str(a.guard_name), address: str(a.guard_address) }];
}

/** Build the full WillData object from answers. */
export function buildWillData(a: Answers): WillData {
  const legalRightsShown =
    a.final_legal_rights === "understand" ||
    a.final_legal_rights_confirm === "understand";

  return {
    testator: {
      fullName: str(a.personal_name),
      address: str(a.personal_address),
      dateOfBirth: str(a.personal_dob),
      maritalStatus: (str(a.personal_marital) || "Single") as MaritalStatus,
      domicileScotland: isYes(a.elig_domicile),
      hasCapacityToday: isYes(a.elig_capacity),
    },
    executors: {
      primary: [
        { name: str(a.exec_primary_name), address: str(a.exec_primary_address) },
      ],
      substitutes: buildSubstitutes(a),
    },
    guardians: buildGuardians(a),
    legacies: buildLegacies(a),
    residue: {
      beneficiaries: buildResidueBeneficiaries(a),
    },
    property: {
      hasJointProperty: false,
      survivorshipDestination: false,
    },
    powers: {
      investment: true,
      advanceToBeneficiaries: true,
      trustCreationIfMinor: { ageVesting: DEFAULT_VESTING_AGE },
    },
    funeral: {
      preferences: isYes(a.final_funeral_want) ? str(a.final_funeral_text) : "",
      notes: "",
    },
    digitalAssets: {
      instructions: isYes(a.final_digital_want) ? str(a.final_digital_text) : "",
    },
    acknowledgements: {
      legalRightsNoticeShown: legalRightsShown,
      notLegalAdvice: true,
    },
  };
}

/** Safe filename stem: "Jane Elizabeth MacDonald" → "Jane_Elizabeth_MacDonald". */
export function willFilename(fullName: string): string {
  const stem =
    fullName
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "_") || "My";
  return `${stem}_Will.pdf`;
}
