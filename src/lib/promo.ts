// Promo codes (PRD §6.2). Validated client-side against a small in-app list.
// Applying a code creates a new payment intent at the new total; removing it
// reverts to the current dynamic price.

export interface PromoCode {
  code: string;
  discountPercent: number;
  /** ISO date; the code is invalid on/after this date. */
  expiresAt: string;
  label?: string;
}

// In-app promo list. In a real deployment this could come from a CMS or DB.
export const PROMO_CODES: PromoCode[] = [
  { code: "WELCOME10", discountPercent: 10, expiresAt: "2027-01-01", label: "Welcome 10% off" },
  { code: "FAMILY25", discountPercent: 25, expiresAt: "2027-01-01", label: "Family 25% off" },
  { code: "LAUNCH50", discountPercent: 50, expiresAt: "2026-12-31", label: "Launch 50% off" },
];

export type PromoResult =
  | { ok: true; promo: PromoCode }
  | { ok: false; error: string };

/** Validate a user-entered promo code against the in-app list. */
export function validatePromoCode(
  input: string,
  now: Date = new Date(),
): PromoResult {
  const normalised = input.trim().toUpperCase();
  if (!normalised) return { ok: false, error: "Enter a promo code." };

  const promo = PROMO_CODES.find((p) => p.code === normalised);
  if (!promo) return { ok: false, error: "That code isn’t recognised." };

  if (now >= new Date(promo.expiresAt)) {
    return { ok: false, error: "That code has expired." };
  }

  return { ok: true, promo };
}
