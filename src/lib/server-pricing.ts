import "server-only";
import { getPriceForDate, applyDiscountPercent, type PriceInfo } from "./pricing";
import { validatePromoCode } from "./promo";

/**
 * Authoritative price computed on the server (never trust a client-supplied
 * amount). Applies the active dynamic price and, optionally, a valid promo code.
 */
export function resolveServerPrice(promoCode?: string | null): {
  price: PriceInfo;
  appliedPromo: string | null;
} {
  const base = getPriceForDate();
  if (promoCode) {
    const result = validatePromoCode(promoCode);
    if (result.ok) {
      return {
        price: applyDiscountPercent(base, result.promo.discountPercent),
        appliedPromo: result.promo.code,
      };
    }
  }
  return { price: base, appliedPromo: null };
}
