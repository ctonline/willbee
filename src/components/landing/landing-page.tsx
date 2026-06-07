import {
  ShieldCheck,
  Clock,
  MessageSquareText,
  Check,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { SiteFooter } from "@/components/site-footer";
import { OfferBanner } from "./offer-banner";
import { StartButton } from "@/components/flow/start-button";
import {
  TESTIMONIALS,
  FEATURES,
  TRUST_BADGES,
  WHAT_YOU_NEED,
  DISCLAIMERS,
  SITE,
} from "@/lib/constants";
import {
  getPriceForDate,
  formatGBP,
  REGULAR_PRICE,
} from "@/lib/pricing";

const BADGE_ICONS = [ShieldCheck, Clock, MessageSquareText];

export function LandingPage() {
  const price = getPriceForDate();

  return (
    <>
      <OfferBanner />

      {/* Header */}
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <span className="font-serif text-xl font-medium tracking-tight">
            Will<span className="text-primary">Bee</span>
          </span>
          <StartButton size="sm">Start Now</StartButton>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
            <p className="mb-7 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px w-8 bg-border" aria-hidden />
              Last Will &amp; Testament · Scots law
              <span className="h-px w-8 bg-border" aria-hidden />
            </p>
            <h1 className="text-balance text-4xl font-medium tracking-tight sm:text-6xl">
              {SITE.tagline}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              A guided, plain-English Last Will and Testament for adults domiciled
              in Scotland. No solicitor, no jargon: answer a few questions and
              download your document.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <StartButton size="lg" className="gap-2">
                Start Now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </StartButton>
              <span className="text-sm text-muted-foreground">
                {price.isDiscounted ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {formatGBP(price.price)}
                    </span>{" "}
                    <span className="line-through">{formatGBP(REGULAR_PRICE)}</span>{" "}
                    · 10–15 minutes
                  </>
                ) : (
                  <>From {formatGBP(price.price)} · 10–15 minutes</>
                )}
              </span>
            </div>

            {/* Trust row */}
            <ul className="mx-auto mt-14 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border pt-7 text-sm">
              {TRUST_BADGES.map((badge, i) => {
                const Icon = BADGE_ICONS[i] ?? ShieldCheck;
                return (
                  <li
                    key={badge}
                    className="flex items-center gap-2 font-medium text-foreground"
                  >
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                    {badge}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Features — a divided ledger, not floating cards */}
        <section className="border-t bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-card p-7">
                  <h3 className="font-serif text-xl font-medium tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What you'll need */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid items-start gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                What you’ll need
              </h2>
              <p className="mt-3 text-muted-foreground">
                Have these to hand before you start. It only takes about ten to
                fifteen minutes from beginning to end.
              </p>
            </div>
            <ul className="space-y-3">
              {WHAT_YOU_NEED.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15">
                    <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-y bg-surface/50">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              One simple price
            </h2>
            {price.offerLabel && (
              <Badge className="mt-4 bg-offer text-offer-foreground hover:bg-offer">
                {price.offerLabel}
              </Badge>
            )}
            <div className="mt-6 flex items-end justify-center gap-3">
              <span className="text-5xl font-semibold tracking-tight">
                {formatGBP(price.price)}
              </span>
              {price.isDiscounted && (
                <span className="pb-2 text-xl text-muted-foreground line-through">
                  {formatGBP(REGULAR_PRICE)}
                </span>
              )}
            </div>
            {price.isDiscounted && (
              <p className="mt-2 text-sm font-medium text-success">
                You save {price.savingsPercent}% today
              </p>
            )}
            <p className="mt-4 text-muted-foreground">
              A one-off payment. No subscriptions, no hidden fees. Includes your
              downloadable PDF, an emailed copy, and step-by-step signing
              instructions.
            </p>
            <div className="mt-8">
              <StartButton size="lg" className="gap-2">
                Create my Will
                <ArrowRight className="h-4 w-4" aria-hidden />
              </StartButton>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Trusted by families across Scotland
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="border-border bg-card shadow-none">
                <CardContent className="flex h-full flex-col p-6">
                  <StarRating rating={t.rating} />
                  <p className="mt-4 flex-1 font-serif text-[0.975rem] leading-relaxed">
                    “{t.quote}”
                  </p>
                  <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
                      aria-hidden
                    >
                      {t.name.charAt(0)}
                    </span>
                    <div className="text-sm">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-muted-foreground">{t.town}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Disclaimers */}
        <section className="border-t bg-surface/50">
          <div className="mx-auto max-w-3xl px-4 py-14">
            <h2 className="text-lg font-semibold">Important: please read</h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              This is not legal advice.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {DISCLAIMERS.map((d) => (
                <li key={d} className="flex gap-2">
                  <span aria-hidden className="text-muted-foreground/60">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to get peace of mind?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Your Will, sorted today. It only takes a few minutes.
          </p>
          <div className="mt-8">
            <StartButton size="lg" className="gap-2">
              Start Now
              <ArrowRight className="h-4 w-4" aria-hidden />
            </StartButton>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
