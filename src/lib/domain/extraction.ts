import { z } from "zod";

/** What the extractor (AI or fixture) must return. Validated with Zod before anything else. */
export const extractedMarker = z.object({
  marker: z.string().min(1).max(120).describe("Test name exactly as printed"),
  value: z.string().max(40).describe("Result exactly as printed, e.g. '6.1', '<0.5', 'Negative'"),
  unit: z.string().max(40).nullable().describe("Unit as printed, or null"),
  referenceRangeText: z.string().max(80).nullable().describe("Reference/biological range exactly as printed, or null if none is printed"),
  referenceRangeLow: z.number().nullable().describe("Lower bound of the printed range, or null"),
  referenceRangeHigh: z.number().nullable().describe("Upper bound of the printed range, or null"),
  labFlag: z.string().max(20).nullable().describe("Flag printed by the lab, e.g. H, L, HH, LL, *, Critical; null if none"),
  confidence: z.number().min(0).max(1).describe("How sure you are that this row was read correctly"),
});
export type ExtractedMarker = z.infer<typeof extractedMarker>;

export const extractedLab = z.object({
  labName: z.string().max(120).nullable(),
  reportDate: z.string().max(20).nullable().describe("ISO date YYYY-MM-DD if printed, else null"),
  patientAge: z.number().int().min(0).max(130).nullable(),
  patientSex: z.enum(["female", "male", "other"]).nullable(),
  markers: z.array(extractedMarker).max(150),
});
export type ExtractedLab = z.infer<typeof extractedLab>;

export const extractedRxItem = z.object({
  medicine: z.string().min(1).max(120).describe("Medicine name exactly as written"),
  strength: z.string().max(40).nullable(),
  form: z.string().max(40).nullable().describe("tablet, capsule, syrup, injection, cream, drops…"),
  frequency: z.string().max(80).nullable().describe("As written, e.g. '1-0-1', 'twice daily', 'BD'"),
  duration: z.string().max(60).nullable(),
  instructions: z.string().max(200).nullable().describe("As written, e.g. 'after food'"),
  confidence: z.number().min(0).max(1),
});
export type ExtractedRxItem = z.infer<typeof extractedRxItem>;

export const extractedRx = z.object({
  prescribedDate: z.string().max(20).nullable(),
  prescriberSpecialty: z.string().max(80).nullable(),
  items: z.array(extractedRxItem).max(40),
});
export type ExtractedRx = z.infer<typeof extractedRx>;

export const extraction = z.object({
  kind: z.enum(["lab", "prescription", "other"]),
  lab: extractedLab.nullable(),
  prescription: extractedRx.nullable(),
});
export type Extraction = z.infer<typeof extraction>;

/** Fields below this confidence get a "Please confirm" before we explain anything. */
export const CONFIRM_THRESHOLD = 0.8;
