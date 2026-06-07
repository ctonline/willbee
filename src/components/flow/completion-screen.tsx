"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompletionScreen() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="h-9 w-9 text-success" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Your Will is ready
      </h1>
      <p className="mt-4 text-muted-foreground">
        We’ve put together your legally-structured Scottish Will based on your
        answers. The next step is to confirm your email and complete your one-off
        payment. Then you can download your document straight away, and we’ll
        email you a copy with signing instructions.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Remember: WillBee provides a document-generation service and this is not
        legal advice.
      </p>
      <div className="mt-8">
        <Button size="lg" onClick={() => router.push("/checkout")} className="gap-2">
          Get my document
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
