// The conversational Q&A schema (PRD §3.3, §3.4).
//
// The flow is "one question per screen". Rather than a static list, the visible
// sequence is *derived* from the current answers via `buildQuestionList`, which
// makes conditional branching and variable-length repeats (multiple legacies,
// many residue beneficiaries, substitute executors) fall out naturally.

import {
  validateName,
  validateAddress,
  validateDOB,
  type Validator,
} from "./validation";
import type { Answers, AnswerValue } from "./types";

export type SectionId =
  | "eligibility"
  | "personal"
  | "executors"
  | "guardians"
  | "legacies"
  | "residue"
  | "final";

export interface Section {
  id: SectionId;
  title: string;
  /** Short label for the progress tracker. */
  shortTitle: string;
}

export const SECTIONS: Section[] = [
  { id: "eligibility", title: "Eligibility Check", shortTitle: "Eligibility" },
  { id: "personal", title: "Personal Details", shortTitle: "Personal" },
  { id: "executors", title: "Executors", shortTitle: "Executors" },
  { id: "guardians", title: "Guardians", shortTitle: "Guardians" },
  { id: "legacies", title: "Legacies", shortTitle: "Legacies" },
  { id: "residue", title: "Residue", shortTitle: "Residue" },
  { id: "final", title: "Final Details", shortTitle: "Final" },
];

export type QuestionType =
  | "text"
  | "textarea"
  | "radio"
  | "date"
  | "number"
  | "info";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

/** A value that may be static or computed from the current answers. */
type Dynamic<T> = T | ((a: Answers) => T);

export interface Question {
  id: string;
  section: SectionId;
  type: QuestionType;
  title: Dynamic<string>;
  description?: Dynamic<string>;
  placeholder?: string;
  /** True if the eligibility gate should hard-stop on a "no" answer. */
  gate?: boolean;
  options?: RadioOption[];
  required?: boolean;
  min?: Dynamic<number>;
  max?: Dynamic<number>;
  validate?: Validator;
  /** Optional tooltip shown next to the title. */
  tooltip?: string;
}

const YES_NO: RadioOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export function resolveDynamic<T>(v: Dynamic<T>, a: Answers): T {
  return typeof v === "function" ? (v as (a: Answers) => T)(a) : v;
}

function isYes(v: AnswerValue): boolean {
  return v === "yes";
}

function num(v: AnswerValue, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Hard caps for the repeatable collections.
export const MAX_LEGACIES = 10;
export const MAX_RESIDUE = 6;
export const MAX_SUBSTITUTES = 2;

// ── Static question fragments ───────────────────────────────────────────────

const eligibilityQuestions: Question[] = [
  {
    id: "elig_age",
    section: "eligibility",
    type: "radio",
    gate: true,
    options: YES_NO,
    required: true,
    title: "Are you aged 12 or over?",
    description: "In Scotland you must be at least 12 years old to make a valid Will.",
  },
  {
    id: "elig_domicile",
    section: "eligibility",
    type: "radio",
    gate: true,
    options: YES_NO,
    required: true,
    title: "Are you domiciled in Scotland?",
    tooltip:
      "Your domicile is the country you treat as your permanent home — where you intend to remain indefinitely. It is not always the same as where you currently live.",
    description: "This Will is structured for Scots law and is only suitable if Scotland is your domicile.",
  },
  {
    id: "elig_capacity",
    section: "eligibility",
    type: "radio",
    gate: true,
    options: YES_NO,
    required: true,
    title: "Do you have the mental capacity to make decisions today?",
    description: "You must understand what a Will is and the effect of the decisions you make in it.",
  },
];

const personalQuestions: Question[] = [
  {
    id: "personal_name",
    section: "personal",
    type: "text",
    required: true,
    validate: validateName,
    title: "What is your full legal name?",
    description: "Enter your name exactly as it appears on official documents.",
    placeholder: "e.g. Jane Elizabeth MacDonald",
  },
  {
    id: "personal_address",
    section: "personal",
    type: "textarea",
    required: true,
    validate: validateAddress,
    title: "What is your full address?",
    description: "Include your street, town/city and postcode.",
    placeholder: "e.g. 14 Thistle Street, Edinburgh, EH2 1DF",
  },
  {
    id: "personal_dob",
    section: "personal",
    type: "date",
    required: true,
    validate: validateDOB,
    title: "What is your date of birth?",
    description: "You must be at least 12 years old.",
  },
  {
    id: "personal_marital",
    section: "personal",
    type: "radio",
    required: true,
    title: "What is your current marital status?",
    options: [
      { value: "Single", label: "Single" },
      { value: "Married", label: "Married" },
      { value: "Civil Partnership", label: "Civil Partnership" },
      { value: "Divorced", label: "Divorced" },
      { value: "Widowed", label: "Widowed" },
    ],
  },
];

// ── Dynamic list builder ────────────────────────────────────────────────────

/**
 * Build the ordered list of *visible* questions given the current answers.
 * Pure function — recompute on every answer change.
 */
export function buildQuestionList(a: Answers): Question[] {
  const q: Question[] = [];

  // 1. Eligibility
  q.push(...eligibilityQuestions);

  // 2. Personal
  q.push(...personalQuestions);

  // 3. Executors — primary required, then up to 2 substitutes (opt-in chain)
  q.push(
    {
      id: "exec_primary_name",
      section: "executors",
      type: "text",
      required: true,
      validate: validateName,
      title: "Who do you appoint as your executor?",
      description:
        "Your executor carries out the instructions in your Will. Choose someone you trust — often a spouse, adult child, friend or solicitor.",
      placeholder: "Full name of your executor",
    },
    {
      id: "exec_primary_address",
      section: "executors",
      type: "textarea",
      required: true,
      validate: validateAddress,
      title: "What is your executor’s address?",
      placeholder: "Their full address including postcode",
    },
    {
      id: "exec_want_substitute",
      section: "executors",
      type: "radio",
      required: true,
      options: YES_NO,
      title: "Would you like to name a substitute executor?",
      description:
        "A substitute steps in if your main executor is unable or unwilling to act. Recommended, but optional.",
    },
  );

  if (isYes(a.exec_want_substitute)) {
    q.push(
      {
        id: "exec_sub1_name",
        section: "executors",
        type: "text",
        required: true,
        validate: validateName,
        title: "Who is your substitute executor?",
        placeholder: "Full name",
      },
      {
        id: "exec_sub1_address",
        section: "executors",
        type: "textarea",
        required: true,
        validate: validateAddress,
        title: "What is their address?",
        placeholder: "Their full address including postcode",
      },
      {
        id: "exec_want_substitute2",
        section: "executors",
        type: "radio",
        required: true,
        options: YES_NO,
        title: "Add a second substitute executor?",
        description: "You can name one more substitute (the maximum is two).",
      },
    );

    if (isYes(a.exec_want_substitute2)) {
      q.push(
        {
          id: "exec_sub2_name",
          section: "executors",
          type: "text",
          required: true,
          validate: validateName,
          title: "Who is your second substitute executor?",
          placeholder: "Full name",
        },
        {
          id: "exec_sub2_address",
          section: "executors",
          type: "textarea",
          required: true,
          validate: validateAddress,
          title: "What is their address?",
          placeholder: "Their full address including postcode",
        },
      );
    }
  }

  // 4. Guardians — only if there are children under 16
  q.push({
    id: "guard_has_children",
    section: "guardians",
    type: "radio",
    required: true,
    options: YES_NO,
    title: "Do you have any children under the age of 16?",
    description:
      "If yes, you can appoint a guardian to care for them. This only takes effect if there is no surviving parent with parental responsibilities.",
  });

  if (isYes(a.guard_has_children)) {
    q.push(
      {
        id: "guard_name",
        section: "guardians",
        type: "text",
        required: true,
        validate: validateName,
        title: "Who would you like to appoint as guardian?",
        description: "Make sure you have discussed this with them first.",
        placeholder: "Full name of the guardian",
      },
      {
        id: "guard_address",
        section: "guardians",
        type: "textarea",
        required: true,
        validate: validateAddress,
        title: "What is the guardian’s address?",
        placeholder: "Their full address including postcode",
      },
    );
  }

  // 5. Legacies — opt-in, then a count, then indexed questions per legacy
  q.push({
    id: "legacy_want",
    section: "legacies",
    type: "radio",
    required: true,
    options: YES_NO,
    title: "Would you like to leave any specific gifts (legacies)?",
    description:
      "A legacy is a particular gift — a sum of money, a named item, or a gift to charity — left before the rest of your estate is divided.",
  });

  if (isYes(a.legacy_want)) {
    q.push({
      id: "legacy_count",
      section: "legacies",
      type: "number",
      required: true,
      min: 1,
      max: MAX_LEGACIES,
      title: "How many specific gifts would you like to leave?",
      description: `You can record up to ${MAX_LEGACIES}.`,
    });

    const count = Math.min(MAX_LEGACIES, Math.max(0, num(a.legacy_count)));
    for (let i = 0; i < count; i++) {
      const human = i + 1;
      q.push(
        {
          id: `legacy_${i}_type`,
          section: "legacies",
          type: "radio",
          required: true,
          title: `Gift ${human}: what type of gift is it?`,
          options: [
            { value: "pecuniary", label: "Money", description: "A fixed sum of money" },
            { value: "specific", label: "Specific item", description: "A named possession, e.g. jewellery or a vehicle" },
            { value: "charitable", label: "Charity", description: "A gift to a registered charity" },
          ],
        },
        {
          id: `legacy_${i}_desc`,
          section: "legacies",
          type: "text",
          required: true,
          title: (ans) => {
            const t = ans[`legacy_${i}_type`];
            if (t === "pecuniary") return `Gift ${human}: how much money?`;
            if (t === "charitable") return `Gift ${human}: what are you giving?`;
            return `Gift ${human}: describe the item`;
          },
          description: (ans) => {
            const t = ans[`legacy_${i}_type`];
            if (t === "pecuniary") return "Enter an amount, e.g. £500.";
            if (t === "charitable") return "Describe the gift, e.g. £200 or a specific item.";
            return "Be specific so the item can be identified, e.g. ‘my grandmother’s gold locket’.";
          },
          placeholder: "e.g. £500",
        },
        {
          id: `legacy_${i}_beneficiary`,
          section: "legacies",
          type: "text",
          required: true,
          validate: validateName,
          title: (ans) =>
            ans[`legacy_${i}_type`] === "charitable"
              ? `Gift ${human}: which charity?`
              : `Gift ${human}: who receives it?`,
          description: (ans) =>
            ans[`legacy_${i}_type`] === "charitable"
              ? "Enter the charity’s full name (and registration number if known)."
              : "Enter the beneficiary’s full name.",
          placeholder: "Full name",
        },
      );
    }
  }

  // 6. Residue — at least one beneficiary; shares must sum to 100
  q.push({
    id: "residue_count",
    section: "residue",
    type: "number",
    required: true,
    min: 1,
    max: MAX_RESIDUE,
    title: "How many people or charities should share the rest of your estate?",
    description:
      "The ‘residue’ is everything left after debts, expenses and any specific gifts. You can split it between up to " +
      MAX_RESIDUE +
      " beneficiaries.",
  });

  const rCount = Math.min(MAX_RESIDUE, Math.max(1, num(a.residue_count, 1)));
  for (let i = 0; i < rCount; i++) {
    const human = i + 1;
    const isLast = i === rCount - 1;

    q.push({
      id: `residue_${i}_name`,
      section: "residue",
      type: "text",
      required: true,
      validate: validateName,
      title:
        rCount === 1
          ? "Who should receive the residue of your estate?"
          : `Residue beneficiary ${human}: full name`,
      description:
        rCount === 1
          ? "This person or charity inherits everything that is left."
          : undefined,
      placeholder: "Full name",
    });

    // Ask a share for every beneficiary except the last, which takes the
    // remainder (guaranteeing the shares sum to exactly 100%).
    if (rCount > 1 && !isLast) {
      q.push({
        id: `residue_${i}_share`,
        section: "residue",
        type: "number",
        required: true,
        min: 1,
        max: (ans) => remainingResidueShare(ans, i, rCount),
        title: `Residue beneficiary ${human}: what percentage share?`,
        description: (ans) => {
          const remaining = remainingResidueShare(ans, i, rCount);
          return `Enter a whole number from 1 to ${remaining}%. The final beneficiary will automatically receive whatever is left.`;
        },
        placeholder: "e.g. 50",
      });
    }
  }

  // 7. Final details
  q.push({
    id: "final_legal_rights",
    section: "final",
    type: "radio",
    required: true,
    title: "Legal rights under Scots law",
    description:
      "In Scotland, your spouse or civil partner and your children may be entitled to a fixed share of your ‘moveable’ estate (money, savings, possessions) regardless of what your Will says. These are called ‘legal rights’.",
    options: [
      { value: "understand", label: "I understand" },
      { value: "explain", label: "Explain this to me in more detail" },
    ],
  });

  if (a.final_legal_rights === "explain") {
    q.push({
      id: "final_legal_rights_detail",
      section: "final",
      type: "info",
      title: "How legal rights work",
      description:
        "Legal rights apply only to your ‘moveable’ estate (everything except land and buildings). Your spouse or civil partner can claim one-third of the moveable estate if you have surviving children, or one-half if you do not. Your children together can claim one-third if there is a surviving spouse/partner, or one-half if there is not. These claims are optional — a person can choose to accept what your Will leaves them instead. You cannot remove legal rights in your Will, but your Will still governs everything else.",
    });
    q.push({
      id: "final_legal_rights_confirm",
      section: "final",
      type: "radio",
      required: true,
      title: "Now that you’ve read the explanation, do you understand legal rights?",
      options: [{ value: "understand", label: "Yes, I understand" }],
    });
  }

  q.push({
    id: "final_funeral_want",
    section: "final",
    type: "radio",
    required: true,
    options: YES_NO,
    title: "Would you like to record any funeral preferences?",
    description: "These are recorded as wishes for your family — they are not legally binding. Optional.",
  });
  if (isYes(a.final_funeral_want)) {
    q.push({
      id: "final_funeral_text",
      section: "final",
      type: "textarea",
      required: true,
      title: "What are your funeral preferences?",
      placeholder: "e.g. I would prefer a cremation followed by a humanist service.",
    });
  }

  q.push({
    id: "final_digital_want",
    section: "final",
    type: "radio",
    required: true,
    options: YES_NO,
    title: "Do you have any instructions about your digital assets?",
    description:
      "Online accounts, photos, social media, cryptocurrency and similar. Optional — recorded as guidance for your executor.",
  });
  if (isYes(a.final_digital_want)) {
    q.push({
      id: "final_digital_text",
      section: "final",
      type: "textarea",
      required: true,
      title: "What instructions would you like to leave about your digital assets?",
      placeholder: "e.g. Please close my social media accounts and pass my photo archive to my children.",
    });
  }

  q.push({
    id: "final_confirm",
    section: "final",
    type: "radio",
    required: true,
    title: "Final confirmation",
    description:
      "Please confirm that the information you have provided is accurate to the best of your knowledge.",
    options: [
      { value: "yes", label: "Yes, I confirm the information above is accurate" },
    ],
  });

  return q;
}

/** Remaining percentage available for residue beneficiary `i` (0-based, not last). */
export function remainingResidueShare(a: Answers, i: number, count: number): number {
  let used = 0;
  for (let j = 0; j < i; j++) used += num(a[`residue_${j}_share`]);
  // Reserve at least 1% for each subsequent beneficiary (including the final remainder one).
  const subsequent = count - 1 - i; // beneficiaries after i, excluding the final remainder
  const cap = 100 - used - Math.max(0, subsequent);
  return Math.max(1, cap);
}

/** True when any gating eligibility question has been answered "no". */
export function eligibilityFailed(a: Answers): boolean {
  return eligibilityQuestions.some((q) => q.gate && a[q.id] === "no");
}
