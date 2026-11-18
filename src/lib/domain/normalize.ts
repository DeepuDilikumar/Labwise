import { findMarker, resolveUnit, toCanonical, type MarkerDef } from "@/lib/markers";
import { computeStatus, parseRangeText } from "@/lib/status/compute";
import type { MarkerStatus } from "./status";
import { CONFIRM_THRESHOLD, type ExtractedMarker } from "./extraction";

export interface NormalizedMarker {
  position: number;
  rawName: string;
  canonicalId: string | null;
  panel: string | null;
  valueText: string;
  value: number | null;
  unit: string | null;
  canonicalValue: number | null;
  canonicalUnit: string | null;
  refLow: number | null;
  refHigh: number | null;
  refText: string | null;
  labFlag: string | null;
  status: MarkerStatus;
  confidence: number;
  needsConfirm: boolean;
}

/** Parses "6.1", "6,1", "<0.5", "> 90", "1,234" into a number; qualitative results return null. */
export function parseNumeric(text: string): { value: number | null; comparator: "<" | ">" | null } {
  const t = text.trim().replace(/\s+/g, "");
  const m = t.match(/^(<=|>=|<|>|≤|≥)?([-+]?\d{1,3}(?:,\d{3})+(?:\.\d+)?|[-+]?\d+(?:[.,]\d+)?)$/);
  if (!m) return { value: null, comparator: null };
  let num = m[2];
  num = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(num) ? num.replace(/,/g, "") : num.replace(",", ".");
  const comparator = m[1] ? (m[1].startsWith("<") || m[1] === "≤" ? "<" : ">") : null;
  return { value: Number(num), comparator };
}

/**
 * Turns one extracted row into a normalised marker with a DETERMINISTIC status computed
 * from the printed range (safety rule #1). Explicit numeric bounds win; otherwise the
 * printed range text is parsed. Nothing is invented: no printed range → "no_range".
 */
export function normalizeMarker(row: ExtractedMarker, position: number): NormalizedMarker {
  const def: MarkerDef | null = findMarker(row.marker);
  const { value } = parseNumeric(row.value);
  const parsedRange = parseRangeText(row.referenceRangeText);
  const low = row.referenceRangeLow ?? parsedRange?.low ?? null;
  const high = row.referenceRangeHigh ?? parsedRange?.high ?? null;
  const usedText = row.referenceRangeLow == null && row.referenceRangeHigh == null && parsedRange;
  const unitDef = def ? resolveUnit(def, row.unit) : null;
  const canonicalValue = value != null && unitDef ? toCanonical(value, unitDef) : null;

  // 1) Status against the printed range, plus any critical flag printed by the lab.
  let status = computeStatus({
    value,
    low,
    high,
    lowInclusive: usedText ? parsedRange.lowInclusive : true,
    highInclusive: usedText ? parsedRange.highInclusive : true,
    labFlag: row.labFlag,
  });
  // 2) Conservative hard-coded thresholds, evaluated in canonical units — only when we
  //    recognise the marker AND its unit, so a unit mix-up can never trigger a false alarm.
  if (def?.critical && canonicalValue != null && status !== "critical_low" && status !== "critical_high") {
    const c = computeStatus({ value: canonicalValue, critical: def.critical });
    if (c === "critical_low" || c === "critical_high") status = c;
  }

  return {
    position,
    rawName: row.marker.trim(),
    canonicalId: def?.id ?? null,
    panel: def?.panel ?? null,
    valueText: row.value.trim(),
    value,
    unit: row.unit?.trim() || null,
    canonicalValue,
    canonicalUnit: unitDef ? def!.canonicalUnit : null,
    refLow: low,
    refHigh: high,
    refText: row.referenceRangeText?.trim() || null,
    labFlag: row.labFlag?.trim() || null,
    status,
    confidence: row.confidence,
    needsConfirm: row.confidence < CONFIRM_THRESHOLD || (value == null && /\d/.test(row.value)),
  };
}
