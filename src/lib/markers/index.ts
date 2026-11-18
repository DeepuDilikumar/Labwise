import { MARKER_DEFS } from "@content/markers";
import type { UnitSystem } from "@regions";
import type { MarkerDef, UnitDef } from "./types";

export * from "./types";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”"'`]/g, "")
    .replace(/\s*[,:]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const BY_ID = new Map(MARKER_DEFS.map((m) => [m.id, m]));
const BY_SYNONYM = new Map<string, MarkerDef>();
for (const m of MARKER_DEFS) for (const s of [m.name, ...m.synonyms]) BY_SYNONYM.set(norm(s), m);

export const allMarkers = (): readonly MarkerDef[] => MARKER_DEFS;
export const markerById = (id: string | null | undefined) => (id ? BY_ID.get(id) ?? null : null);

/**
 * Maps a printed marker name to a canonical marker. Exact synonym match first, then a
 * cleaned variant (strip method/specimen notes in brackets, "serum"/"s." prefixes).
 * Returns null rather than guessing.
 */
export function findMarker(rawName: string): MarkerDef | null {
  const n = norm(rawName);
  const direct = BY_SYNONYM.get(n);
  if (direct) return direct;
  const cleaned = norm(
    n
      .replace(/\((?:method|by|calculated|direct|serum|plasma|whole blood|edta|ckd-epi|westergren|[^)]*method[^)]*)\)/g, "")
      .replace(/^(serum|s\.|plasma|blood)\s+/, "")
      .replace(/\b(level|levels|test)\b/g, ""),
  );
  return BY_SYNONYM.get(cleaned) ?? null;
}

const normUnit = (u: string) =>
  u.toLowerCase().replace(/\s+/g, "").replace(/μ/g, "µ").replace(/mcg/g, "µg").replace(/^u(?=[gmil])/, "µ").replace(/\*/g, "x");

/** Finds the unit definition for a printed unit, or null if unknown for this marker. */
export function resolveUnit(m: MarkerDef, rawUnit: string | null | undefined): UnitDef | null {
  const u = normUnit(rawUnit ?? "");
  for (const def of m.units) {
    if (normUnit(def.unit) === u) return def;
    if (def.aliases.some((a) => normUnit(a) === u)) return def;
  }
  // A missing unit is only acceptable when the canonical unit is itself empty (e.g. specific gravity).
  if (!u && m.canonicalUnit === "") return m.units[0];
  return null;
}

export function unitFor(m: MarkerDef, system: UnitSystem): UnitDef {
  const target = system === "si" ? m.siUnit : m.canonicalUnit;
  return m.units.find((d) => d.unit === target) ?? m.units[0];
}

export const toCanonical = (value: number, from: UnitDef) => from.a * value + from.b;
export const fromCanonical = (value: number, to: UnitDef) => (value - to.b) / to.a;

/**
 * Converts a value printed in `from` into `to`. Ranges must be converted with this same
 * function, bound by bound, so value and range always stay consistent.
 */
export function convert(value: number, from: UnitDef, to: UnitDef): number {
  if (from === to) return value;
  return fromCanonical(toCanonical(value, from), to);
}

export function formatValue(n: number, decimals: number, locale = "en"): string {
  return n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false });
}
