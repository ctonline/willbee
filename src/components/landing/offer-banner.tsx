import { Sparkles } from "lucide-react";
import { getPriceForDate, formatGBP, REGULAR_PRICE } from "@/lib/pricing";

/** Deep-red special-offer banner, shown only while a discount is active (§3.1, §6.1). */
export function OfferBanner() {
  const price = getPriceForDate();
  if (!price.isDiscounted || !price.offerLabel) return null;

  return (
    <div className="bg-offer text-offer-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-center text-sm">
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        <span className="font-semibold">{price.offerLabel}</span>
        <span className="opacity-90">
          Just {formatGBP(price.price)}{" "}
          <span className="line-through opacity-70">{formatGBP(REGULAR_PRICE)}</span>{" "}
          · save {price.savingsPercent}%
        </span>
      </div>
    </div>
  );
}
