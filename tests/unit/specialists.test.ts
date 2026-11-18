import { describe, expect, it } from "vitest";
import { mapsUrl, routeDrugs, routeMarkers } from "@content/specialist-rules";

describe("specialist routing", () => {
  it("always starts with primary care", () => {
    expect(routeMarkers([])[0].specialist).toBe("primary_care");
  });
  it("routes blood sugar and lipids", () => {
    const r = routeMarkers([
      { canonicalId: "hba1c", panel: "blood_sugar", status: "high", name: "HbA1c" },
      { canonicalId: "ldl", panel: "lipids", status: "high", name: "LDL" },
      { canonicalId: "tsh", panel: "thyroid", status: "in_range", name: "TSH" },
    ]).map((s) => s.specialist);
    expect(r).toEqual(["primary_care", "endocrinologist", "cardiologist"]);
  });
  it("ignores in-range results and minor CBC indices", () => {
    const r = routeMarkers([{ canonicalId: "mcv", panel: "cbc", status: "low", name: "MCV" }]);
    expect(r.map((s) => s.specialist)).toEqual(["primary_care"]);
  });
  it("routes kidney and electrolytes to nephrology once", () => {
    const r = routeMarkers([
      { canonicalId: "creatinine", panel: "kidney", status: "high", name: "Creatinine" },
      { canonicalId: "potassium", panel: "electrolytes", status: "critical_high", name: "Potassium" },
    ]);
    const neph = r.find((s) => s.specialist === "nephrologist")!;
    expect(neph.markers).toEqual(["Creatinine", "Potassium"]);
  });
  it("maps drug classes", () => {
    expect(routeDrugs(["blood_sugar", "blood_pressure", null]).map((s) => s.specialist)).toEqual(["primary_care", "endocrinologist", "cardiologist"]);
  });
  it("builds a maps deep link", () => {
    expect(mapsUrl("general physician")).toBe("https://www.google.com/maps/search/general%20physician%20near%20me");
  });
});
