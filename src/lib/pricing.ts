// Pricing (PRD §6.1). A flat limited-time offer: the current price is shown as
// a discount from the £49 regular price (struck through, with the % saved).

export const REGULAR_PRICE = 49;
export const CURRENT_PRICE = 9.99;
export const OFFER_LABEL = "Limited-time offer";
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

/** The active price. (Name kept as `getPriceForDate` for call-site compatibility.) */
export function getPriceForDate(): PriceInfo {
  const price = CURRENT_PRICE;
  const isDiscounted = price < REGULAR_PRICE;
  const savingsPercent = isDiscounted
    ? Math.round(((REGULAR_PRICE - price) / REGULAR_PRICE) * 100)
    : 0;

  return {
    price: round2(price),
    originalPrice: REGULAR_PRICE,
    isDiscounted,
    savingsPercent,
    offerLabel: isDiscounted ? OFFER_LABEL : null,
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
