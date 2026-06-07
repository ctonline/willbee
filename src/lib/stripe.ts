import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

/** True when a real Stripe secret key is configured. */
export function stripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Lazily-constructed server Stripe client. Returns null in demo mode. */
export function getStripe(): Stripe | null {
  if (!stripeEnabled()) return null;
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }
  return cached;
}
