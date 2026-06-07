// Field-level validation (PRD §6.3) used by the Q&A engine and the WillData
// builder. Each validator returns an error string, or null when valid.

export type Validator = (value: unknown, answers?: Record<string, unknown>) => string | null;

export function isNonEmpty(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

/** Names ≥ 2 chars. */
export const validateName: Validator = (value) => {
  const s = String(value ?? "").trim();
  if (s.length < 2) return "Please enter a full name (at least 2 characters).";
  return null;
};

/** Addresses ≥ 10 chars. */
export const validateAddress: Validator = (value) => {
  const s = String(value ?? "").trim();
  if (s.length < 10) return "Please enter a full address (at least 10 characters).";
  return null;
};

/** Compute whole-years age at `on` (default today). */
export function ageFromDOB(dob: string, on: Date = new Date()): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return NaN;
  let age = on.getFullYear() - d.getFullYear();
  const m = on.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < d.getDate())) age--;
  return age;
}

/** DOB must make the user ≥ 12 and not be in the future. */
export const validateDOB: Validator = (value) => {
  const s = String(value ?? "").trim();
  if (!s) return "Please enter your date of birth.";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "Please enter a valid date.";
  if (d.getTime() > Date.now()) return "Date of birth can’t be in the future.";
  if (ageFromDOB(s) < 12) return "You must be at least 12 years old to make a Will in Scotland.";
  return null;
};

export const validateEmail: Validator = (value) => {
  const s = String(value ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "Please enter a valid email address.";
  return null;
};

/** A single residue share: integer 1–100. */
export const validateShare: Validator = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n)) return "Share must be a whole number.";
  if (n < 1 || n > 100) return "Share must be between 1 and 100.";
  return null;
};

/** Residue shares (PRD §6.3): integers 1–100 that sum to exactly 100. */
export function validateResidueShares(shares: number[]): string | null {
  if (shares.length === 0) return "Add at least one residue beneficiary.";
  for (const s of shares) {
    if (!Number.isInteger(s) || s < 1 || s > 100) {
      return "Each share must be a whole number between 1 and 100.";
    }
  }
  const total = shares.reduce((a, b) => a + b, 0);
  if (total !== 100) return `Shares must add up to 100% (currently ${total}%).`;
  return null;
}
