"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { AlertTriangle, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Cache the Stripe.js promise per publishable key.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise(key: string) {
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

function PayInner({
  amountLabel,
  onPaid,
}: {
  amountLabel: string;
  onPaid: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please check your card details.");
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (
      paymentIntent &&
      (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")
    ) {
      onPaid(paymentIntent.id);
    } else {
      setError("Payment could not be completed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={!stripe || submitting}
        className="w-full gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Processing…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden />
            Pay {amountLabel}
          </>
        )}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden />
        Payments are processed securely by Stripe. We never store your card details.
      </p>
    </form>
  );
}

export function StripePayment({
  publishableKey,
  clientSecret,
  amountLabel,
  onPaid,
}: {
  publishableKey: string;
  clientSecret: string;
  amountLabel: string;
  onPaid: (paymentIntentId: string) => void;
}) {
  return (
    <Elements
      stripe={getStripePromise(publishableKey)}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#1f6a4e", borderRadius: "4px" },
        },
      }}
    >
      <PayInner amountLabel={amountLabel} onPaid={onPaid} />
    </Elements>
  );
}
