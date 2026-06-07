"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { resolveDynamic, type Question } from "@/lib/questions";
import type { Answers, AnswerValue } from "@/lib/types";

interface Props {
  question: Question;
  answers: Answers;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  /** Submit the current screen (e.g. Enter key / radio auto-advance). */
  onSubmit?: () => void;
  invalid?: boolean;
}

export function QuestionInput({
  question,
  answers,
  value,
  onChange,
  onSubmit,
  invalid,
}: Props) {
  const describedBy = invalid ? `${question.id}-error` : undefined;

  switch (question.type) {
    case "text":
      return (
        <Input
          id={question.id}
          autoFocus
          value={(value as string) ?? ""}
          placeholder={question.placeholder}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit?.();
            }
          }}
          className="h-12 text-base"
        />
      );

    case "textarea":
      return (
        <Textarea
          id={question.id}
          autoFocus
          rows={4}
          value={(value as string) ?? ""}
          placeholder={question.placeholder}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className="text-base"
        />
      );

    case "date":
      return (
        <Input
          id={question.id}
          type="date"
          autoFocus
          value={(value as string) ?? ""}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 text-base"
        />
      );

    case "number": {
      const min = question.min !== undefined ? resolveDynamic(question.min, answers) : undefined;
      const max = question.max !== undefined ? resolveDynamic(question.max, answers) : undefined;
      return (
        <Input
          id={question.id}
          type="number"
          inputMode="numeric"
          autoFocus
          min={min}
          max={max}
          value={value === undefined || value === null ? "" : String(value)}
          placeholder={question.placeholder}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit?.();
            }
          }}
          className="h-12 text-base max-w-40"
        />
      );
    }

    case "radio":
      return (
        <RadioGroup
          value={(value as string) ?? ""}
          aria-describedby={describedBy}
          onValueChange={(v) => onChange(v)}
          className="gap-3"
        >
          {question.options?.map((opt) => (
            <Label
              key={opt.value}
              htmlFor={`${question.id}-${opt.value}`}
              className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/40"
            >
              <RadioGroupItem
                id={`${question.id}-${opt.value}`}
                value={opt.value}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-medium">{opt.label}</span>
                {opt.description && (
                  <span className="text-sm text-muted-foreground">
                    {opt.description}
                  </span>
                )}
              </span>
            </Label>
          ))}
        </RadioGroup>
      );

    case "info":
      return null;
  }
}
