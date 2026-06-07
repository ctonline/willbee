import { z } from "zod";

// Server-side validation of the WillData payload (PRD §4 — validate before
// sending the Will email / persisting).

const personSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(1),
});

export const willDataSchema = z.object({
  testator: z.object({
    fullName: z.string().min(2),
    address: z.string().min(10),
    dateOfBirth: z.string().min(1),
    maritalStatus: z.enum([
      "Single",
      "Married",
      "Civil Partnership",
      "Divorced",
      "Widowed",
    ]),
    domicileScotland: z.boolean(),
    hasCapacityToday: z.boolean(),
  }),
  executors: z.object({
    primary: z.array(personSchema).min(1),
    substitutes: z.array(personSchema).max(2),
  }),
  guardians: z.array(personSchema).max(1),
  legacies: z.array(
    z.object({
      type: z.enum(["pecuniary", "specific", "charitable"]),
      amountOrDescription: z.string(),
      beneficiary: z.object({
        name: z.string(),
        relationship: z.string().optional(),
        address: z.string().optional(),
      }),
      ifPredecease: z.enum(["to_issue", "to_residue", "lapse"]),
    }),
  ),
  residue: z.object({
    beneficiaries: z
      .array(
        z.object({
          name: z.string().min(2),
          sharePercent: z.number().int().min(0).max(100),
          ifPredecease: z.enum(["to_issue", "to_others", "lapse"]),
        }),
      )
      .min(1)
      .refine(
        (bs) => bs.reduce((a, b) => a + b.sharePercent, 0) === 100,
        "Residue shares must sum to 100%.",
      ),
  }),
  property: z.object({
    hasJointProperty: z.boolean(),
    survivorshipDestination: z.boolean(),
  }),
  powers: z.object({
    investment: z.boolean(),
    advanceToBeneficiaries: z.boolean(),
    trustCreationIfMinor: z.object({ ageVesting: z.number().int() }),
  }),
  funeral: z.object({ preferences: z.string(), notes: z.string() }),
  digitalAssets: z.object({ instructions: z.string() }),
  acknowledgements: z.object({
    legalRightsNoticeShown: z.boolean(),
    notLegalAdvice: z.boolean(),
  }),
});

export type ValidatedWillData = z.infer<typeof willDataSchema>;
