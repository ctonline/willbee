"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, Loader2, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateEmail } from "@/lib/validation";

function AuthInner() {
  const params = useSearchParams();
  const linkError = params.get("error");

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-7 w-7 text-success" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-3 text-muted-foreground">
          If we have a Will saved for <strong>{email}</strong>, we’ve sent a secure
          sign-in link. It expires in 30 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Access your Will</h1>
      <p className="mt-2 text-muted-foreground">
        Enter the email you used at checkout and we’ll send you a secure link to
        download your Will again, with no password needed.
      </p>

      {linkError && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {linkError === "invalid"
              ? "That sign-in link is invalid or has expired. Please request a new one."
              : "We couldn’t sign you in. Please request a new link."}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-sm border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="auth-email">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="auth-email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!error}
              className="h-12 pl-9 text-base"
            />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            "Email me a sign-in link"
          )}
        </Button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading…</div>}>
          <AuthInner />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
