"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EligibilityStop({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
        <Info className="h-7 w-7 text-accent-foreground" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        WillBee isn’t the right fit just now
      </h1>
      <p className="mt-4 text-muted-foreground">
        Based on your answers, WillBee can’t create a valid Scottish Will for you
        at the moment. To make a Will with us you need to be aged 12 or over,
        domiciled in Scotland, and have the mental capacity to make decisions
        today.
      </p>
      <p className="mt-4 text-muted-foreground">
        If your circumstances are more complex, we’d recommend speaking with a
        Scottish solicitor who can advise you directly.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button render={<Link href="/" />} variant="outline">
          Back to home
        </Button>
        <Button onClick={onRestart}>Start over</Button>
      </div>
    </div>
  );
}
