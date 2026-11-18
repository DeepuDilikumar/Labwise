import { describe, expect, it } from "vitest";
import { computeStatus, parseRangeText } from "./compute";

describe("parseRangeText", () => {
  it.each([
    ["70-100", 70, 100],
    ["70 – 100", 70, 100],
    ["4.0 to 5.6", 4, 5.6],
    ["13,5 - 17,5", 13.5, 17.5],
  ])("two-sided %s", (t, lo, hi) => {
    expect(parseRangeText(t)).toMatchObject({ low: lo, high: hi });
  });
  it("upper only", () => {
    expect(parseRangeText("<5")).toEqual({ low: null, high: 5, lowInclusive: true, highInclusive: false });
    expect(parseRangeText("Up to 200")).toMatchObject({ low: null, high: 200, highInclusive: true });
    expect(parseRangeText("≤ 5.0")).toMatchObject({ high: 5, highInclusive: true });
  });
  it("lower only", () => {
    expect(parseRangeText("> 40")).toMatchObject({ low: 40, high: null, lowInclusive: false });
    expect(parseRangeText(">= 40")).toMatchObject({ low: 40, lowInclusive: true });
  });
  it("rejects nonsense and reversed ranges", () => {
    expect(parseRangeText("see note")).toBeNull();
    expect(parseRangeText("100-70")).toBeNull();
    expect(parseRangeText("")).toBeNull();
  });
});

describe("computeStatus", () => {
  it("is in range exactly at both bounds", () => {
    expect(computeStatus({ value: 70, low: 70, high: 100 })).toBe("in_range");
    expect(computeStatus({ value: 100, low: 70, high: 100 })).toBe("in_range");
  });
  it("detects low and high", () => {
    expect(computeStatus({ value: 69.9, low: 70, high: 100 })).toBe("low");
    expect(computeStatus({ value: 100.1, low: 70, high: 100 })).toBe("high");
  });
  it("respects strict '<5' bounds", () => {
    expect(computeStatus({ value: 5, high: 5, highInclusive: false })).toBe("high");
    expect(computeStatus({ value: 4.9, high: 5, highInclusive: false })).toBe("in_range");
  });
  it("missing range → no_range, missing value → unparsed", () => {
    expect(computeStatus({ value: 12 })).toBe("no_range");
    expect(computeStatus({ value: null, low: 1, high: 2 })).toBe("unparsed");
  });
  it("lab critical flags override", () => {
    expect(computeStatus({ value: 6.8, low: 3.5, high: 5.1, labFlag: "HH" })).toBe("critical_high");
    expect(computeStatus({ value: 2.4, low: 3.5, high: 5.1, labFlag: "Critical" })).toBe("critical_low");
  });
  it("plain H/L flags do not escalate", () => {
    expect(computeStatus({ value: 101, low: 70, high: 100, labFlag: "H" })).toBe("high");
  });
  it("hard-coded thresholds escalate", () => {
    expect(computeStatus({ value: 450, low: 70, high: 100, critical: { above: 400 } })).toBe("critical_high");
    expect(computeStatus({ value: 45, low: 70, high: 100, critical: { below: 50 } })).toBe("critical_low");
  });
});
