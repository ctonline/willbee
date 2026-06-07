"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Download, Loader2, CheckCircle2, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { NextSteps } from "@/components/download/next-steps";
import { loadAnswers, loadEmail, isPaid } from "@/lib/client-store";
import { buildWillData, willFilename } from "@/lib/will-builder";
import { downloadWill } from "@/lib/pdf/render-client";
import type { WillData } from "@/lib/types";

type State =
  | { kind: "loading" }
  | { kind: "ready"; will: WillData; email: string }
  | { kind: "unpaid" }
  | { kind: "none" };

export default function DownloadPage() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [downloading, setDownloading] = useState(false);

  // localStorage / session lookups are client-only, so resolve state in an effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Primary path: locally-completed + paid Will.
    const answers = loadAnswers();
    const email = loadEmail();
    if (isPaid() && Object.keys(answers).length > 0) {
      setState({ kind: "ready", will: buildWillData(answers), email });
      return;
    }

    // Returning user via magic link — fetch the stored Will from the session.
    (async () => {
      try {
        const res = await fetch("/api/will");
        if (res.ok) {
          const data = await res.json();
          setState({ kind: "ready", will: data.willData, email: data.email });
          return;
        }
      } catch {
        /* fall through */
      }
      // If they have answers but haven't paid, send them to checkout.
      setState(Object.keys(answers).length > 0 ? { kind: "unpaid" } : { kind: "none" });
    })();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDownload = useCallback(async (will: WillData) => {
    setDownloading(true);
    try {
      await downloadWill(will, willFilename(will.testator.fullName));
    } catch {
      toast.error("Sorry, we couldn’t generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        {state.kind === "loading" && (
          <div className="flex flex-col items-center gap-2 py-24 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <p className="text-sm">Preparing your document…</p>
          </div>
        )}

        {state.kind === "none" && (
          <Empty
            title="Nothing to download yet"
            body="We couldn’t find a paid Will on this device. If you’ve made one before, use the link we emailed you to sign back in."
            cta={{ href: "/", label: "Create my Will" }}
            secondary={{ href: "/auth", label: "Sign in with email" }}
          />
        )}

        {state.kind === "unpaid" && (
          <Empty
            title="One more step"
            body="Your Will is ready, but it looks like payment wasn’t completed. Finish checkout to download your document."
            cta={{ href: "/checkout", label: "Complete checkout" }}
          />
        )}

        {state.kind === "ready" && (
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="mb-5 flex items-center gap-2 text-success">
                <CheckCircle2 className="h-6 w-6" aria-hidden />
                <span className="font-semibold">Payment complete</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Your Will is ready to download
              </h1>
              <p className="mt-3 text-muted-foreground">
                Download your PDF below. We’ve also emailed a copy
                {state.email ? <> to <strong>{state.email}</strong></> : null} with
                these instructions attached.
              </p>

              <div className="mt-6">
                <Button
                  size="lg"
                  className="gap-2"
                  disabled={downloading}
                  onClick={() => handleDownload(state.will)}
                >
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" aria-hidden />
                      Download my Will (PDF)
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 flex items-start gap-2 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  Didn’t get the email? Check your spam folder, or download again
                  here any time. This document is not legal advice.
                </span>
              </div>
            </div>

            <div className="rounded-sm border bg-card p-6">
              <NextSteps />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function Empty({
  title,
  body,
  cta,
  secondary,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted-foreground">{body}</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button render={<Link href={cta.href} />}>{cta.label}</Button>
        {secondary && (
          <Button variant="outline" render={<Link href={secondary.href} />}>
            {secondary.label}
          </Button>
        )}
      </div>
    </div>
  );
}
