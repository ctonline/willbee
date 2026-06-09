import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { resolveServerPrice } from "@/lib/server-pricing";
import { noteReferralUse } from "@/lib/referrals";
import { CURRENCY } from "@/lib/pricing";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { willDataSchema } from "@/lib/will-schema";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  email: z.string().email(),
  promoCode: z.string().optional().nullable(),
  // The completed Will, stored server-side as a pending (unpaid) record so the
  // Stripe webhook can deliver it without trusting client-supplied data later.
  willData: willDataSchema,
});

// PRD §9 — POST /create-payment-intent → { client_secret, payment_intent_id }.
// The amount is always computed server-side from the active price + a
// re-validated promo code (never trust a client-supplied amount).
export async function POST(req: Request) {
  const limit = rateLimit(`pi:${clientIp(req)}`, 15, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { price, appliedPromo, promoKind } = await resolveServerPrice(body.promoCode);
  if (promoKind === "referral" && appliedPromo) void noteReferralUse(appliedPromo);

  // Demo mode — no Stripe key configured.
  if (!stripeEnabled()) {
    return NextResponse.json({
      demo: true,
      amount: price.amountInPence,
      currency: CURRENCY,
      appliedPromo,
    });
  }

  const stripe = getStripe()!;
  try {
    const intent = await stripe.paymentIntents.create({
      amount: price.amountInPence,
      currency: CURRENCY,
      receipt_email: body.email,
      automatic_payment_methods: { enabled: true },
      metadata: {
        email: body.email,
        product: "willbee_will",
        promo: appliedPromo ?? "",
      },
    });

    // Persist the Will as pending (paid: false) keyed to this PaymentIntent.
    // The webhook flips it to paid and delivers it once payment succeeds, so a
    // closed tab or async payment method can never lose a paid-for Will. A new
    // intent (e.g. after applying a promo) overwrites the row and resets the
    // delivery lock.
    try {
      await prisma.will.upsert({
        where: { email: body.email },
        create: {
          email: body.email,
          fullName: body.willData.testator.fullName,
          data: JSON.stringify(body.willData),
          paid: false,
          paymentId: intent.id,
          emailedAt: null,
        },
        update: {
          fullName: body.willData.testator.fullName,
          data: JSON.stringify(body.willData),
          paid: false,
          paymentId: intent.id,
          emailedAt: null,
        },
      });
    } catch {
      // Non-fatal: the client fast-path can still deliver with its own copy.
      console.error("Failed to store pending Will for", body.email);
    }

    return NextResponse.json({
      client_secret: intent.client_secret,
      payment_intent_id: intent.id,
      amount: price.amountInPence,
      currency: CURRENCY,
      appliedPromo,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Payment setup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
