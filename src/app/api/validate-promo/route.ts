import { NextResponse } from "next/server";
import { z } from "zod";
import { resolvePromo } from "@/lib/referrals";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({ code: z.string().min(1).max(64) });

// Validate a promo/referral code (static list + referral table). The checkout
// uses this so the discount shows before payment; the amount is still
// recomputed authoritatively in create-payment-intent.
export async function POST(req: Request) {
  const limit = rateLimit(`promo:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Please wait a moment." }, { status: 429 });
  }

  let code: string;
  try {
    code = bodySchema.parse(await req.json()).code;
  } catch {
    return NextResponse.json({ ok: false, error: "Enter a promo code." }, { status: 400 });
  }

  const result = await resolvePromo(code);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error });
  return NextResponse.json({ ok: true, code: result.code, percent: result.percent, label: result.label });
}
