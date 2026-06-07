import { NextResponse } from "next/server";
import { z } from "zod";
import { willDataSchema } from "@/lib/will-schema";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { deliverWill } from "@/lib/deliver-will";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  willData: willDataSchema,
  userEmail: z.string().email(),
  userName: z.string().min(1),
  paymentIntentId: z.string().optional().nullable(),
});

// PRD §9 — POST /send-will-email. Validates payment server-side (§4) before
// persisting and emailing the Will.
export async function POST(req: Request) {
  const limit = rateLimit(`email:${clientIp(req)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    const issue =
      e instanceof z.ZodError ? e.issues[0]?.message : "Invalid request.";
    return NextResponse.json({ error: issue }, { status: 400 });
  }

  const { willData, userEmail, paymentIntentId } = body;

  // Validate payment server-side before delivering anything. This is the fast
  // path that runs immediately after the client confirms payment, so the user
  // gets an instant download; the Stripe webhook is the backstop for any case
  // where this call never fires (closed tab, async payment method).
  if (stripeEnabled()) {
    if (!paymentIntentId) {
      return NextResponse.json({ error: "Missing payment reference." }, { status: 402 });
    }
    try {
      const intent = await getStripe()!.paymentIntents.retrieve(paymentIntentId);
      const okStatuses = ["succeeded", "processing"];
      if (!okStatuses.includes(intent.status)) {
        return NextResponse.json(
          { error: `Payment not completed (status: ${intent.status}).` },
          { status: 402 },
        );
      }
    } catch {
      return NextResponse.json({ error: "Could not verify payment." }, { status: 402 });
    }
  }

  // Persist + render + email exactly once (idempotent with the webhook). In
  // production the stored pending Will is used; the fallback covers demo mode.
  const result = await deliverWill({
    paymentId: paymentIntentId,
    fallback: { email: userEmail, willData },
  });

  if (!result.delivered) {
    return NextResponse.json({ error: result.error ?? "Could not save your Will." }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    emailed: result.emailed || result.alreadyDelivered,
    emailError: result.error,
  });
}
