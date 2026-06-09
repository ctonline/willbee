"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Tag,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceSummary } from "@/components/checkout/price-summary";
import { StripePayment } from "@/components/checkout/stripe-payment";
import {
  loadAnswers,
  loadEmail,
  saveEmail,
  isCompleted,
  markPaid,
  loadRef,
} from "@/lib/client-store";
import { buildWillData } from "@/lib/will-builder";
import {
  getPriceForDate,
  applyDiscountPercent,
  formatGBP,
  type PriceInfo,
} from "@/lib/pricing";
import { validateEmail } from "@/lib/validation";
import type { WillData } from "@/lib/types";

type Step = "email" | "pay";

interface IntentConfig {
  demo: boolean;
  publishableKey: string;
  clientSecret: string | null;
  paymentIntentId: string | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [will, setWill] = useState<WillData | null>(null);
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [price, setPrice] = useState<PriceInfo>(getPriceForDate());
  const [config, setConfig] = useState<IntentConfig | null>(null);
  const [creating, setCreating] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [finalising, setFinalising] = useState(false);

  // Hydrate answers + email from local storage (unavailable during SSR).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const answers = loadAnswers();
    setEmail(loadEmail());
    if (isCompleted() && Object.keys(answers).length > 0) {
      setWill(buildWillData(answers));
    }
    setHydrated(true);

    // Auto-apply a referral code from a shared link (captured into storage).
    // We set the discount for display now; the email step creates the intent
    // with this code, and the amount is recomputed server-side before charging.
    const ref = loadRef();
    if (ref) {
      (async () => {
        try {
          const res = await fetch("/api/validate-promo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: ref }),
          });
          const data = await res.json();
          if (data.ok) {
            setAppliedPromo(data.code);
            setPromoInput(data.code);
            setPrice(applyDiscountPercent(getPriceForDate(), data.percent));
          }
        } catch {
          /* ignore — they can still apply manually */
        }
      })();
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const createIntent = useCallback(
    async (promoCode: string | null) => {
      setCreating(true);
      setIntentError(null);
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, promoCode, willData: will }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not start checkout.");

        let key = "";
        if (!data.demo) {
          const keyRes = await fetch("/api/stripe-publishable-key");
          const keyData = await keyRes.json();
          key = keyData.publishableKey;
        }
        setConfig({
          demo: !!data.demo,
          publishableKey: key,
          clientSecret: data.client_secret ?? null,
          paymentIntentId: data.payment_intent_id ?? null,
        });
      } catch (e) {
        setIntentError(e instanceof Error ? e.message : "Could not start checkout.");
      } finally {
        setCreating(false);
      }
    },
    [email, will],
  );

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setEmailError(null);
    saveEmail(email.trim());
    setStep("pay");
    void createIntent(appliedPromo);
  }

  async function applyPromo() {
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Enter a promo code.");
      return;
    }
    try {
      const res = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPromoError(data.error || "That code isn’t recognised.");
        return;
      }
      setPromoError(null);
      setAppliedPromo(data.code);
      setPromoInput(data.code);
      setPrice(applyDiscountPercent(getPriceForDate(), data.percent));
      void createIntent(data.code);
    } catch {
      setPromoError("Couldn’t check that code. Please try again.");
    }
  }

  function removePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
    setPrice(getPriceForDate());
    void createIntent(null);
  }

  const finalise = useCallback(
    async (paymentIntentId: string) => {
      if (!will) return;
      setFinalising(true);
      try {
        const res = await fetch("/api/send-will-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            willData: will,
            userEmail: email.trim(),
            userName: will.testator.fullName,
            paymentIntentId: paymentIntentId === "demo" ? null : paymentIntentId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong.");
        markPaid(true);
        if (data.emailed === false) {
          toast.warning(
            "We couldn’t email your Will just now, but you can download it on the next page.",
          );
        }
        router.push("/download");
      } catch (e) {
        setFinalising(false);
        toast.error(e instanceof Error ? e.message : "Payment confirmation failed.");
      }
    },
    [will, email, router],
  );

  if (!hydrated) {
    return <CheckoutShell><CenterLoader /></CheckoutShell>;
  }

  // No completed Will in storage — guide the user back to the flow.
  if (!will) {
    return (
      <CheckoutShell>
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Let’s finish your Will first
          </h1>
          <p className="mt-3 text-muted-foreground">
            We couldn’t find a completed Will to check out. Please complete the
            questionnaire and we’ll bring you right back here.
          </p>
          <div className="mt-6">
            <Button render={<Link href="/" />}>Start my Will</Button>
          </div>
        </div>
      </CheckoutShell>
    );
  }

  const amountLabel = formatGBP(price.price);

  return (
    <CheckoutShell>
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_minmax(300px,360px)]">
        {/* Left: email → payment */}
        <div className="order-2 lg:order-1">
          {step === "email" ? (
            <form onSubmit={submitEmail} className="rounded-sm border bg-card p-6">
              <h1 className="text-xl font-semibold">Where should we send your Will?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We’ll email your document here and use this address if you ever
                need to download it again.
              </p>
              <div className="mt-5 space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id="email"
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                    className="h-12 pl-9 text-base"
                  />
                </div>
                {emailError && (
                  <p id="email-error" role="alert" className="text-sm text-destructive">
                    {emailError}
                  </p>
                )}
              </div>
              <Button type="submit" size="lg" className="mt-6 w-full gap-2">
                Continue to payment
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                This is not legal advice. By continuing you agree to our{" "}
                <Link href="/terms-of-service" className="underline">terms</Link>.
              </p>
            </form>
          ) : (
            <div className="rounded-sm border bg-card p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Payment</h1>
                <button
                  onClick={() => setStep("email")}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  {email}
                </button>
              </div>

              {/* Promo code */}
              <div className="mt-5">
                <Label htmlFor="promo" className="text-sm">Promo code</Label>
                {appliedPromo ? (
                  <div className="mt-1.5 flex items-center justify-between rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 font-medium text-success">
                      <Tag className="h-4 w-4" aria-hidden />
                      {appliedPromo} applied
                    </span>
                    <button
                      onClick={removePromo}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Remove promo code"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      id="promo"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="h-10"
                    />
                    <Button type="button" variant="outline" onClick={applyPromo}>
                      Apply
                    </Button>
                  </div>
                )}
                {promoError && (
                  <p role="alert" className="mt-1.5 text-sm text-destructive">{promoError}</p>
                )}
              </div>

              <div className="mt-6 border-t pt-6">
                {creating && <CenterLoader label="Preparing secure checkout…" />}

                {!creating && intentError && (
                  <div className="space-y-3 text-center">
                    <p role="alert" className="text-sm text-destructive">{intentError}</p>
                    <Button variant="outline" onClick={() => createIntent(appliedPromo)}>
                      Try again
                    </Button>
                  </div>
                )}

                {!creating && config?.demo && (
                  <DemoPay
                    amountLabel={amountLabel}
                    finalising={finalising}
                    onPay={() => finalise("demo")}
                  />
                )}

                {!creating && config && !config.demo && config.clientSecret && (
                  <>
                    {finalising ? (
                      <CenterLoader label="Confirming your payment…" />
                    ) : (
                      <StripePayment
                        publishableKey={config.publishableKey}
                        clientSecret={config.clientSecret}
                        amountLabel={amountLabel}
                        onPaid={finalise}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <div className="order-1 lg:order-2">
          <PriceSummary price={price} appliedPromo={appliedPromo} />
        </div>
      </div>
    </CheckoutShell>
  );
}

function DemoPay({
  amountLabel,
  finalising,
  onPay,
}: {
  amountLabel: string;
  finalising: boolean;
  onPay: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Demo mode</p>
        <p className="mt-1">
          No Stripe keys are configured, so payment is simulated. Add{" "}
          <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_PUBLISHABLE_KEY</code> to
          enable real card payments.
        </p>
      </div>
      <Button size="lg" className="w-full gap-2" onClick={onPay} disabled={finalising}>
        {finalising ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Processing…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden />
            Simulate payment of {amountLabel}
          </>
        )}
      </Button>
    </div>
  );
}

function CenterLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">{children}</main>
    </>
  );
}
