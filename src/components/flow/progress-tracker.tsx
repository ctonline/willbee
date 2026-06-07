"use client";

import { Check } from "lucide-react";
import { SECTIONS, type SectionId } from "@/lib/questions";
import { cn } from "@/lib/utils";

interface Props {
  currentSection: SectionId;
  completedSections: Set<SectionId>;
  /** 0–100 overall progress through the visible questions. */
  percent: number;
}

export function ProgressTracker({
  currentSection,
  completedSections,
  percent,
}: Props) {
  const currentIndex = SECTIONS.findIndex((s) => s.id === currentSection);

  return (
    <div className="w-full">
      <ol className="hidden items-center justify-between gap-1 sm:flex">
        {SECTIONS.map((section, i) => {
          const done = completedSections.has(section.id);
          const active = section.id === currentSection;
          return (
            <li key={section.id} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done && "border-success bg-success text-success-foreground",
                  active && !done && "border-primary bg-primary text-primary-foreground",
                  !active && !done && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-center text-[11px] leading-tight",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {section.shortTitle}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact label + bar */}
      <div className="mb-2 flex items-center justify-between sm:hidden">
        <span className="text-sm font-medium">
          {SECTIONS[currentIndex]?.title}
        </span>
        <span className="text-xs text-muted-foreground">
          Step {currentIndex + 1} of {SECTIONS.length}
        </span>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall progress"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
