import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { deliverWill } from "@/lib/deliver-will";

// Stripe needs the raw request body to verify the signature, and the Stripe
// Node SDK requires the Node.js runtime (not Edge).
export const runtime = "nodejs";

// PRD §9 — Stripe webhook: the reliable delivery path. When a PaymentIntent
// succeeds, deliver the pending Will (mark paid, render PDF, email) idempotently
// with the client fast-path. Configure the endpoint in the Stripe dashboard for
// `payment_intent.succeeded` and set STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe()!.webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const result = await deliverWill({ paymentId: intent.id });

    // Already delivered (the fast-path beat us), or nothing to deliver: ack so
    // Stripe stops retrying. A genuine delivery/email failure returns 500 so
    // Stripe retries the webhook later.
    if (!result.delivered && result.error && !/no matching will/i.test(result.error)) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    if (result.error && !result.alreadyDelivered && !result.emailed) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
