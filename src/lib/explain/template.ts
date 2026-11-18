import { directionOf, type MarkerStatus } from "@/lib/domain/status";
import type { MarkerDef } from "@/lib/markers";

export interface MarkerExplanation {
  measures: string;
  reasons: string[];
  questions: string[];
}

/** Deterministic explanation straight from the curated knowledge file (always safe). */
export function buildTemplateExplanation(def: MarkerDef, status: MarkerStatus): MarkerExplanation {
  const dir = directionOf(status);
  const reasons = dir === "high" ? def.reasonsHigh : dir === "low" ? def.reasonsLow : [];
  const generic =
    dir != null
      ? "Should this be checked again, and when?"
      : status === "no_range"
        ? "What range do you use for this test?"
        : "Is there anything about this result you'd like me to know?";
  const questions = [...def.questions];
  if (!questions.some((q) => q.toLowerCase() === generic.toLowerCase())) questions.push(generic);
  return { measures: def.description, reasons: reasons.filter((r) => !/^usually not a concern$/i.test(r)).slice(0, 4), questions: questions.slice(0, 3) };
}

/** For markers we don't recognise: honest, minimal, no invented facts. */
export function unknownMarkerExplanation(): MarkerExplanation {
  return {
    measures: "We don't have a plain-language guide for this test yet, so we've shown the value and your lab's range as printed.",
    reasons: [],
    questions: ["What does this test measure, and is my result something to think about?"],
  };
}
