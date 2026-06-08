"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildQuestionList,
  eligibilityFailed,
  resolveDynamic,
  SECTIONS,
  type Question,
  type SectionId,
} from "@/lib/questions";
import type { Answers, AnswerValue } from "@/lib/types";
import { toast } from "sonner";
import {
  loadAnswers,
  saveAnswers,
  markCompleted,
  loadStep,
  saveStep,
} from "@/lib/client-store";
import { ProgressTracker } from "./progress-tracker";
import { QuestionInput } from "./question-input";
import { EligibilityStop } from "./eligibility-stop";
import { ReviewScreen } from "./review-screen";
import { CompletionScreen } from "./completion-screen";

type Phase = "questions" | "review" | "complete";

export function WillFlow({ onExit }: { onExit: () => void }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("questions");
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate persisted answers once on mount. localStorage isn't available during
  // SSR, so reading it in an effect is the correct pattern here.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setAnswers(loadAnswers());
    setIndex(loadStep());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Persist answers whenever they change (after hydration).
  useEffect(() => {
    if (hydrated) saveAnswers(answers);
  }, [answers, hydrated]);

  // Persist the current step so Save & exit can resume in place.
  useEffect(() => {
    if (hydrated) saveStep(index);
  }, [index, hydrated]);

  // Keep the cursor within bounds if branching shrinks the question list.
  useEffect(() => {
    if (!hydrated || phase !== "questions") return;
    const len = buildQuestionList(answers).length;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (index > len - 1 && len > 0) setIndex(len - 1);
  }, [answers, hydrated, phase, index]);

  const questions = useMemo(() => buildQuestionList(answers), [answers]);
  const failed = eligibilityFailed(answers);
  const current: Question | undefined = questions[index];

  const setAnswer = useCallback((id: string, value: AnswerValue) => {
    setError(null);
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const validateCurrent = useCallback((): string | null => {
    if (!current) return null;
    if (current.type === "info") return null;
    const value = answers[current.id];
    if (current.required) {
      const empty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "");
      if (empty) return "Please answer this question to continue.";
    }
    if (current.validate) {
      const v = current.validate(value, answers);
      if (v) return v;
    }
    // Dynamic numeric bounds (e.g. residue share max).
    if (current.type === "number" && value !== undefined) {
      const n = Number(value);
      const min = current.min !== undefined ? resolveDynamic(current.min, answers) : undefined;
      const max = current.max !== undefined ? resolveDynamic(current.max, answers) : undefined;
      if (min !== undefined && n < min) return `Enter a value of at least ${min}.`;
      if (max !== undefined && n > max) return `Enter a value no greater than ${max}.`;
    }
    return null;
  }, [current, answers]);

  const goNext = useCallback(() => {
    const err = validateCurrent();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    // Recompute the list from the latest answers so branching is reflected.
    const list = buildQuestionList(answers);
    if (index >= list.length - 1) {
      setPhase("review");
    } else {
      setIndex(index + 1);
    }
  }, [validateCurrent, answers, index]);

  const goBack = useCallback(() => {
    setError(null);
    if (index === 0) {
      onExit();
    } else {
      setIndex(index - 1);
    }
  }, [index, onExit]);

  const jumpToSection = useCallback(
    (section: SectionId) => {
      const list = buildQuestionList(answers);
      const target = list.findIndex((q) => q.section === section);
      if (target >= 0) {
        setIndex(target);
        setPhase("questions");
      }
    },
    [answers],
  );

  const restart = useCallback(() => {
    setAnswers({});
    setIndex(0);
    setPhase("questions");
    setError(null);
  }, []);

  // Save & exit: persist the place, confirm it, and return to the landing page.
  const exitWithSave = useCallback(() => {
    saveStep(index);
    toast.success("Progress saved on this device. Pick up where you left off any time.");
    onExit();
  }, [index, onExit]);

  // ── Derived progress ──────────────────────────────────────────────────────
  const { completedSections, currentSection, percent } = useMemo(() => {
    const completed = new Set<SectionId>();
    for (const section of SECTIONS) {
      const qs = questions.filter((q) => q.section === section.id);
      if (qs.length === 0) continue;
      const allAnswered = qs.every((q) => {
        if (q.type === "info") return true;
        const v = answers[q.id];
        return !(v === undefined || v === null || (typeof v === "string" && v.trim() === ""));
      });
      if (allAnswered) completed.add(section.id);
    }
    const cur = current?.section ?? "final";
    const pct = phase === "questions"
      ? Math.round(((index) / Math.max(1, questions.length)) * 100)
      : 100;
    return { completedSections: completed, currentSection: cur, percent: pct };
  }, [questions, answers, current, index, phase]);

  if (!hydrated) {
    return <div className="py-24 text-center text-muted-foreground">Loading…</div>;
  }

  // Eligibility hard-stop (PRD §3.2 / §6.4).
  if (failed) {
    return (
      <FlowShell onExit={onExit}>
        <EligibilityStop onRestart={restart} />
      </FlowShell>
    );
  }

  if (phase === "complete") {
    return (
      <FlowShell onExit={onExit}>
        <CompletionScreen />
      </FlowShell>
    );
  }

  if (phase === "review") {
    return (
      <FlowShell onExit={exitWithSave} progress={{ completedSections, currentSection: "final", percent: 100 }}>
        <ReviewScreen
          answers={answers}
          onEditSection={jumpToSection}
          onBack={() => {
            setPhase("questions");
            setIndex(questions.length - 1);
          }}
          onConfirm={() => {
            markCompleted(true);
            setPhase("complete");
          }}
        />
      </FlowShell>
    );
  }

  if (!current) {
    return <div className="py-24 text-center text-muted-foreground">Loading…</div>;
  }

  const title = resolveDynamic(current.title, answers);
  const description = current.description
    ? resolveDynamic(current.description, answers)
    : undefined;

  return (
    <FlowShell onExit={exitWithSave} progress={{ completedSections, currentSection, percent }}>
      <div className="mx-auto max-w-xl">
        <p className="mb-2 text-sm font-medium text-primary">
          {SECTIONS.find((s) => s.id === current.section)?.title}
        </p>
        <div className="mb-1 flex items-start gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {current.tooltip && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="More information"
                    className="mt-1 text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <Info className="h-5 w-5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{current.tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
        {description && (
          <p className="mb-6 mt-2 text-muted-foreground">{description}</p>
        )}

        <div className="mt-6">
          <QuestionInput
            question={current}
            answers={answers}
            value={answers[current.id]}
            onChange={(v) => setAnswer(current.id, v)}
            onSubmit={goNext}
            invalid={!!error}
          />
        </div>

        {error && (
          <p id={`${current.id}-error`} role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={goBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          <Button onClick={goNext} size="lg" className="gap-1.5">
            {current.type === "info" ? "Continue" : "Next"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </FlowShell>
  );
}

function FlowShell({
  children,
  onExit,
  progress,
}: {
  children: React.ReactNode;
  onExit: () => void;
  progress?: {
    completedSections: Set<SectionId>;
    currentSection: SectionId;
    percent: number;
  };
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Image
            src="/willbee-full.png"
            alt="WillBee"
            width={1698}
            height={608}
            priority
            className="h-8 w-auto"
          />
          <button
            onClick={onExit}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
            Save &amp; exit
          </button>
        </div>
        {progress && (
          <div className="mx-auto max-w-3xl px-4 pb-4">
            <ProgressTracker {...progress} />
          </div>
        )}
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">{children}</main>
    </div>
  );
}
