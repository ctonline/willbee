"use client";

import { Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWillData, buildResidueBeneficiaries } from "@/lib/will-builder";
import { validateResidueShares } from "@/lib/validation";
import type { Answers } from "@/lib/types";
import type { SectionId } from "@/lib/questions";

const LEGACY_LABEL: Record<string, string> = {
  pecuniary: "Money",
  specific: "Specific item",
  charitable: "Charity",
};

interface Row {
  label: string;
  value: string;
}

interface Group {
  section: SectionId;
  title: string;
  rows: Row[];
}

export function ReviewScreen({
  answers,
  onConfirm,
  onEditSection,
  onBack,
}: {
  answers: Answers;
  onConfirm: () => void;
  onEditSection: (s: SectionId) => void;
  onBack: () => void;
}) {
  const will = buildWillData(answers);
  const shares = buildResidueBeneficiaries(answers).map((b) => b.sharePercent);
  const residueError = validateResidueShares(shares);

  const groups: Group[] = [
    {
      section: "personal",
      title: "Personal details",
      rows: [
        { label: "Full name", value: will.testator.fullName },
        { label: "Address", value: will.testator.address },
        { label: "Date of birth", value: will.testator.dateOfBirth },
        { label: "Marital status", value: will.testator.maritalStatus },
      ],
    },
    {
      section: "executors",
      title: "Executors",
      rows: [
        {
          label: "Primary executor",
          value: `${will.executors.primary[0]?.name} — ${will.executors.primary[0]?.address}`,
        },
        ...will.executors.substitutes.map((s, i) => ({
          label: `Substitute ${i + 1}`,
          value: `${s.name} — ${s.address}`,
        })),
      ],
    },
  ];

  if (will.guardians.length > 0) {
    groups.push({
      section: "guardians",
      title: "Guardians",
      rows: will.guardians.map((g) => ({
        label: "Guardian",
        value: `${g.name} — ${g.address}`,
      })),
    });
  }

  if (will.legacies.length > 0) {
    groups.push({
      section: "legacies",
      title: "Specific gifts",
      rows: will.legacies.map((l, i) => ({
        label: `Gift ${i + 1} (${LEGACY_LABEL[l.type] ?? l.type})`,
        value: `${l.amountOrDescription} → ${l.beneficiary.name}`,
      })),
    });
  }

  groups.push({
    section: "residue",
    title: "Residue of estate",
    rows: will.residue.beneficiaries.map((b) => ({
      label: `${b.sharePercent}%`,
      value: b.name,
    })),
  });

  const finalRows: Row[] = [];
  if (will.funeral.preferences)
    finalRows.push({ label: "Funeral wishes", value: will.funeral.preferences });
  if (will.digitalAssets.instructions)
    finalRows.push({ label: "Digital assets", value: will.digitalAssets.instructions });
  finalRows.push({
    label: "Legal rights notice",
    value: will.acknowledgements.legalRightsNoticeShown ? "Acknowledged" : "Not acknowledged",
  });
  groups.push({ section: "final", title: "Final details", rows: finalRows });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Check your answers
        </h1>
        <p className="mt-2 text-muted-foreground">
          Please review everything below carefully before we generate your Will.
        </p>
      </div>

      {residueError && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{residueError} Please edit the Residue section.</span>
        </div>
      )}

      <div className="space-y-4">
        {groups.map((group) => (
          <section
            key={group.section}
            className="rounded-sm border bg-card p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">{group.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => onEditSection(group.section)}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit
              </Button>
            </div>
            <dl className="space-y-2">
              {group.rows.map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 text-sm">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="col-span-2 whitespace-pre-line">{row.value || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" onClick={onConfirm} disabled={!!residueError}>
          Yes, this is correct: generate my Will
        </Button>
      </div>
    </div>
  );
}
