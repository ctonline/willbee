import "server-only";
import { getPriceForDate, applyDiscountPercent, type PriceInfo } from "./pricing";
import { resolvePromo } from "./referrals";

/**
 * Authoritative price computed on the server (never trust a client-supplied
 * amount). Applies the active dynamic price and, optionally, a valid promo or
 * referral code (resolved against the static list and the referral table).
 */
export async function resolveServerPrice(promoCode?: string | null): Promise<{
  price: PriceInfo;
  appliedPromo: string | null;
  promoKind: "static" | "referral" | null;
}> {
  const base = getPriceForDate();
  if (promoCode) {
    const r = await resolvePromo(promoCode);
    if (r.ok) {
      return {
        price: applyDiscountPercent(base, r.percent),
        appliedPromo: r.code,
        promoKind: r.kind,
      };
    }
  }
  return { price: base, appliedPromo: null, promoKind: null };
}
