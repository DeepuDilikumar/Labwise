import data from "@content/drugs/drugs.json";
import type { RegionId } from "@regions";

export type DrugClass =
  | "blood_sugar" | "blood_pressure" | "cholesterol" | "thyroid" | "heart" | "pain_fever" | "stomach"
  | "antibiotic" | "allergy" | "supplement" | "breathing";

export interface DrugDef {
  id: string;
  generic: string;
  class: DrugClass;
  usedFor: string;
  precautions: string[];
  brands: Record<RegionId, string[]>;
}

const DRUGS = data.drugs as DrugDef[];

const FORM_PREFIX = /^(tab|tabs|tablet|cap|caps|capsule|syp|syrup|susp|inj|injection|oint|cream|gel|drops?|inhaler|sachet|t|c)\.?\s+/i;
const clean = (s: string) =>
  s
    .toLowerCase()
    .replace(FORM_PREFIX, "")
    .replace(/\b\d+(\.\d+)?\s*(mg|mcg|µg|g|ml|iu|%)\b/g, " ")
    .replace(/[^a-z0-9+\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Brand → generic lookup, region first, then other regions, then generic names.
 * Matches whole leading words only, so "Pan-D" never matches plain "Pan 40".
 */
export function findDrug(written: string, region: RegionId): DrugDef | null {
  const w = clean(written);
  if (!w) return null;
  const starts = (name: string) => {
    const n = clean(name);
    return n.length > 0 && (w === n || w.startsWith(n + " "));
  };
  const order: RegionId[] = [region, ...(["in", "us"] as RegionId[]).filter((r) => r !== region)];
  let best: { d: DrugDef; len: number } | null = null;
  for (const r of order)
    for (const d of DRUGS)
      for (const b of d.brands[r] ?? [])
        if (starts(b) && (!best || clean(b).length > best.len)) best = { d, len: clean(b).length };
  if (best) return best.d;
  for (const d of DRUGS) {
    const g = clean(d.generic.replace(/\(.*\)/, ""));
    if (starts(g) || w.split(" ")[0] === g.split(" ")[0]) return d;
  }
  return null;
}

export const allDrugs = () => DRUGS;
