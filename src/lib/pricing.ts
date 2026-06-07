// Pricing rules (PRD §6.1). Determined at runtime by date.
//
//   2025            → £9.99  "2025 Special Offer"
//   Any September   → £19    "September Special Offer"
//   Otherwise       → £49    (regular)
//
// The original price (£49) is shown struck through whenever a discount applies,
// along with the percentage saved.

export const REGULAR_PRICE = 49;
export const CURRENCY = "gbp";

export interface PriceInfo {
  /** Amount actually charged, in whole GBP pounds. */
  price: number;
  /** Undiscounted reference price. */
  originalPrice: number;
  /** Whether a discount is currently active. */
  isDiscounted: boolean;
  /** Whole-percent saving vs. the original price (0 when not discounted). */
  savingsPercent: number;
  /** Short label for the active offer, or null. */
  offerLabel: string | null;
  /** Amount in the smallest currency unit (pence) for Stripe. */
  amountInPence: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Resolve the active price for a given date (defaults to now).
 * Pass an explicit date in tests to make this deterministic.
 */
export function getPriceForDate(date: Date = new Date()): PriceInfo {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = January … 8 = September

  let price = REGULAR_PRICE;
  let offerLabel: string | null = null;

  if (year === 2025) {
    price = 9.99;
    offerLabel = "2025 Special Offer";
  } else if (month === 8) {
    // September, in any year other than 2025 (2025 already handled above)
    price = 19;
    offerLabel = "September Special Offer";
  }

  const isDiscounted = price < REGULAR_PRICE;
  const savingsPercent = isDiscounted
    ? Math.round(((REGULAR_PRICE - price) / REGULAR_PRICE) * 100)
    : 0;

  return {
    price: round2(price),
    originalPrice: REGULAR_PRICE,
    isDiscounted,
    savingsPercent,
    offerLabel,
    amountInPence: Math.round(price * 100),
  };
}

/** Format a whole/decimal GBP amount as e.g. "£9.99" or "£49". */
export function formatGBP(amount: number): string {
  const hasPence = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: hasPence ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Apply a discount percentage to a base price, returning the new PriceInfo-like total. */
export function applyDiscountPercent(
  base: PriceInfo,
  discountPercent: number,
): PriceInfo {
  const price = round2(base.price * (1 - discountPercent / 100));
  const savingsPercent = Math.round(
    ((base.originalPrice - price) / base.originalPrice) * 100,
  );
  return {
    ...base,
    price,
    isDiscounted: true,
    savingsPercent,
    amountInPence: Math.round(price * 100),
  };
}
