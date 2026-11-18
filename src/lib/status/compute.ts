import type { MarkerStatus } from "@/lib/domain/status";

/**
 * Deterministic marker status from the value and the range PRINTED ON THE REPORT.
 * The LLM never decides this. Safety rule #1 in CLAUDE.md.
 */
export interface ParsedRange {
  low: number | null;
  high: number | null;
  /** Inclusive bounds by default; "<5" means value must be strictly below 5. */
  lowInclusive: boolean;
  highInclusive: boolean;
}

const NUM = String.raw`[-+]?\d+(?:[.,]\d+)?`;

const toNum = (s: string) => Number(s.replace(",", "."));

/** Parses common printed range formats: "70-100", "70 – 100", "<5", "≤ 5.0", "> 40", "Up to 200", "Above 40". */
export function parseRangeText(text: string | null | undefined): ParsedRange | null {
  if (!text) return null;
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  let m = t.match(new RegExp(`^(${NUM})\\s*(?:-|–|—|to)\\s*(${NUM})`));
  if (m) {
    const [a, b] = [toNum(m[1]), toNum(m[2])];
    if (a <= b) return { low: a, high: b, lowInclusive: true, highInclusive: true };
    return null;
  }
  m = t.match(new RegExp(`^(<=|≤|=<|<|less than|below|up to|upto)\\s*(${NUM})`));
  if (m) {
    const strict = m[1] === "<" || m[1] === "less than" || m[1] === "below";
    return { low: null, high: toNum(m[2]), lowInclusive: true, highInclusive: !strict };
  }
  m = t.match(new RegExp(`^(>=|≥|=>|>|more than|greater than|above|over)\\s*(${NUM})`));
  if (m) {
    const strict = !(m[1] === ">=" || m[1] === "≥" || m[1] === "=>");
    return { low: toNum(m[2]), high: null, lowInclusive: !strict, highInclusive: true };
  }
  return null;
}

export interface StatusInput {
  value: number | null;
  low?: number | null;
  high?: number | null;
  lowInclusive?: boolean;
  highInclusive?: boolean;
  /** Flag printed by the lab, e.g. "H", "L", "HH", "LL", "C", "Critical", "*". */
  labFlag?: string | null;
  /** Optional conservative hard thresholds (canonical units already applied by caller). */
  critical?: { below?: number; above?: number } | null;
}

function flagIsCritical(flag: string | null | undefined): "low" | "high" | "either" | null {
  if (!flag) return null;
  const f = flag.trim().toLowerCase();
  if (f === "ll" || f === "critical low" || f === "cl" || f === "l*" || f === "*l") return "low";
  if (f === "hh" || f === "critical high" || f === "ch" || f === "h*" || f === "*h") return "high";
  if (f === "c" || f === "crit" || f === "critical" || f === "panic" || f === "!!") return "either";
  return null;
}

export function computeStatus(i: StatusInput): MarkerStatus {
  const { value } = i;
  if (value == null || Number.isNaN(value)) return "unparsed";
  const low = i.low ?? null;
  const high = i.high ?? null;
  const lowInc = i.lowInclusive ?? true;
  const highInc = i.highInclusive ?? true;

  let base: MarkerStatus;
  if (low == null && high == null) base = "no_range";
  else if (low != null && (lowInc ? value < low : value <= low)) base = "low";
  else if (high != null && (highInc ? value > high : value >= high)) base = "high";
  else base = "in_range";

  const crit = flagIsCritical(i.labFlag);
  if (crit === "low") return "critical_low";
  if (crit === "high") return "critical_high";
  if (crit === "either") return base === "low" ? "critical_low" : base === "high" ? "critical_high" : value < (low ?? -Infinity) ? "critical_low" : "critical_high";

  if (i.critical?.below != null && value < i.critical.below) return "critical_low";
  if (i.critical?.above != null && value > i.critical.above) return "critical_high";
  return base;
}
