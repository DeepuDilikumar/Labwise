import { describe, expect, it } from "vitest";
import { gaugeGeometry, toneFor } from "./gauge";

describe("gaugeGeometry", () => {
  it("centres the band for a two-sided range", () => {
    const g = gaugeGeometry(100, { low: 70, high: 100 });
    expect(g.bandStart).toBeGreaterThan(0);
    expect(g.bandEnd).toBeLessThan(1);
    expect(g.value).toBeCloseTo(g.bandEnd, 5);
  });
  it("pins far-out values to the edge and flags them", () => {
    const g = gaugeGeometry(900, { low: 70, high: 100 });
    expect(g.value).toBe(1);
    expect(g.offScaleHigh).toBe(true);
  });
  it("handles upper-only ranges like <200", () => {
    const g = gaugeGeometry(150, { low: null, high: 200 });
    expect(g.bandStart).toBe(0);
    expect(g.value).toBeLessThan(g.bandEnd);
  });
  it("handles lower-only ranges like >40", () => {
    const g = gaugeGeometry(35, { low: 40, high: null });
    expect(g.bandEnd).toBe(1);
    expect(g.value).toBeLessThan(g.bandStart);
  });
});

describe("toneFor", () => {
  it("is borderline just above the range", () => {
    expect(toneFor("high", 102, { low: 70, high: 100 })).toBe("borderline");
  });
  it("is out further above the range", () => {
    expect(toneFor("high", 130, { low: 70, high: 100 })).toBe("out");
  });
  it("maps critical and neutral", () => {
    expect(toneFor("critical_high", 600, { low: 70, high: 100 })).toBe("critical");
    expect(toneFor("no_range", 5, { low: null, high: null })).toBe("neutral");
    expect(toneFor("in_range", 85, { low: 70, high: 100 })).toBe("ok");
  });
});
