import "server-only";
import crypto from "node:crypto";
import { prisma } from "./db";
import { validatePromoCode } from "./promo";
import { SITE } from "./constants";

const APP_URL = (process.env.NEXT_PUBLIC_SITE_URL || SITE.url).replace(/\/$/, "");
const REFERRAL_PERCENT = 25;

// Unambiguous alphabet (no 0/O/1/I) for readable codes like "WB25-K7M3PQ".
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(): string {
  const bytes = crypto.randomBytes(6);
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return `WB25-${s}`;
}

/** Get the customer's referral code, creating it on first call. */
export async function getOrCreateReferralCode(email: string): Promise<{ code: string; url: string }> {
  const ownerEmail = email.trim().toLowerCase();
  const existing = await prisma.referral.findUnique({ where: { ownerEmail } });
  if (existing) return { code: existing.code, url: referralUrl(existing.code) };

  // Create with a unique code (retry on the rare collision).
  for (let i = 0; i < 5; i++) {
    const code = randomCode();
    try {
      const created = await prisma.referral.create({
        data: { code, ownerEmail, discountPercent: REFERRAL_PERCENT },
      });
      return { code: created.code, url: referralUrl(created.code) };
    } catch {
      // unique violation on code or a race on ownerEmail — re-check owner then retry
      const owner = await prisma.referral.findUnique({ where: { ownerEmail } });
      if (owner) return { code: owner.code, url: referralUrl(owner.code) };
    }
  }
  throw new Error("Could not allocate a referral code");
}

export function referralUrl(code: string): string {
  return `${APP_URL}/?ref=${encodeURIComponent(code)}`;
}

export type PromoResolution =
  | { ok: true; code: string; percent: number; label: string; kind: "static" | "referral" }
  | { ok: false; error: string };

/** Resolve a promo code against the static list first, then referral codes. */
export async function resolvePromo(input: string): Promise<PromoResolution> {
  const code = input.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a promo code." };

  // 1. Static promo codes (WELCOME10, etc.)
  const staticResult = validatePromoCode(code);
  if (staticResult.ok) {
    return {
      ok: true,
      code: staticResult.promo.code,
      percent: staticResult.promo.discountPercent,
      label: staticResult.promo.label ?? `${staticResult.promo.discountPercent}% off`,
      kind: "static",
    };
  }

  // 2. Referral codes (DB).
  const referral = await prisma.referral.findUnique({ where: { code } });
  if (referral) {
    return {
      ok: true,
      code: referral.code,
      percent: referral.discountPercent,
      label: `${referral.discountPercent}% friend referral`,
      kind: "referral",
    };
  }

  return { ok: false, error: "That code isn’t recognised." };
}

/** Best-effort: bump the applied count for a referral code. */
export async function noteReferralUse(code: string): Promise<void> {
  try {
    await prisma.referral.updateMany({ where: { code: code.trim().toUpperCase() }, data: { uses: { increment: 1 } } });
  } catch {
    /* non-fatal */
  }
}
