"use client";

import { Button } from "@/components/ui/button";
import { useFlowStart } from "./flow-gate";
import { cn } from "@/lib/utils";

/** A CTA that begins the Q&A flow. Safe to use inside server components. */
export function StartButton({
  children = "Start Now",
  size = "lg",
  variant = "default",
  className,
}: {
  children?: React.ReactNode;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
}) {
  const { start } = useFlowStart();
  return (
    <Button size={size} variant={variant} onClick={start} className={cn(className)}>
      {children}
    </Button>
  );
}
