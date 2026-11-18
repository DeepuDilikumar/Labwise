import { describe, expect, it } from "vitest";
import { MARKER_DEFS } from "@content/markers";
import { allMarkers, convert, findMarker, markerById, resolveUnit, unitFor } from "./index";

const m = (id: string) => markerById(id)!;
const close = (a: number, b: number, tol = 0.01) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);

describe("knowledge file", () => {
  it("has 40+ markers, all flagged for clinical review", () => {
    expect(allMarkers().length).toBeGreaterThanOrEqual(40);
    for (const d of MARKER_DEFS) expect(d.reviewedByDoctor).toBe(false);
  });
  it("every marker's canonical and SI unit exist in its unit list", () => {
    for (const d of MARKER_DEFS) {
      expect(d.units.some((u) => u.unit === d.canonicalUnit), d.id).toBe(true);
      expect(d.units.some((u) => u.unit === d.siUnit), d.id).toBe(true);
      expect(d.units.find((u) => u.unit === d.canonicalUnit)).toMatchObject({ a: 1, b: 0 });
    }
  });
  it("synonyms are unique across markers", () => {
    const seen = new Map<string, string>();
    for (const d of MARKER_DEFS)
      for (const s of d.synonyms) {
        const k = s.toLowerCase();
        expect(seen.get(k) ?? d.id, `${s} in ${seen.get(k)} and ${d.id}`).toBe(d.id);
        seen.set(k, d.id);
      }
  });
});

describe("synonym mapping", () => {
  it.each([
    ["Hb", "haemoglobin"],
    ["Haemoglobin", "haemoglobin"],
    ["Hemoglobin", "haemoglobin"],
    ["HEMOGLOBIN (HGB)", "haemoglobin"],
    ["S. Creatinine", "creatinine"],
    ["SGPT", "alt"],
    ["ALT (SGPT)", "alt"],
    ["TSH (Ultrasensitive)", "tsh"],
    ["Glucose, Fasting", "glucose_fasting"],
    ["Total Leucocyte Count", "wbc"],
    ["Vitamin D (25-OH)", "vitamin_d"],
    ["LDL Cholesterol (Calculated)", "ldl"],
    ["Platelet Count", "platelets"],
    ["eGFR (CKD-EPI)", "egfr"],
  ])("%s → %s", (raw, id) => expect(findMarker(raw)?.id).toBe(id));
  it("returns null instead of guessing", () => {
    expect(findMarker("Mystery Enzyme X")).toBeNull();
  });
});

describe("unit conversions", () => {
  it("glucose mg/dL ↔ mmol/L", () => {
    const g = m("glucose_fasting");
    close(convert(100, unitFor(g, "conventional"), unitFor(g, "si")), 5.55);
    close(convert(5.55, unitFor(g, "si"), unitFor(g, "conventional")), 100, 0.1);
  });
  it("cholesterol mg/dL ↔ mmol/L", () => {
    const c = m("cholesterol_total");
    close(convert(200, unitFor(c, "conventional"), unitFor(c, "si")), 5.17);
  });
  it("triglycerides use their own factor", () => {
    const t = m("triglycerides");
    close(convert(150, unitFor(t, "conventional"), unitFor(t, "si")), 1.69);
  });
  it("creatinine mg/dL ↔ µmol/L", () => {
    const c = m("creatinine");
    close(convert(1.0, unitFor(c, "conventional"), unitFor(c, "si")), 88.42, 0.05);
    close(convert(88.42, unitFor(c, "si"), unitFor(c, "conventional")), 1.0);
  });
  it("haemoglobin g/dL ↔ g/L", () => {
    const h = m("haemoglobin");
    close(convert(13.5, unitFor(h, "conventional"), unitFor(h, "si")), 135);
  });
  it("HbA1c is affine (% ↔ mmol/mol), not proportional", () => {
    const a = m("hba1c");
    close(convert(6.5, unitFor(a, "conventional"), unitFor(a, "si")), 47.5, 0.5);
    close(convert(48, unitFor(a, "si"), unitFor(a, "conventional")), 6.54, 0.02);
  });
  it("Indian 'lakh/cumm' platelets convert to 10^3/µL", () => {
    const p = m("platelets");
    const lakh = resolveUnit(p, "Lakhs/cumm")!;
    close(convert(2.5, lakh, unitFor(p, "conventional")), 250);
  });
  it("ranges convert with the same function as values, preserving order and status", () => {
    const g = m("glucose_fasting");
    const [conv, si] = [unitFor(g, "conventional"), unitFor(g, "si")];
    const lo = convert(70, conv, si), hi = convert(100, conv, si), v = convert(108, conv, si);
    expect(lo).toBeLessThan(hi);
    expect(v).toBeGreaterThan(hi);
  });
  it("round-trips every marker's units", () => {
    for (const d of allMarkers())
      for (const u of d.units) {
        const back = convert(convert(42, u, unitFor(d, "conventional")), unitFor(d, "conventional"), u);
        close(back, 42, 1e-9);
      }
  });
  it("resolves unit aliases and rejects unknown units", () => {
    expect(resolveUnit(m("glucose_fasting"), "mg/dl")?.unit).toBe("mg/dL");
    expect(resolveUnit(m("glucose_fasting"), "MMOL/L")?.unit).toBe("mmol/L");
    expect(resolveUnit(m("tsh"), "uIU/mL")?.unit).toBe("µIU/mL");
    expect(resolveUnit(m("glucose_fasting"), "g/L")).toBeNull();
  });
});
