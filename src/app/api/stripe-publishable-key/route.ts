import { NextResponse } from "next/server";
import { stripeEnabled } from "@/lib/stripe";

// PRD §9 — the publishable key is public but served from the backend so it
// isn't hard-coded per environment in the client bundle.
export async function GET() {
  return NextResponse.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
    enabled: stripeEnabled(),
  });
}
