import { describe, expect, it } from "vitest";
import { normalizeMarker, parseNumeric } from "./normalize";

const row = (o: Partial<Parameters<typeof normalizeMarker>[0]>) => ({
  marker: "Fasting Blood Sugar", value: "92", unit: "mg/dL", referenceRangeText: "70 - 100",
  referenceRangeLow: null, referenceRangeHigh: null, labFlag: null, confidence: 0.98, ...o,
});

describe("parseNumeric", () => {
  it.each([["6.1", 6.1], ["6,1", 6.1], ["1,234", 1234], ["<0.5", 0.5], ["> 90", 90], ["Negative", null], ["", null]])(
    "%s", (t, v) => expect(parseNumeric(t).value).toBe(v));
});

describe("normalizeMarker", () => {
  it("maps synonyms and computes status from the printed range", () => {
    const n = normalizeMarker(row({ value: "108" }), 0);
    expect(n.canonicalId).toBe("glucose_fasting");
    expect(n.status).toBe("high");
    expect(n.refLow).toBe(70);
  });
  it("prefers explicit numeric bounds over range text", () => {
    expect(normalizeMarker(row({ value: "105", referenceRangeLow: 70, referenceRangeHigh: 110 }), 0).status).toBe("in_range");
  });
  it("no printed range → no_range (never invents one)", () => {
    expect(normalizeMarker(row({ referenceRangeText: null }), 0).status).toBe("no_range");
  });
  it("handles SI-unit reports with SI ranges without converting", () => {
    const n = normalizeMarker(row({ value: "6.0", unit: "mmol/L", referenceRangeText: "3.9 - 5.5" }), 0);
    expect(n.status).toBe("high");
    expect(n.canonicalValue).toBeCloseTo(108.1, 0);
  });
  it("escalates past conservative thresholds in canonical units", () => {
    expect(normalizeMarker(row({ value: "450" }), 0).status).toBe("critical_high");
    expect(normalizeMarker(row({ value: "25.0", unit: "mmol/L", referenceRangeText: "3.9 - 5.5" }), 0).status).toBe("critical_high");
  });
  it("never escalates when the unit is unrecognised", () => {
    expect(normalizeMarker(row({ value: "450", unit: "furlongs" }), 0).status).toBe("high");
  });
  it("honours lab critical flags", () => {
    expect(normalizeMarker(row({ marker: "Potassium", value: "6.0", unit: "mmol/L", referenceRangeText: "3.5-5.1", labFlag: "HH" }), 0).status).toBe("critical_high");
  });
  it("flags low confidence for confirmation", () => {
    expect(normalizeMarker(row({ confidence: 0.6 }), 0).needsConfirm).toBe(true);
    expect(normalizeMarker(row({}), 0).needsConfirm).toBe(false);
  });
  it("keeps unknown markers, without inventing a canonical id", () => {
    const n = normalizeMarker(row({ marker: "Mystery Enzyme X", unit: "U/L", value: "40", referenceRangeText: "10-50" }), 0);
    expect(n.canonicalId).toBeNull();
    expect(n.status).toBe("in_range");
  });
});
