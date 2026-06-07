"use client";

import { Check } from "lucide-react";
import { formatGBP, REGULAR_PRICE, type PriceInfo } from "@/lib/pricing";

const INCLUDED = [
  "Legally-structured Scottish Will (PDF)",
  "Emailed copy with signing instructions",
  "Step-by-step witnessing guide",
  "Re-download any time via your email",
];

export function PriceSummary({
  price,
  appliedPromo,
}: {
  price: PriceInfo;
  appliedPromo: string | null;
}) {
  return (
    <div className="rounded-sm border bg-card p-6">
      <h2 className="text-lg font-medium">Order summary</h2>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-muted-foreground">Your Scottish Will</span>
        <div className="text-right">
          {price.isDiscounted && (
            <span className="mr-2 text-sm text-muted-foreground line-through">
              {formatGBP(REGULAR_PRICE)}
            </span>
          )}
          <span className="text-2xl font-semibold">{formatGBP(price.price)}</span>
        </div>
      </div>

      {price.isDiscounted && (
        <p className="mt-1 text-right text-sm font-medium text-success">
          {appliedPromo
            ? `Promo ${appliedPromo} applied`
            : price.offerLabel}{" "}
          · save {price.savingsPercent}%
        </p>
      )}

      <ul className="mt-5 space-y-2 border-t pt-5 text-sm">
        {INCLUDED.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
