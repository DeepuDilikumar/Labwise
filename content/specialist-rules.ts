import type { SpecialistId } from "@regions";
import type { DrugClass } from "@/lib/drugs";
import type { MarkerStatus } from "@/lib/domain/status";
import type { Panel } from "@/lib/markers";

/**
 * Deterministic routing from findings to specialist TYPES. Never a diagnosis: the reason
 * text says which results relate to that specialty. Primary care is always suggested first.
 * NEEDS CLINICAL REVIEW before launch.
 */
type Dir = "high" | "low" | "any";
export interface Rule {
  when: { panel?: Panel; marker?: string; dir: Dir };
  specialist: SpecialistId;
  /** Message key under specialists.reasons.* */
  reason: string;
}

export const MARKER_RULES: Rule[] = [
  { when: { panel: "blood_sugar", dir: "any" }, specialist: "endocrinologist", reason: "bloodSugar" },
  { when: { panel: "thyroid", dir: "any" }, specialist: "endocrinologist", reason: "thyroid" },
  { when: { marker: "vitamin_d", dir: "low" }, specialist: "endocrinologist", reason: "vitaminD" },
  { when: { marker: "calcium", dir: "any" }, specialist: "endocrinologist", reason: "calcium" },
  { when: { panel: "lipids", dir: "any" }, specialist: "cardiologist", reason: "lipids" },
  { when: { marker: "hdl", dir: "low" }, specialist: "cardiologist", reason: "lipids" },
  { when: { panel: "kidney", dir: "any" }, specialist: "nephrologist", reason: "kidney" },
  { when: { marker: "potassium", dir: "any" }, specialist: "nephrologist", reason: "electrolytes" },
  { when: { marker: "sodium", dir: "any" }, specialist: "nephrologist", reason: "electrolytes" },
  { when: { marker: "uric_acid", dir: "high" }, specialist: "rheumatologist", reason: "uricAcid" },
  { when: { panel: "liver", dir: "high" }, specialist: "hepatologist", reason: "liver" },
  { when: { marker: "albumin", dir: "low" }, specialist: "hepatologist", reason: "liver" },
  { when: { panel: "cbc", dir: "any" }, specialist: "hematologist", reason: "bloodCount" },
  { when: { panel: "iron", dir: "any" }, specialist: "hematologist", reason: "iron" },
  { when: { marker: "vitamin_b12", dir: "low" }, specialist: "hematologist", reason: "b12" },
  { when: { panel: "inflammation", dir: "high" }, specialist: "primary_care", reason: "inflammation" },
  { when: { marker: "urine_pus_cells", dir: "high" }, specialist: "urologist", reason: "urine" },
];

export const DRUG_CLASS_SPECIALIST: Partial<Record<DrugClass, SpecialistId>> = {
  blood_sugar: "endocrinologist",
  thyroid: "endocrinologist",
  blood_pressure: "cardiologist",
  cholesterol: "cardiologist",
  heart: "cardiologist",
  stomach: "gastroenterologist",
  breathing: "pulmonologist",
};

const dirOf = (s: MarkerStatus): Dir | null =>
  s === "high" || s === "critical_high" ? "high" : s === "low" || s === "critical_low" ? "low" : null;

export interface Suggestion {
  specialist: SpecialistId;
  reasons: string[];
  markers: string[];
}

export function routeMarkers(items: { canonicalId: string | null; panel: Panel | null; status: MarkerStatus; name: string }[]): Suggestion[] {
  const out = new Map<SpecialistId, Suggestion>();
  const pc: Suggestion = { specialist: "primary_care", reasons: ["review"], markers: [] };
  out.set("primary_care", pc);
  // Minor-only CBC differential changes shouldn't send anyone to a haematologist by themselves.
  const significant = (i: (typeof items)[number]) => !(i.panel === "cbc" && ["mcv", "mch", "mchc", "rdw", "neutrophils", "lymphocytes", "hematocrit", "rbc"].includes(i.canonicalId ?? "") && !i.status.startsWith("critical"));
  for (const i of items) {
    const d = dirOf(i.status);
    if (!d || !significant(i)) continue;
    for (const r of MARKER_RULES) {
      const matches = (r.when.marker ? r.when.marker === i.canonicalId : r.when.panel === i.panel) && (r.when.dir === "any" || r.when.dir === d);
      if (!matches) continue;
      const s = out.get(r.specialist) ?? { specialist: r.specialist, reasons: [], markers: [] };
      if (!s.reasons.includes(r.reason)) s.reasons.push(r.reason);
      if (!s.markers.includes(i.name)) s.markers.push(i.name);
      out.set(r.specialist, s);
      break;
    }
  }
  return [...out.values()].slice(0, 4);
}

export function routeDrugs(classes: (DrugClass | null)[]): Suggestion[] {
  const out = new Map<SpecialistId, Suggestion>([["primary_care", { specialist: "primary_care", reasons: ["rxReview"], markers: [] }]]);
  for (const c of classes) {
    const sp = c && DRUG_CLASS_SPECIALIST[c];
    if (sp && !out.has(sp)) out.set(sp, { specialist: sp, reasons: [`rx_${c}`], markers: [] });
  }
  return [...out.values()].slice(0, 3);
}

export function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${query} near me`)}`;
}

/** English search phrases for map deep links (region config can override). */
export const SPECIALIST_SEARCH: Record<SpecialistId, string> = {
  primary_care: "general physician",
  endocrinologist: "endocrinologist",
  nephrologist: "nephrologist",
  hepatologist: "hepatologist",
  gastroenterologist: "gastroenterologist",
  cardiologist: "cardiologist",
  hematologist: "hematologist",
  rheumatologist: "rheumatologist",
  urologist: "urologist",
  pulmonologist: "pulmonologist",
  neurologist: "neurologist",
  psychiatrist: "psychiatrist",
  dermatologist: "dermatologist",
  gynecologist: "gynecologist",
  infectious_disease: "infectious disease specialist",
};
